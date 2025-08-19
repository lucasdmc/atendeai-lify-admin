// services/core/llmOrchestratorService.js
// Versão simplificada que usa APENAS JSONs via ClinicContextManager

import OpenAI from 'openai';
import config from '../config/index.js';
import logger from '../utils/logger.js';

// ✅ IMPORTS SIMPLIFICADOS
import HumanizationHelpers from './humanizationHelpers.js';
import AppointmentFlowManager from './appointmentFlowManager.js';
import ClinicContextManager from './clinicContextManager.js';

// Configuração do Supabase (centralizada)
const supabase = config.getSupabaseClient();

// Configuração do OpenAI
const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
  ...(config.OPENAI_BASE_URL ? { baseURL: config.OPENAI_BASE_URL } : {}),
});

export default class LLMOrchestratorService {
  // ✅ PROPRIEDADES SIMPLIFICADAS
  static humanizationHelpers = HumanizationHelpers;
  static appointmentFlowManager = null;
  static conversationMetrics = new Map();
  
  // ✅ INICIALIZAÇÃO ROBUSTA DO APPOINTMENT FLOW MANAGER
  static async initializeAppointmentFlow() {
    try {
      console.log('🔧 [LLMOrchestrator] Iniciando inicialização do AppointmentFlowManager...');
      
      if (!this.appointmentFlowManager) {
        console.log('🔧 [LLMOrchestrator] Criando nova instância do AppointmentFlowManager...');
        this.appointmentFlowManager = new AppointmentFlowManager(this);
        
        console.log('🔧 [LLMOrchestrator] Inicializando AppointmentFlowManager...');
        await this.appointmentFlowManager.initialize();
        
        console.log('✅ [LLMOrchestrator] AppointmentFlowManager inicializado com sucesso');
        logger.info('AppointmentFlowManager inicializado com sucesso');
        
        // ✅ VALIDAÇÃO: Verificar se realmente foi inicializado
        if (!this.appointmentFlowManager.initialized) {
          throw new Error('AppointmentFlowManager não foi inicializado corretamente');
        }
        
        console.log('✅ [LLMOrchestrator] Validação de inicialização passou');
      } else {
        console.log('✅ [LLMOrchestrator] AppointmentFlowManager já existe e está inicializado');
      }
      
      return this.appointmentFlowManager;
      
    } catch (error) {
      console.error('❌ [LLMOrchestrator] Erro ao inicializar AppointmentFlowManager:', error);
      logger.error('Erro ao inicializar AppointmentFlowManager', { message: error.message });
      
      // 🔧 CORREÇÃO: Limpar instância falhada e tentar novamente
      this.appointmentFlowManager = null;
      
      // 🔧 CORREÇÃO: Retry logic
      try {
        console.log('🔄 [LLMOrchestrator] Tentando reinicialização...');
        this.appointmentFlowManager = new AppointmentFlowManager(this);
        await this.appointmentFlowManager.initialize();
        console.log('✅ [LLMOrchestrator] Reinicialização bem-sucedida');
        return this.appointmentFlowManager;
      } catch (retryError) {
        console.error('❌ [LLMOrchestrator] Falha na reinicialização:', retryError);
        logger.error('Falha na reinicialização do AppointmentFlowManager', { message: retryError.message });
        throw retryError;
      }
    }
  }

  // ✅ PROCESSAMENTO PRINCIPAL DE MENSAGENS
  static async processMessage(request) {
    try {
      const { generateTraceId } = await import('../utils/trace.js');
      const traceId = generateTraceId();
      logger.info('LLMOrchestrator processing', { traceId });

      const { phoneNumber, message, conversationId, userId } = request;

      // Sistema de memória simples
      const { default: ConversationMemoryRepository } = await import('./conversationMemoryRepository.js');
      const memoryRepo = new ConversationMemoryRepository();
      const memory = await memoryRepo.load(phoneNumber);
      
      // Extrair nome do usuário se presente na mensagem
      const extractedName = this.extractUserName(message);
      if (extractedName && !memory.userProfile?.name) {
        memory.userProfile = memory.userProfile || {};
        memory.userProfile.name = extractedName;
        logger.info('Nome extraído e salvo', { traceId, extractedName });
        
        // Salvar nome na tabela conversation_memory
        await memoryRepo.saveName(phoneNumber, extractedName);
      }
      
      // ✅ BUSCAR CONTEXTO APENAS DO JSON (sem banco de dados)
      // 🔧 CORREÇÃO: Identificar clínica baseada no número do WhatsApp
      // Primeiro, precisamos identificar qual clínica está recebendo a mensagem
      // Vamos buscar todas as clínicas e verificar qual tem o número de WhatsApp ativo
      const supabase = config.getSupabaseClient();
      
      // 🔧 CORREÇÃO: Buscar clínica que está recebendo a mensagem
      // Como estamos no webhook, a mensagem está sendo enviada PARA uma clínica
      // Vamos buscar a clínica que tem o número de WhatsApp ativo
      const { data: activeClinics, error: clinicsError } = await supabase
        .from('clinics')
        .select('name, whatsapp_phone, id, has_contextualization')
        .eq('has_contextualization', true);
      
      if (clinicsError) {
        logger.error('[LLMOrchestrator] Erro ao buscar clínicas ativas', { traceId, error: clinicsError.message });
        throw new Error('Erro ao buscar clínicas ativas');
      }
      
      if (!activeClinics || activeClinics.length === 0) {
        logger.error('[LLMOrchestrator] Nenhuma clínica com contextualização encontrada', { traceId });
        throw new Error('Nenhuma clínica com contextualização encontrada');
      }
      
      // 🔧 ROTEAMENTO DETERMINÍSTICO: resolver clínica a partir dos dados do webhook
      const { phoneNumberId, displayPhoneNumber } = request || {};
      const { default: ClinicRoutingRepository } = await import('./clinicRoutingRepository.js');
      const routingRepo = new ClinicRoutingRepository();
      const clinicId = await routingRepo.resolveClinicByWebhook({
        phoneNumberId,
        displayPhoneNumber,
        patientPhone: phoneNumber,
      });

      let clinicKey;
      if (clinicId) {
        // Buscar nome da clínica pelo id
        const { data: clinicRow, error: clinicFetchError } = await supabase
          .from('clinics')
          .select('name')
          .eq('id', clinicId)
          .maybeSingle();
        if (!clinicFetchError && clinicRow?.name) {
          clinicKey = clinicRow.name;
          logger.info('[LLMOrchestrator] Clínica resolvida por roteamento', { traceId, clinicKey, clinicId });
        }
      }

      // Fallback somente se não resolvido por roteamento
      if (!clinicKey) {
        if (activeClinics.length === 1) {
          clinicKey = activeClinics[0].name;
          logger.info('[LLMOrchestrator] Usando única clínica disponível', { traceId, clinicKey });
        } else {
          clinicKey = activeClinics[0].name;
          logger.warn('[LLMOrchestrator] Roteamento não determinístico, usando primeira clínica', { traceId, clinicKey });
        }
      }

      logger.info('[LLMOrchestrator] Clínica selecionada', { traceId, clinicKey });

      let clinicContext;
      try {
        clinicContext = await ClinicContextManager.getClinicContext(clinicKey);
        logger.info('[LLMOrchestrator] Contexto obtido para clínica', { traceId, clinicKey });
      } catch (contextError) {
        logger.error('[LLMOrchestrator] Erro ao obter contexto da clínica', { traceId, clinicKey, error: contextError.message });
        throw new Error(`Não foi possível obter contexto da clínica ${clinicKey}: ${contextError.message}`);
      }

      // Detectar intenção avançada com histórico e contexto
      const conversationHistory = memory.history || [];
      const { default: IntentDetector } = await import('./intentDetector.js');
      const intentDetector = new IntentDetector();
      const intent = await intentDetector.detect(message, conversationHistory, clinicContext);

      // INICIALIZAR APPOINTMENT FLOW MANAGER SE NECESSÁRIO
      if (this.isAppointmentIntent(intent)) {
        await this.initializeAppointmentFlow();
      }

      // Verificar se é primeira conversa do dia
      const isFirstConversationOfDay = await this.isFirstConversationOfDay(phoneNumber);
      logger.info('Primeira conversa do dia?', { traceId, isFirstConversationOfDay });

      // Verificar horário de funcionamento
      const isWithinBusinessHours = this.isWithinBusinessHours(clinicContext);
      logger.info('Dentro do horário de funcionamento?', { traceId, isWithinBusinessHours });

      // Preparar prompt do sistema com perfil do usuário
      const { default: ResponseFormatter } = await import('./responseFormatter.js');
      const systemPrompt = ResponseFormatter.prepareSystemPrompt(clinicContext, memory.userProfile);

      // Filtrar do histórico quaisquer respostas de "fora do horário" quando estamos DENTRO do expediente
      let memoryForPrompt = memory;
      try {
        if (isWithinBusinessHours && Array.isArray(memory.history)) {
          const outOfHoursRegex = /(fora do horário|No momento estamos|próximo horário comercial|Retornaremos seu contato)/i;
          const filteredHistory = memory.history.filter(entry => {
            if (entry && typeof entry === 'object') {
              if (entry.bot && outOfHoursRegex.test(entry.bot)) return false;
              if (entry.role === 'assistant' && entry.content && outOfHoursRegex.test(entry.content)) return false;
            }
            return true;
          });
          if (filteredHistory.length !== memory.history.length) {
            logger.info('Removendo mensagens históricas de fora do horário por estar dentro do expediente', { traceId, removed: memory.history.length - filteredHistory.length });
          }
          memoryForPrompt = { ...memory, history: filteredHistory };
        }
      } catch (e) {
        logger.warn('Falha ao filtrar histórico para fora do horário (seguindo sem filtro)', { message: e.message });
      }

      // Construir mensagens para o LLM usando o histórico filtrado (se aplicável)
      const messages = ResponseFormatter.buildMessages(systemPrompt, memoryForPrompt, message);

      // VERIFICAR SE É INTENÇÃO DE AGENDAMENTO
      if (this.isAppointmentIntent(intent)) {
        logger.info('Intenção de agendamento detectada', { traceId, message });
        
        // 🔧 CORREÇÃO: Validar horário de funcionamento ANTES de processar agendamento
        if (!isWithinBusinessHours) {
          logger.info('Fora do horário de funcionamento', { traceId });
          const outOfHoursMessage = clinicContext.agentConfig?.mensagem_fora_horario || 
            'No momento estamos fora do horário de atendimento. Retornaremos seu contato no próximo horário comercial.';
          
          return {
            response: outOfHoursMessage,
            intent: intent,
            toolsUsed: ['clinic_context', 'business_hours_validation'],
            metadata: {
              clinic: clinicContext.name,
              agent: clinicContext.agentConfig?.nome,
              businessHoursValidation: 'REJECTED_OUT_OF_HOURS'
            }
          };
        }
        
        try {
          // 🔧 CORREÇÃO: Garantir que AppointmentFlowManager está inicializado
          console.log('🔧 [LLMOrchestrator] Verificando AppointmentFlowManager...');
          if (!this.appointmentFlowManager) {
            console.log('🔧 [LLMOrchestrator] AppointmentFlowManager não encontrado, inicializando...');
            await this.initializeAppointmentFlow();
          }
          
          // 🔧 CORREÇÃO: Validar se AppointmentFlowManager foi inicializado com sucesso
          if (!this.appointmentFlowManager || !this.appointmentFlowManager.initialized) {
            console.error('❌ [LLMOrchestrator] AppointmentFlowManager não está disponível após inicialização');
            throw new Error('AppointmentFlowManager não está disponível');
          }
          
          console.log('✅ [LLMOrchestrator] AppointmentFlowManager validado, roteando...');
          logger.info('Roteando para ferramenta apropriada...', { traceId });
          
          const { default: ToolsRouter } = await import('./toolsRouter.js');
          const toolsRouter = new ToolsRouter({ appointmentFlowManager: this.appointmentFlowManager });
          
          console.log('🔧 [LLMOrchestrator] ToolsRouter criado, chamando roteamento...');
          const appointmentResult = await toolsRouter.route({
            phoneNumber,
            message,
            intent,
            clinicContext,
            memory,
            traceId,
          });
          
          console.log('✅ [LLMOrchestrator] Resultado do roteamento:', {
            hasResult: !!appointmentResult,
            hasResponse: !!appointmentResult?.response,
            hasError: !!appointmentResult?.error,
            flowStep: appointmentResult?.metadata?.flowStep
          });
          
          logger.info('Resultado do AppointmentFlowManager obtido', { traceId, success: !!appointmentResult?.success });
          
          if (appointmentResult && appointmentResult.success) {
            return appointmentResult;
          } else if (appointmentResult && appointmentResult.response) {
            return appointmentResult;
          }
          
          // 🔧 CORREÇÃO: Se não há resultado válido, retornar erro
          console.warn('⚠️ [LLMOrchestrator] AppointmentFlowManager não retornou resultado válido');
          return {
            response: 'Desculpe, não consegui processar sua solicitação de agendamento. Por favor, tente novamente ou entre em contato pelo telefone.',
            intent: { name: 'APPOINTMENT_ERROR', confidence: 0.8 },
            toolsUsed: ['appointment_flow'],
            metadata: { error: 'no_valid_result', flowStep: 'error' }
          };
          
        } catch (error) {
          console.error('❌ [LLMOrchestrator] Erro no AppointmentFlowManager:', error);
          logger.error('Erro no AppointmentFlowManager', { traceId, error: error.message });
          
          // 🔧 CORREÇÃO: Retornar resposta de erro útil
          return {
            response: 'Desculpe, ocorreu um erro técnico no sistema de agendamento. Por favor, entre em contato conosco pelo telefone para agendar sua consulta.',
            intent: { name: 'APPOINTMENT_ERROR', confidence: 0.8 },
            toolsUsed: ['appointment_flow'],
            metadata: { error: 'appointment_flow_error', errorMessage: error.message }
          };
        }
      }

      // 🔧 CORREÇÃO: Verificar se há fluxo de agendamento ativo para continuar
      if (this.appointmentFlowManager && await this.appointmentFlowManager.hasActiveFlow(phoneNumber)) {
        logger.info('Fluxo de agendamento ativo detectado, continuando...', { traceId });
        
        try {
          const flowState = await this.appointmentFlowManager.getFlowState(phoneNumber);
          logger.info('Estado atual do fluxo', { traceId, step: flowState.step });
          
          const continuation = await this.appointmentFlowManager.continueExistingFlow(
            phoneNumber, message, clinicContext, memory, flowState
          );
          
          logger.info('Continuação do fluxo concluída', { traceId });
          return continuation;
        } catch (error) {
          logger.error('Erro ao continuar fluxo de agendamento', { traceId, error: error.message });
        }
      }

      // ✅ PROCESSAMENTO NORMAL COM LLM
      logger.info('Processando com OpenAI...', { traceId });
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });
      
      const response = completion.choices[0].message.content;
      
      // ✅ APLICAR LÓGICA DE RESPOSTA (saudação, horário, sanitização)
      const finalResponse = await this.applyResponseLogic(
        response,
        clinicContext,
        isFirstConversationOfDay,
        isWithinBusinessHours,
        memory.userProfile,
        conversationHistory
      );
      
      // Salvar na memória
      await memoryRepo.append(phoneNumber, message, finalResponse, intent, memory.userProfile, memory.history);
      
      logger.info('Resposta final gerada', { traceId });
      
      return {
        response: finalResponse,
        intent: intent,
        toolsUsed: ['openai', 'clinic_context'],
        metadata: {
          model: 'gpt-4o-mini',
          tokens: completion.usage?.total_tokens || 0,
          clinic: clinicContext.name,
          agent: clinicContext.agentConfig?.nome
        }
      };
    } catch (error) {
      logger.error('Erro no processamento principal', { message: error.message });
      throw error;
    }
  }

  // ✅ FUNÇÃO REMOVIDA: Agora usa ClinicContextManager diretamente

  // ✅ FUNÇÕES AUXILIARES
  static extractUserName(message) {
    // Lógica para extrair nome do usuário
    const namePatterns = [
      /meu nome é (\w+)/i,
      /sou o (\w+)/i,
      /sou a (\w+)/i,
      /chamo-me (\w+)/i,
      /me chamo (\w+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  static async saveUserName(phoneNumber, name) {
    try {
      const { error } = await supabase
        .from('conversation_memory')
        .upsert({
          phone_number: phoneNumber,
          user_name: JSON.stringify({
            name: name,
            extracted_at: new Date().toISOString()
          }),
          last_interaction: new Date().toISOString()
        }, { onConflict: 'phone_number' });
      
      if (error) throw error;
      console.log(`✅ Nome salvo para ${phoneNumber}: ${name}`);
    } catch (error) {
      console.error('❌ Erro ao salvar nome:', error);
    }
  }

  static async loadConversationMemory(phoneNumber) {
    try {
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('memory_data, user_name')
        .eq('phone_number', phoneNumber)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        let userProfile = {};
        
        // Extrair nome do usuário do user_name (JSON string)
        if (data.user_name) {
          try {
            if (typeof data.user_name === 'string') {
              if (data.user_name.startsWith('{') && data.user_name.endsWith('}')) {
                const parsedUserName = JSON.parse(data.user_name);
                userProfile.name = parsedUserName.name;
              } else {
                userProfile.name = data.user_name;
              }
            } else if (data.user_name.name) {
              userProfile.name = data.user_name.name;
            }
          } catch (error) {
            console.error('Error parsing user_name:', error);
            userProfile.name = data.user_name;
          }
        }
        
        return {
          userProfile: userProfile,
          history: data.memory_data?.history || [],
          lastUpdated: data.last_interaction
        };
      }
      
      return {
        userProfile: {},
        history: [],
        lastUpdated: null
      };
    } catch (error) {
      console.error('❌ Erro ao carregar memória:', error);
      return {
        userProfile: {},
        history: [],
        lastUpdated: null
      };
    }
  }

  static async saveConversationMemory(phoneNumber, userMessage, botResponse, intent) {
    try {
      const memory = await this.loadConversationMemory(phoneNumber);
      
      const newHistory = [
        ...memory.history,
        {
          timestamp: new Date().toISOString(),
          user: userMessage,
          bot: botResponse,
          intent: intent?.name || 'UNKNOWN'
        }
      ];
      
      // Manter apenas as últimas 10 mensagens
      const trimmedHistory = newHistory.slice(-10);
      
      const { error } = await supabase
        .from('conversation_memory')
        .upsert({
          phone_number: phoneNumber,
          memory_data: {
            history: trimmedHistory,
            userProfile: memory.userProfile
          },
          last_interaction: new Date().toISOString()
        }, { onConflict: 'phone_number' });
      
      if (error) throw error;
      console.log('✅ Memória de conversa salva');
    } catch (error) {
      console.error('❌ Erro ao salvar memória:', error);
    }
  }

  /**
   * Detecta intenção da mensagem usando LLM avançado
   * @param {string} message - Mensagem do usuário
   * @param {Array} conversationHistory - Histórico da conversa
   * @param {Object} clinicContext - Contexto da clínica
   */
  static async detectIntent(message, conversationHistory = [], clinicContext = {}) {
    try {
      console.log('🎯 [LLMOrchestrator] Detectando intenção avançada com LLM:', { 
        messageLength: message.length,
        historyLength: conversationHistory.length,
        hasClinicContext: !!clinicContext
      });

      // 🔧 CORREÇÃO: Usar sistema avançado de detecção de intenção
      const prompt = `You are an intent recognition system for a medical clinic's WhatsApp chatbot.
Analyze the user message and conversation history to identify the intent.

Available intents:
- APPOINTMENT_CREATE: User wants to schedule an appointment
- APPOINTMENT_RESCHEDULE: User wants to change an existing appointment
- APPOINTMENT_CANCEL: User wants to cancel an appointment
- APPOINTMENT_LIST: User wants to see their appointments
- INFO_HOURS: Asking about clinic hours
- INFO_LOCATION: Asking about clinic address/location
- INFO_SERVICES: Asking about available services/specialties
- INFO_DOCTORS: Asking about doctors/professionals
- INFO_PRICES: Asking about prices/insurance
- INFO_GENERAL: General information questions
- GREETING: Greeting messages
- FAREWELL: Goodbye messages
- HUMAN_HANDOFF: User wants to speak with a human
- UNCLEAR: Intent is not clear

Extract entities like: dates, times, doctor names, services, symptoms, etc.

Current message: "${message}"

Conversation history:
${conversationHistory.map(h => `${h.role}: ${h.content}`).join('\n')}

Clinic context:
- Services: ${JSON.stringify(clinicContext.services || [])}
- Doctors: ${JSON.stringify(clinicContext.professionals || [])}

Return a JSON with: { "intent": "INTENT_NAME", "confidence": 0.0-1.0, "entities": {}, "reasoning": "brief explanation" }`;

      // 🔧 CORREÇÃO: Usar OpenAI para detecção inteligente
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Usar modelo mais econômico para detecção
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content;
      console.log('🤖 [LLMOrchestrator] Resposta do LLM para detecção:', response);

      let intentData;
      try {
        // Limpar a resposta removendo markdown e extraindo apenas o JSON
        let cleanResponse = response;
        
        // Remover ```json e ``` se presentes
        cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Se ainda não for JSON válido, tentar extrair JSON do texto
        if (!cleanResponse.trim().startsWith('{')) {
          const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanResponse = jsonMatch[0];
          }
        }
        
        intentData = JSON.parse(cleanResponse.trim());
      } catch (parseError) {
        console.error('❌ [LLMOrchestrator] Erro ao fazer parse da resposta LLM:', parseError);
        console.error('❌ [LLMOrchestrator] Resposta original:', response);
        console.log('🔄 Usando fallback com keywords...');
        return this.fallbackIntentRecognition(message);
      }

      console.log('✅ [LLMOrchestrator] Intenção detectada pelo LLM:', {
        intent: intentData.intent,
        confidence: intentData.confidence,
        entities: intentData.entities,
        reasoning: intentData.reasoning
      });

      return {
        name: intentData.intent,
        confidence: intentData.confidence || 0.8,
        entities: intentData.entities || {},
        requiresAction: this.isAppointmentIntent(intentData.intent),
        category: this.mapIntentToCategory(intentData.intent)
      };

    } catch (error) {
      console.error('❌ [LLMOrchestrator] Erro na detecção avançada de intenção:', error);
      console.log('🔄 Usando fallback com keywords...');
      return this.fallbackIntentRecognition(message);
    }
  }

  static fallbackIntentRecognition(message) {
    const lowerMessage = message.toLowerCase();
    
    // Padrões mais específicos
    if (lowerMessage.includes('horário') || lowerMessage.includes('funcionamento')) {
      return { name: 'SCHEDULE_INFO', confidence: 0.7 };
    }
    
    if (lowerMessage.includes('preço') || lowerMessage.includes('valor') || lowerMessage.includes('custo')) {
      return { name: 'PRICING_INFO', confidence: 0.7 };
    }
    
    if (lowerMessage.includes('endereço') || lowerMessage.includes('localização')) {
      return { name: 'LOCATION_INFO', confidence: 0.7 };
    }
    
    if (lowerMessage.includes('telefone') || lowerMessage.includes('contato')) {
      return { name: 'CONTACT_INFO', confidence: 0.7 };
    }
    
    // Padrão genérico
    return { name: 'GENERAL_QUERY', confidence: 0.5 };
  }

  static containsAppointmentKeywords(message) {
    // 🔧 CORREÇÃO: Expandir keywords para melhor detecção de agendamento
    const keywords = [
      'agendar', 'consulta', 'marcar', 'agendamento', 'marcação',
      'realizar', 'fazer', 'quero', 'preciso', 'gostaria',
      'agendar consulta', 'marcar consulta', 'agendar exame',
      'marcar exame', 'agendar horário', 'marcar horário',
      'agendar atendimento', 'marcar atendimento'
    ];
    
    const lowerMessage = message.toLowerCase();
    const hasKeyword = keywords.some(keyword => lowerMessage.includes(keyword));
    
    console.log('🔍 Verificando keywords de agendamento:', {
      message: message,
      lowerMessage: lowerMessage,
      keywords: keywords,
      hasKeyword: hasKeyword
    });
    
    return hasKeyword;
  }

  static containsInfoKeywords(message) {
    const keywords = ['informação', 'saber', 'conhecer', 'quais', 'como', 'onde', 'quando'];
    return keywords.some(keyword => message.includes(keyword));
  }

  static containsGreetingKeywords(message) {
    const keywords = ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite'];
    return keywords.some(keyword => message.includes(keyword));
  }

  static isAppointmentIntent(intent) {
    // 🔧 CORREÇÃO: Verificar se intent existe e tem propriedades válidas
    if (!intent || !intent.name) {
      console.log('🔍 Intent inválido ou sem nome:', intent);
      return false;
    }
    
    // 🔧 CORREÇÃO: Expandir reconhecimento para intenções específicas do LLM
    const appointmentIntents = [
      'APPOINTMENT', 'APPOINTMENT_CREATE', 'APPOINTMENT_SCHEDULE',
      'SCHEDULE_INFO', 'SCHEDULING', 'BOOKING', 'BOOK_APPOINTMENT',
      // Novas intenções específicas do LLM
      'APPOINTMENT_RESCHEDULE', 'APPOINTMENT_CANCEL', 'APPOINTMENT_LIST'
    ];
    
    const result = appointmentIntents.includes(intent.name) || 
                  (typeof intent.name === 'string' && intent.name.includes('APPOINTMENT')) ||
                  (typeof intent.name === 'string' && intent.name.includes('SCHEDULE')) ||
                  (typeof intent.name === 'string' && intent.name.includes('BOOKING'));
    
    console.log('🔍 Verificando se é intenção de agendamento:', {
      intent: intent.name,
      isAppointment: result,
      checkedIntents: appointmentIntents
    });
    
    return result;
  }

  static mapIntentToCategory(intentName) {
    // 🔧 CORREÇÃO: Expandir categorias para intenções específicas do LLM
    const categories = {
      // Intenções de agendamento
      'APPOINTMENT': 'scheduling',
      'APPOINTMENT_CREATE': 'scheduling',
      'APPOINTMENT_SCHEDULE': 'scheduling',
      'APPOINTMENT_RESCHEDULE': 'scheduling',
      'APPOINTMENT_CANCEL': 'scheduling',
      'APPOINTMENT_LIST': 'scheduling',
      
      // Intenções de informação
      'INFORMATION': 'information',
      'INFO_HOURS': 'information',
      'INFO_LOCATION': 'information',
      'INFO_SERVICES': 'information',
      'INFO_DOCTORS': 'information',
      'INFO_PRICES': 'information',
      'INFO_GENERAL': 'information',
      
      // Intenções de conversação
      'GREETING': 'conversation',
      'FAREWELL': 'conversation',
      
      // Intenções especiais
      'SCHEDULE_INFO': 'information',
      'SCHEDULING': 'scheduling',
      'BOOKING': 'scheduling',
      'BOOK_APPOINTMENT': 'scheduling',
      'HUMAN_HANDOFF': 'escalation',
      'UNCLEAR': 'clarification'
    };
    
    return categories[intentName] || 'general';
  }

  // ✅ PREPARAÇÃO DO PROMPT DO SISTEMA
  static prepareSystemPrompt(clinicContext, userProfile = null) {
    // ✅ CONFIGURAÇÕES DO AGENTE IA DO JSON
    const agentConfig = clinicContext.agentConfig || {};
    const agentBehavior = clinicContext.agentBehavior || {};
    const agentRestrictions = clinicContext.agentRestrictions || {};
    
    // Nome do agente (padrão ou do JSON)
    const agentName = agentConfig.nome || 'Assistente Virtual';
    
    // Personalidade do agente (padrão ou do JSON)
    const agentPersonality = agentConfig.personalidade || 'profissional, empática e prestativa';
    
    // Tom de comunicação (padrão ou do JSON)
    const communicationTone = agentConfig.tom_comunicacao || 'Formal mas acessível';
    
    // Nível de formalidade (padrão ou do JSON)
    const formalityLevel = agentConfig.nivel_formalidade || 'Médio';
    
    // Saudação inicial (padrão ou do JSON)
    const initialGreeting = agentConfig.saudacao_inicial || `Olá! Sou o ${agentName}, assistente virtual da ${clinicContext.name}. Como posso ajudá-lo hoje?`;
    
    // Mensagem de despedida (padrão ou do JSON)
    const farewellMessage = agentConfig.mensagem_despedida || 'Obrigado por escolher nossa clínica. Até breve!';
    
    // Mensagem fora do horário (padrão ou do JSON)
    const outOfHoursMessage = agentConfig.mensagem_fora_horario || 'No momento estamos fora do horário de atendimento. Retornaremos seu contato no próximo horário comercial.';
    
    // ✅ RESTRIÇÕES ESPECÍFICAS DO JSON
    const restrictions = [];
    if (agentRestrictions.nao_pode_diagnosticar) {
      restrictions.push('NUNCA faça diagnósticos médicos');
    }
    if (agentRestrictions.nao_pode_prescrever) {
      restrictions.push('NUNCA prescreva medicamentos');
    }
    
    // ✅ EMERGÊNCIAS CARDÍACAS DO JSON (se configuradas)
    const cardiacEmergencies = agentRestrictions.emergencias_cardiacas || [];
    
    let prompt = `Você é ${agentName}, assistente virtual da ${clinicContext.name}.
Sua personalidade é: ${agentPersonality}
Tom de comunicação: ${communicationTone}
Nível de formalidade: ${formalityLevel}

DIRETRIZES FUNDAMENTAIS:
1. Use EXCLUSIVAMENTE as informações fornecidas no contexto da clínica
2. Seja sempre cordial, profissional e empático
3. Para agendamentos, oriente o usuário sobre o processo
4. Se não souber uma informação, diga educadamente que não possui essa informação
5. ${restrictions.length > 0 ? restrictions.join(', ') : 'NUNCA invente informações ou dê conselhos médicos'}
6. Mantenha respostas concisas e objetivas (máximo 3 parágrafos)
7. 🔧 CRÍTICO: Use SEMPRE o nome do usuário quando disponível para personalizar a conversa
8. Se o usuário perguntar sobre seu nome, responda com: "${agentName}"
9. 🔧 CRÍTICO: NUNCA adicione saudações como "Olá", "Sou o Cardio" ou "assistente virtual da CardioPrime" no início das respostas
10. 🔧 CRÍTICO: NUNCA adicione mensagens finais como "Como posso ajudá-lo hoje" - o sistema fará isso automaticamente
11. 🔧 CRÍTICO: NUNCA adicione mensagens de despedida como "Até breve" - use apenas quando o usuário finalizar conversa
12. 🔧 CRÍTICO: Mantenha a conversa fluida e natural, sem padrões repetitivos
13. 🔧 CRÍTICO: Responda diretamente à pergunta do usuário, sem introduções desnecessárias

INFORMAÇÕES COMPLETAS DA CLÍNICA:
- Nome: ${clinicContext.name}
- Endereço: ${clinicContext.address?.rua ? `${clinicContext.address.rua}, ${clinicContext.address.numero} - ${clinicContext.address.bairro}, ${clinicContext.address.cidade}/${clinicContext.address.estado}` : 'Não informado'}
- Telefone: ${clinicContext.contacts?.telefone || 'Não informado'}
- Email: ${clinicContext.contacts?.email_principal || 'Não informado'}
- Website: ${clinicContext.contacts?.website || 'Não informado'}
- Descrição: ${clinicContext.basicInfo?.descricao || 'Não informado'}
- Especialidade: ${clinicContext.basicInfo?.especialidade || 'Não informado'}

SERVIÇOS DISPONÍVEIS (INFORMAÇÕES COMPLETAS):
${clinicContext.servicesDetails ? 
  Object.entries(clinicContext.servicesDetails).map(([category, items]) => {
    if (items && Array.isArray(items) && items.length > 0) {
      return `${category.charAt(0).toUpperCase() + category.slice(1)}:\n${items.map(item => {
        let serviceInfo = `  * ${item.nome || item.nome_servico}`;
        
        // Adicionar duração se disponível
        if (item.duracao_minutos) {
          serviceInfo += ` (${item.duracao_minutos} min)`;
        } else if (item.duracao) {
          serviceInfo += ` (${item.duracao})`;
        }
        
        // Adicionar tipo se disponível
        if (item.tipo) {
          serviceInfo += ` - ${item.tipo}`;
        }
        
        // Adicionar descrição se disponível
        if (item.descricao) {
          serviceInfo += `: ${item.descricao}`;
        }
        
        // 🔧 CRÍTICO: Adicionar PREÇO se disponível
        if (item.preco_particular) {
          serviceInfo += ` - Preço: R$ ${item.preco_particular}`;
        }
        
        // Adicionar preparação se disponível
        if (item.preparacao_necessaria) {
          serviceInfo += ` - Preparação: ${item.preparacao_necessaria}`;
        }
        
        // Adicionar prazo do resultado se disponível
        if (item.resultado_prazo_dias) {
          serviceInfo += ` - Resultado em ${item.resultado_prazo_dias} dia(s)`;
        }
        
        return serviceInfo;
      }).join('\n')}`;
    }
    return '';
  }).filter(Boolean).join('\n\n') : 
  (clinicContext.services && clinicContext.services.length > 0 ? 
    clinicContext.services.map(s => `* ${s.nome || s.nome_servico}`).join('\n') : 
    'Não informado'
  )
}

PROFISSIONAIS DA CLÍNICA (INFORMAÇÕES COMPLETAS):
${clinicContext.professionalsDetails && clinicContext.professionalsDetails.length > 0 ? 
  clinicContext.professionalsDetails.map(prof => 
    `* ${prof.nome_completo || prof.nome_exibicao || prof.nome}${prof.especialidade ? ` - ${prof.especialidade}` : ''}${prof.cre ? ` (CRE: ${prof.cre})` : ''}${prof.descricao ? `: ${prof.descricao}` : ''}`
  ).join('\n') : 
  (clinicContext.professionals && clinicContext.professionals.length > 0 ? 
    clinicContext.professionals.map(p => `* ${p.nome_exibicao || p.nome_completo || p.nome}`).join('\n') : 
    'Não informado'
  )
}

INFORMAÇÕES ADICIONAIS:
${clinicContext.additionalInfo ? Object.entries(clinicContext.additionalInfo).map(([key, value]) => `- ${key}: ${value}`).join('\n') : 'Não disponível'}

CONVÊNIOS ACEITOS:
${clinicContext.insurance && clinicContext.insurance.length > 0 ? clinicContext.insurance.map(conv => `* ${conv.nome || conv}`).join('\n') : 'Não informado'}

FORMAS DE PAGAMENTO:
${clinicContext.paymentMethods ? Object.entries(clinicContext.paymentMethods).map(([method, details]) => `* ${method}: ${details}`).join('\n') : 'Não informado'}

HORÁRIOS DE FUNCIONAMENTO:
${Object.entries(clinicContext.workingHours || {}).map(([day, hours]) => {
  if (hours && hours.abertura && hours.fechamento) {
    return `- ${day}: ${hours.abertura} às ${hours.fechamento}`;
  } else if (hours && hours.abertura === null) {
    return `- ${day}: Fechado`;
  } else {
    return `- ${day}: Horário não configurado`;
  }
}).join('\n')}

COMPORTAMENTO DO AGENTE:
- Proativo: ${agentBehavior.proativo ? 'Sim' : 'Não'}
- Oferece sugestões: ${agentBehavior.oferece_sugestoes ? 'Sim' : 'Não'}
- Solicita feedback: ${agentBehavior.solicita_feedback ? 'Sim' : 'Não'}
- Escalação automática: ${agentBehavior.escalacao_automatica ? 'Sim' : 'Não'}
- Limite de tentativas: ${agentBehavior.limite_tentativas || 3}

MENSAGENS ESPECÍFICAS:
- Saudação inicial: "${initialGreeting}" (🔧 NÃO USE ESTA SAUDAÇÃO NAS RESPOSTAS - o sistema aplicará automaticamente quando necessário)
- Mensagem de despedida: "${farewellMessage}" (use APENAS quando usuário finalizar conversa)
- 🔧 CORREÇÃO: Mensagem fora do horário NÃO deve ser incluída no prompt

EMERGÊNCIAS CARDÍACAS (se configuradas):
${cardiacEmergencies.length > 0 ? cardiacEmergencies.map(emergency => `- ${emergency}`).join('\n') : 'Não configuradas'}

EXEMPLOS DE RESPOSTAS CORRETAS:
❌ INCORRETO: "Olá! Sou o Cardio, assistente virtual da CardioPrime. Como posso ajudá-lo hoje, Lucas?"
✅ CORRETO: "Olá Lucas! É um prazer atendê-lo. Como posso auxiliar você em relação à sua saúde cardiovascular?"

❌ INCORRETO: "Sou o Cardio, assistente virtual da CardioPrime. Como posso ajudá-lo hoje?"
✅ CORRETO: "Como posso auxiliar você hoje, Lucas?"

✅ CORRETO: "Olá Lucas! Como posso auxiliar você hoje?"

IMPORTANTE: 
- Sempre mantenha a personalidade e tom de comunicação definidos
- 🔧 SEMPRE use o nome do usuário quando disponível
- 🔧 NUNCA adicione saudações automáticas
- 🔧 NUNCA seja repetitivo ou automático
- 🔧 Mantenha a conversa natural e contextualizada
- 🔧 Responda diretamente à pergunta, sem introduções desnecessárias
- 🔧 Responda diretamente à pergunta, sem introduções desnecessárias`;

    return prompt;
  }

  // ✅ CONSTRUÇÃO DE MENSAGENS
  static buildMessages(systemPrompt, memory, userMessage) {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Adicionar histórico de conversa se disponível
    if (memory.history && memory.history.length > 0) {
      const recentHistory = memory.history.slice(-5); // Últimas 5 mensagens
      
      for (const entry of recentHistory) {
        if (entry.user) {
          messages.push({ role: 'user', content: entry.user });
        }
        if (entry.bot) {
          messages.push({ role: 'assistant', content: entry.bot });
        }
      }
    }
    
    // Adicionar mensagem atual do usuário
    messages.push({ role: 'user', content: userMessage });
    
    return messages;
  }

  // ✅ VERIFICAÇÃO DE PRIMEIRA CONVERSA DO DIA CORRIGIDA
  static async isFirstConversationOfDay(phoneNumber) {
    try {
      console.log(`📅 [LLMOrchestrator] Verificando primeira conversa do dia para: ${phoneNumber}`);
      
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('last_interaction, memory_data')
        .eq('phone_number', phoneNumber)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ [LLMOrchestrator] Erro ao buscar memória:', error);
        throw error;
      }
      
      if (!data || !data.last_interaction) {
        console.log('📅 [LLMOrchestrator] Primeira conversa - sem histórico anterior');
        return true; // Primeira conversa
      }
      
      const lastConversation = new Date(data.last_interaction);
      const today = new Date();
      
      // Verificar se é o mesmo dia (usando timezone do Brasil)
      const lastConversationDate = lastConversation.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const todayDate = today.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      
      // 🔧 CORREÇÃO: Lógica estava invertida
      const isFirstOfDay = lastConversationDate !== todayDate;
      
      // 🔧 CORREÇÃO ADICIONAL: Verificar se há conversas no mesmo dia
      let hasConversationToday = false;
      if (data.memory_data && data.memory_data.history) {
        const todayStart = new Date(todayDate);
        todayStart.setHours(0, 0, 0, 0);
        
        hasConversationToday = data.memory_data.history.some(msg => {
          const msgDate = new Date(msg.timestamp);
          return msgDate >= todayStart;
        });
      }
      
      // Se há conversas hoje, não é primeira conversa do dia
      const finalResult = isFirstOfDay && !hasConversationToday;
      
      console.log('📅 [LLMOrchestrator] Verificação de primeira conversa:', {
        lastConversation: lastConversationDate,
        today: todayDate,
        isFirstOfDay,
        hasConversationToday,
        finalResult,
        lastInteractionRaw: data.last_interaction,
        lastInteractionDate: lastConversation.toISOString(),
        todayDateRaw: today.toISOString(),
        historyCount: data.memory_data?.history?.length || 0
      });
      
      return finalResult;
      
    } catch (error) {
      console.error('❌ [LLMOrchestrator] Erro ao verificar primeira conversa do dia:', error);
      return true; // Em caso de erro, assumir primeira conversa
    }
  }

  // ✅ VERIFICAÇÃO DE HORÁRIO DE FUNCIONAMENTO
  static isWithinBusinessHours(clinicContext) {
    try {
      console.log('🕒 [LLMOrchestrator] Verificando horário de funcionamento');
      
      // ✅ PRIORIDADE: Dados do JSON de contextualização
      if (clinicContext.workingHours && Object.keys(clinicContext.workingHours).length > 0) {
        console.log('📄 [LLMOrchestrator] Usando horários do JSON de contextualização');
        return this.checkWorkingHours(clinicContext.workingHours);
      }
      
      console.log('⚠️ [LLMOrchestrator] Sem dados de horário, assumindo aberto');
      return true;
      
    } catch (error) {
      console.error('❌ [LLMOrchestrator] Erro ao verificar horário:', error);
      return true; // Em caso de erro, assumir aberto
    }
  }
  
  /**
   * Verifica horários do JSON
   */
  static checkWorkingHours(workingHours) {
    // Usar timezone do Brasil para verificar horário de funcionamento
    const now = new Date();
    const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    
    console.log('🕒 [LLMOrchestrator] Verificando horário JSON:', {
      utc: now.toISOString(),
      brazil: brazilTime.toLocaleString(),
      brazilHours: brazilTime.getHours(),
      brazilMinutes: brazilTime.getMinutes()
    });
    
    const currentDay = this.getDayOfWeek(brazilTime.getDay());
    const currentTime = brazilTime.getHours() * 100 + brazilTime.getMinutes(); // Formato HHMM

    const todaySchedule = workingHours[currentDay];
    
    if (!todaySchedule || !todaySchedule.abertura || !todaySchedule.fechamento) {
      console.log('🕒 [LLMOrchestrator] Fechado - sem horário configurado para:', currentDay);
      return false; // Fechado se não há horário configurado
    }

    const openingTime = this.parseTime(todaySchedule.abertura);
    const closingTime = this.parseTime(todaySchedule.fechamento);

    const isWithin = currentTime >= openingTime && currentTime <= closingTime;
    
    console.log('🕒 [LLMOrchestrator] Resultado JSON:', {
      currentDay,
      currentTime,
      openingTime,
      closingTime,
      isWithin
    });

    return isWithin;
  }

  /**
   * Converte string de tempo para formato HHMM
   */
  static parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 100 + minutes;
  }

  /**
   * Obtém o dia da semana em formato string
   */
  static getDayOfWeek(dayNumber) {
    const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    return days[dayNumber];
  }

  // ✅ APLICAÇÃO DE LÓGICA DE RESPOSTA CORRIGIDA
  static async applyResponseLogic(response, clinicContext, isFirstConversationOfDay, isWithinBusinessHours, userProfile, conversationHistory) {
    try {
      // Obter configurações do agente
      const agentConfig = clinicContext.agentConfig || {};
      
      console.log('🔧 [LLMOrchestrator] Aplicando lógica de resposta:', {
        isFirstConversationOfDay,
        isWithinBusinessHours,
        hasUserProfile: !!userProfile?.name,
        agentName: agentConfig.nome || 'Assistente Virtual'
      });
      
      // 🔧 CORREÇÃO: Se está FORA do horário, usar mensagem fora do horário
      if (!isWithinBusinessHours) {
        const outOfHoursMessage = agentConfig.mensagem_fora_horario || 
          'No momento estamos fora do horário de atendimento. Retornaremos seu contato no próximo horário comercial.';
        
        console.log('🕒 [LLMOrchestrator] Aplicando mensagem fora do horário');
        return outOfHoursMessage;
      }
      
      // 🔧 CORREÇÃO: Se está DENTRO do horário, continuar com a lógica normal
      console.log('✅ [LLMOrchestrator] Dentro do horário - aplicando lógica normal de resposta');

      let finalResponse = response;

      // 🔒 SANITIZAÇÃO PREVENTIVA (reforçada): se o texto indicar "fora do horário", substituir resposta inteira
      const outOfHoursTrigger = /(fora do horário|No momento estamos|próximo horário comercial|Retornaremos seu contato)/i;
      if (outOfHoursTrigger.test(finalResponse)) {
        console.log('🧹 [LLMOrchestrator] Detectado padrão de "fora do horário" dentro do expediente - aplicando fallback seguro');
        finalResponse = 'Como posso ajudar?';
      } else {
        // Limpeza adicional de fragmentos residuais
        const outOfHoursPatterns = [
          /fora do horário de atendimento/gi,
          /estamos fora do horário/gi,
          /próximo horário comercial/gi,
          /^No momento estamos.*$/gmi,
          /^Retornaremos seu contato.*$/gmi,
          /^Para emergências.*$/gmi
        ];
        const sanitized = outOfHoursPatterns.reduce((acc, pattern) => acc.replace(pattern, ''), finalResponse).trim();
        if (sanitized !== finalResponse) {
          console.log('🧹 [LLMOrchestrator] Removidos fragmentos residuais de "fora do horário"');
          finalResponse = sanitized || 'Como posso ajudar?';
        }
      }

      // 🔧 CORREÇÃO 1: Só adicionar saudação na PRIMEIRA conversa do dia E se não houve saudação na conversa atual
      if (isFirstConversationOfDay) {
        console.log('👋 [LLMOrchestrator] PRIMEIRA conversa do dia - verificando se já houve saudação na conversa atual');
        
        // 🔧 CORREÇÃO: Verificar múltiplas estruturas de dados para saudação
        let hasGreetingInConversation = false;
        
        if (conversationHistory && Array.isArray(conversationHistory)) {
          // Estrutura 1: Array com objetos {role, content}
          hasGreetingInConversation = conversationHistory.some(msg => 
            msg.role === 'assistant' && msg.content && (
              msg.content.includes('Olá! Sou o') ||
              msg.content.includes('assistente virtual') ||
              msg.content.includes('Como posso ajudá-lo') ||
              msg.content.includes('Em que posso ajudar') ||
              msg.content.includes('Como posso cuidar') ||
              msg.content.includes('Olá.') ||
              msg.content.includes('Sou o Cardio') ||
              msg.content.includes('assistente virtual da CardioPrime')
            )
          );
          
          // Estrutura 2: Array com objetos {bot, user} (estrutura antiga)
          if (!hasGreetingInConversation) {
            hasGreetingInConversation = conversationHistory.some(msg => 
              msg.bot && (
                msg.bot.includes('Olá! Sou o') ||
                msg.bot.includes('assistente virtual') ||
                msg.bot.includes('Como posso ajudá-lo') ||
                msg.bot.includes('Em que posso ajudar') ||
                msg.bot.includes('Como posso cuidar') ||
                msg.bot.includes('Olá.') ||
                msg.bot.includes('Sou o Cardio') ||
                msg.bot.includes('assistente virtual da CardioPrime')
              )
            );
          }
        }
        
        console.log('🔍 [LLMOrchestrator] Verificação de saudação na conversa:', {
          hasConversationHistory: !!conversationHistory,
          conversationHistoryLength: conversationHistory?.length || 0,
          hasGreetingInConversation,
          conversationHistoryType: conversationHistory ? Array.isArray(conversationHistory) ? 'Array' : typeof conversationHistory : 'null',
          conversationHistory: conversationHistory?.slice(0, 3).map(msg => ({
            role: msg.role || 'unknown',
            bot: msg.bot ? 'present' : 'absent',
            content: msg.content ? msg.content.substring(0, 100) + '...' : 'absent',
            keys: Object.keys(msg || {})
          }))
        });
        
        if (hasGreetingInConversation) {
          console.log('👋 [LLMOrchestrator] Já houve saudação na conversa atual - não adicionar nova');
          return response; // Retornar resposta sem saudação
        }
        
        console.log('👋 [LLMOrchestrator] Aplicando saudação inicial');
        
        const initialGreeting = agentConfig.saudacao_inicial || 
          `Olá! Sou o ${agentConfig.nome || 'Assistente Virtual'}, assistente virtual da ${clinicContext.name}. Como posso ajudá-lo hoje?`;
        
        // Personalizar saudação com nome do usuário se disponível
        let personalizedGreeting = initialGreeting;
        if (userProfile?.name) {
          personalizedGreeting = initialGreeting.replace('Como posso ajudá-lo hoje?', `Como posso ajudá-lo hoje, ${userProfile.name}?`);
          console.log(`👤 [LLMOrchestrator] Saudação personalizada para: ${userProfile.name}`);
        }
        
        // Verificar se já tem saudação na resposta do LLM
        const hasGreeting = response.includes('Olá! Sou o') || 
                           response.includes('assistente virtual') ||
                           response.includes('Como posso ajudá-lo') ||
                           response.includes('Em que posso ajudar') ||
                           response.includes('Como posso cuidar') ||
                           response.includes('Olá.') ||
                           response.includes('Sou o Cardio') ||
                           response.includes('assistente virtual da CardioPrime');
        
        console.log('🔍 [LLMOrchestrator] Verificando duplicação de saudação:', hasGreeting ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
        
        if (hasGreeting) {
          // Remover saudações duplicadas da resposta
          const cleanResponse = this.removeGreetingPatterns(response);
          console.log('🧹 [LLMOrchestrator] Saudação duplicada removida da resposta');
          finalResponse = personalizedGreeting + "\n\n" + cleanResponse;
        } else {
          // Não tem saudação, adicionar normalmente
          finalResponse = personalizedGreeting + "\n\n" + response;
        }
      } else {
        console.log('📅 [LLMOrchestrator] NÃO é primeira conversa do dia - sem saudação');
      }

      // 🔧 CORREÇÃO 2: NÃO adicionar mensagem de despedida automaticamente
      console.log('🔧 [LLMOrchestrator] Mensagem de despedida não será adicionada automaticamente');

      // 🔧 NOVA CORREÇÃO: APLICAR CORREÇÃO AUTOMÁTICA DE FORMATAÇÃO PARA TODAS AS CLÍNICAS
      console.log('🔧 [LLMOrchestrator] Aplicando correção automática de formatação');
      const { normalizeMessage } = await import('../utils/messageNormalization.js');
      const formattedResponse = normalizeMessage(finalResponse);
      if (formattedResponse !== finalResponse) {
        console.log('✅ [LLMOrchestrator] Formatação corrigida automaticamente');
        finalResponse = formattedResponse;
      }

      // Para todas as respostas, verificar duplicações gerais
      // Removendo desduplicação específica por enquanto; manteremos normalização genérica
      const cleanedResponse = finalResponse;
      if (cleanedResponse !== finalResponse) {
        console.log('🧹 [LLMOrchestrator] Conteúdo duplicado removido da resposta');
      }

      console.log('✅ [LLMOrchestrator] Lógica de resposta aplicada com sucesso');
      return cleanedResponse;
      
    } catch (error) {
      console.error('❌ [LLMOrchestrator] Erro ao aplicar lógica de resposta:', error);
      return response;
    }
  }

  // ✅ REMOÇÃO DE PADRÕES DE SAUDAÇÃO DUPLICADOS MELHORADA
  static removeGreetingPatterns(text) {
    console.log('🧹 [LLMOrchestrator] Removendo padrões de saudação do texto');
    
    const patterns = [
      // Padrões genéricos
      /Olá! Sou o .*?assistente virtual.*?Como posso ajudá-lo hoje\?/gi,
      /Olá! Sou o .*?assistente virtual.*?Em que posso ajudar/gi,
      /Olá! Sou o .*?assistente virtual.*?Como posso cuidar/gi,
      /Olá! Sou o .*?assistente virtual.*?Como posso ajudá-lo/gi,
      /Olá! Sou o .*?assistente virtual.*?Em que posso ajudá-lo/gi,
      /Olá! Sou o .*?assistente virtual.*?Como posso ajudar/gi,
      
      // Padrões específicos da CardioPrime (exatos da conversa)
      /Olá\.\s*\n\s*Sou o Cardio, assistente virtual da CardioPrime\.\s*\n\s*Como posso cuidar da sua saúde cardiovascular hoje\./gi,
      /Olá\.\s*\n\s*Sou o Cardio, assistente virtual da CardioPrime\.\s*\n\s*Como posso ajudá-lo hoje\./gi,
      /Olá\.\s*\n\s*Sou o Cardio, assistente virtual da CardioPrime\.\s*\n\s*Em que posso ajudar você hoje\?/gi,
      
      // Padrões mais flexíveis da CardioPrime
      /Olá\.\s*\n\s*Sou o Cardio.*?assistente virtual da CardioPrime.*?Como posso cuidar da sua saúde cardiovascular hoje/gi,
      /Olá\.\s*\n\s*Sou o Cardio.*?assistente virtual da CardioPrime.*?Como posso ajudá-lo hoje/gi,
      
      // Padrões específicos da ESADI
      /Olá! Sou a Jessica, assistente virtual da ESADI\. Estou aqui para ajudá-lo com agendamentos e orientações sobre exames\. Como posso ajudá-lo hoje\?/gi,
      
      // Padrões genéricos de início
      /^Olá\.?\s*\n?/gi,
      /^Oi\.?\s*\n?/gi,
      /^Olá!?\s*\n?/gi,
      /^Oi!?\s*\n?/gi,
      
      // Padrões específicos de saudação repetitiva
      /Olá\.\s*\n\s*Sou o .*?assistente virtual da .*?Como posso cuidar da sua saúde cardiovascular hoje\./gi,
      /Olá\.\s*\n\s*Sou o .*?assistente virtual da .*?Como posso ajudá-lo hoje\./gi
    ];
    
    let cleanText = text;
    patterns.forEach(pattern => {
      cleanText = cleanText.replace(pattern, '');
    });
    
    // Limpar espaços extras e quebras de linha duplicadas
    cleanText = cleanText.replace(/\n\s*\n/g, '\n\n').trim();
    
    // Remover frases soltas que podem ter ficado
    cleanText = cleanText.replace(/^você hoje\?\s*/gi, '');
    cleanText = cleanText.replace(/^Em que posso ajudar\s*/gi, '');
    cleanText = cleanText.replace(/^Como posso ajudá-lo\s*/gi, '');
    
    return cleanText;
  }

  // 🔧 NOVA FUNÇÃO: CORREÇÃO AUTOMÁTICA DE FORMATAÇÃO PARA TODAS AS CLÍNICAS
  static fixMessageFormatting(text) {
    console.log('🔧 [LLMOrchestrator] Aplicando correção automática de formatação');
    
    if (!text || typeof text !== 'string') {
      return text;
    }
    
    let cleaned = text;
    
    // 1. Remover caracteres especiais problemáticos (⁠, etc.)
    cleaned = cleaned.replace(/[⁠]/g, '');
    
    // 🚀 SOLUÇÃO ULTIMATE: Substituições diretas e específicas
    // Corrigir os problemas específicos identificados pelo usuário
    
    // Problema 1: "*Dr.\n\nRoberto Silva*" → "*Dr. Roberto Silva*"
    cleaned = cleaned.replace(/\*\s*Dr\.\s*\n+\s*Roberto Silva\*/g, '*Dr. Roberto Silva*');
    
    // Problema 2: "*Dra.\n\nMaria Fernanda*" → "*Dra. Maria Fernanda*"
    cleaned = cleaned.replace(/\*\s*Dra\.\s*\n+\s*Maria Fernanda\*/g, '*Dra. Maria Fernanda*');
    
    // Problema 3: "- *Dr.\n\nRoberto Silva*:" → "- *Dr. Roberto Silva*:"
    cleaned = cleaned.replace(/-\s*\*\s*Dr\.\s*\n+\s*Roberto Silva\*:/g, '- *Dr. Roberto Silva*:');
    
    // Problema 4: "- *Dra.\n\nMaria Fernanda*:" → "- *Dra. Maria Fernanda*:"
    cleaned = cleaned.replace(/-\s*\*\s*Dra\.\s*\n+\s*Maria Fernanda\*:/g, '- *Dra. Maria Fernanda*:');
    
    // 🚀 SOLUÇÃO ULTIMATE: Adicionar quebras de linha adequadas
    
    // Título: "conta com os seguintes médicos:" → "conta com os seguintes médicos:\n\n"
    cleaned = cleaned.replace(/(conta com os seguintes médicos:)/g, '$1\n\n');
    cleaned = cleaned.replace(/(conta com os seguintes profissionais:)/g, '$1\n\n');
    cleaned = cleaned.replace(/(contamos com dois profissionais especializados em cardiologia:)/g, '$1\n\n');
    cleaned = cleaned.replace(/(oferece os seguintes exames:)/g, '$1\n\n');
    
    // Conclusão: "Ambos são dedicados" → "\n\nAmbos são dedicados"
    cleaned = cleaned.replace(/(Ambos são dedicados)/g, '\n\n$1');
    cleaned = cleaned.replace(/(Esses exames são essenciais)/g, '\n\n$1');
    cleaned = cleaned.replace(/(Ambos estão disponíveis)/g, '\n\n$1');
    
    // Ação: "Caso precise de mais informações" → "\n\nCaso precise de mais informações"
    cleaned = cleaned.replace(/(Caso precise de mais informações)/gi, '\n\n$1');
    cleaned = cleaned.replace(/(Se precisar de mais informações)/gi, '\n\n$1');
    cleaned = cleaned.replace(/(Caso tenha interesse)/gi, '\n\n$1');
    cleaned = cleaned.replace(/(Se precisar agendar)/gi, '\n\n$1');
    
    // 2. Corrigir espaçamento após números em listas (se houver)
    cleaned = cleaned.replace(/(\d+\.)\s*⁠\s*⁠/gi, '$1 ');
    
    // 3. Separar itens de lista que estão juntos (se houver)
    cleaned = cleaned.replace(/(\d+\.\s*[^:]+:\s*[^.]+\.)\s*(\d+\.)/gi, '$1\n$2');
    
    // 4. Adicionar quebras de linha após cada item de lista (se houver)
    cleaned = cleaned.replace(/(\d+\.\s*[^:]+:\s*[^.]+\.)/gi, '$1\n');
    
    // 🚀 SOLUÇÃO ULTIMATE: Limpeza final
    
    // Normalizar quebras de linha (máximo 2 consecutivas)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Limpar espaços múltiplos APENAS entre palavras (não quebras de linha)
    cleaned = cleaned.replace(/[ ]+/g, ' ');
    
    // Remover quebras de linha extras no final
    cleaned = cleaned.replace(/\n+$/, '');
  
    // Normalizar quebras de linha finais
    cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');
    
    console.log('✅ [LLMOrchestrator] Formatação corrigida automaticamente');
    return cleaned.trim();
  }

  // ✅ REMOÇÃO DE CONTEÚDO DUPLICADO
  static removeDuplicateContent(text) {
    // Dividir o texto em frases
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Array para armazenar frases únicas
    const uniqueSentences = [];
    const seenPhrases = new Set();
    
    for (const sentence of sentences) {
      const cleanSentence = sentence.trim();
      if (cleanSentence.length === 0) continue;
      
      // Verificar se a frase é muito similar a uma já vista
      let isDuplicate = false;
      for (const seenPhrase of seenPhrases) {
        if (this.calculateSimilarity(cleanSentence, seenPhrase) > 0.8) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        uniqueSentences.push(cleanSentence);
        seenPhrases.add(cleanSentence);
      }
    }
    
    return uniqueSentences.join('. ') + (uniqueSentences.length > 0 ? '.' : '');
  }

  // ✅ CÁLCULO DE SIMILARIDADE ENTRE FRASES
  static calculateSimilarity(str1, str2) {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]);
    
    return commonWords.length / totalWords.size;
  }

  // ✅ GERAÇÃO DE FALLBACK INTELIGENTE
  static generateIntelligentFallbackResponse(intent, clinicContext, isFirstConversationOfDay, isWithinBusinessHours, userProfile, originalMessage) {
    const agentConfig = clinicContext.agentConfig || {};
    const agentName = agentConfig.nome || 'Assistente Virtual';
    
    if (!isWithinBusinessHours) {
      return agentConfig.mensagem_fora_horario || 
        'No momento estamos fora do horário de atendimento. Retornaremos seu contato no próximo horário comercial.';
    }
    
    if (isFirstConversationOfDay) {
      const greeting = agentConfig.saudacao_inicial || 
        `Olá! Sou o ${agentName}, assistente virtual da ${clinicContext.name}. Como posso ajudá-lo hoje?`;
      
      if (userProfile?.name) {
        return greeting.replace('Como posso ajudá-lo hoje?', `Como posso ajudá-lo hoje, ${userProfile.name}?`);
      }
      return greeting;
    }
    
    // Fallback genérico
    return `Desculpe, não consegui processar sua mensagem. Como posso ajudá-lo, ${userProfile?.name || 'senhor(a)'}?`;
  }
}

export { LLMOrchestratorService };
