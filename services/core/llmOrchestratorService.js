// services/core/llmOrchestratorService.js
// Versão simplificada que usa APENAS JSONs via ClinicContextManager

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// ✅ IMPORTS SIMPLIFICADOS
import HumanizationHelpers from './humanizationHelpers.js';
import AppointmentFlowManager from './appointmentFlowManager.js';
import ClinicContextManager from './clinicContextManager.js';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default class LLMOrchestratorService {
  // ✅ PROPRIEDADES SIMPLIFICADAS
  static humanizationHelpers = HumanizationHelpers;
  static appointmentFlowManager = null;
  static conversationMetrics = new Map();
  
  // ✅ INICIALIZAÇÃO DO APPOINTMENT FLOW MANAGER
  static async initializeAppointmentFlow() {
    try {
      if (!this.appointmentFlowManager) {
        this.appointmentFlowManager = new AppointmentFlowManager(this);
        await this.appointmentFlowManager.initialize();
        console.log('✅ AppointmentFlowManager inicializado com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar AppointmentFlowManager:', error);
    }
  }

  // ✅ PROCESSAMENTO PRINCIPAL DE MENSAGENS
  static async processMessage(request) {
    try {
      console.log('🤖 LLMOrchestrator processing:', request);

      const { phoneNumber, message, conversationId, userId } = request;

      // Sistema de memória simples
      const memory = await this.loadConversationMemory(phoneNumber);
      
      // Extrair nome do usuário se presente na mensagem
      const extractedName = this.extractUserName(message);
      if (extractedName && !memory.userProfile?.name) {
        memory.userProfile = memory.userProfile || {};
        memory.userProfile.name = extractedName;
        console.log(`👤 Nome extraído e salvo: ${extractedName}`);
        
        // Salvar nome na tabela conversation_memory
        await this.saveUserName(phoneNumber, extractedName);
      }
      
      // ✅ BUSCAR CONTEXTO APENAS DO JSON (sem banco de dados)
      // 🔧 CORREÇÃO: Identificar clínica baseada no número do WhatsApp
      // Primeiro, precisamos identificar qual clínica está recebendo a mensagem
      // Vamos buscar todas as clínicas e verificar qual tem o número de WhatsApp ativo
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
        process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M'
      );
      
      // 🔧 CORREÇÃO: Buscar clínica que está recebendo a mensagem
      // Como estamos no webhook, a mensagem está sendo enviada PARA uma clínica
      // Vamos buscar a clínica que tem o número de WhatsApp ativo
      const { data: activeClinics, error: clinicsError } = await supabase
        .from('clinics')
        .select('name, whatsapp_phone, id, has_contextualization')
        .eq('has_contextualization', true);
      
      if (clinicsError) {
        console.error('❌ [LLMOrchestrator] Erro ao buscar clínicas ativas:', clinicsError);
        throw new Error('Erro ao buscar clínicas ativas');
      }
      
      if (!activeClinics || activeClinics.length === 0) {
        console.error('❌ [LLMOrchestrator] Nenhuma clínica com contextualização encontrada');
        throw new Error('Nenhuma clínica com contextualização encontrada');
      }
      
      // 🔧 CORREÇÃO: Para simplificar, vamos usar a primeira clínica ativa
      // Em produção, isso deveria ser baseado no número de WhatsApp que está recebendo
      const clinicKey = activeClinics[0].name;
      console.log(`✅ [LLMOrchestrator] Usando clínica: ${clinicKey} (ID: ${activeClinics[0].id})`);
      
      let clinicContext;
      try {
        clinicContext = await ClinicContextManager.getClinicContext(clinicKey);
        console.log(`✅ [LLMOrchestrator] Contexto obtido para clínica: ${clinicKey}`);
      } catch (contextError) {
        console.error(`❌ [LLMOrchestrator] Erro ao obter contexto da clínica ${clinicKey}:`, contextError.message);
        // ❌ SEM FALLBACKS HARDCODED - PROPAGAR ERRO
        throw new Error(`Não foi possível obter contexto da clínica ${clinicKey}: ${contextError.message}`);
      }
      
      // Detectar intenção avançada com histórico e contexto
      const conversationHistory = memory.history || [];
      const intent = await this.detectIntent(message, conversationHistory, clinicContext);
      
      // INICIALIZAR APPOINTMENT FLOW MANAGER SE NECESSÁRIO
      if (this.isAppointmentIntent(intent)) {
        await this.initializeAppointmentFlow();
      }
      
      // Verificar se é primeira conversa do dia
      const isFirstConversationOfDay = await this.isFirstConversationOfDay(phoneNumber);
      console.log('📅 Primeira conversa do dia:', isFirstConversationOfDay);
      
      // Verificar horário de funcionamento
      const isWithinBusinessHours = this.isWithinBusinessHours(clinicContext);
      console.log('🕒 Dentro do horário de funcionamento:', isWithinBusinessHours);
      
      // Preparar prompt do sistema com perfil do usuário
      const systemPrompt = this.prepareSystemPrompt(clinicContext, memory.userProfile);
      
      // Construir mensagens para o LLM
      const messages = this.buildMessages(systemPrompt, memory, message);
      
      // VERIFICAR SE É INTENÇÃO DE AGENDAMENTO
      if (this.isAppointmentIntent(intent)) {
        console.log('📅 Intenção de agendamento detectada para:', message);
        
        // 🔧 CORREÇÃO: Validar horário de funcionamento ANTES de processar agendamento
        if (!isWithinBusinessHours) {
          console.log('🕒 Tentativa de agendamento fora do horário de funcionamento');
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
        
        console.log('✅ Horário validado, delegando para AppointmentFlowManager');
        
        try {
          // 🔧 CORREÇÃO: Garantir que AppointmentFlowManager está inicializado
          if (!this.appointmentFlowManager) {
            await this.initializeAppointmentFlow();
          }
          
          console.log('🔄 Chamando AppointmentFlowManager.handleAppointmentIntent...');
          const appointmentResult = await this.appointmentFlowManager.handleAppointmentIntent(
            phoneNumber,
            message,
            intent,
            clinicContext,
            memory
          );
          
          console.log('📋 Resultado do AppointmentFlowManager:', appointmentResult);
          
          if (appointmentResult && appointmentResult.success) {
            console.log('✅ Agendamento processado com sucesso pelo AppointmentFlowManager');
            return appointmentResult;
          } else if (appointmentResult && appointmentResult.response) {
            console.log('✅ Resposta do AppointmentFlowManager retornada');
            return appointmentResult;
          } else {
            console.log('⚠️ AppointmentFlowManager não retornou resultado válido, continuando com LLM');
          }
        } catch (error) {
          console.error('❌ Erro no AppointmentFlowManager:', error);
          console.log('⚠️ Continuando com LLM devido ao erro');
        }
      }
      
      // 🔧 CORREÇÃO: Verificar se há fluxo de agendamento ativo para continuar
      if (this.appointmentFlowManager && this.appointmentFlowManager.hasActiveFlow(phoneNumber)) {
        console.log('🔄 Fluxo de agendamento ativo detectado, continuando...');
        
        try {
          const flowState = this.appointmentFlowManager.getFlowState(phoneNumber);
          console.log('📋 Estado atual do fluxo:', flowState.step);
          
          // Processar mensagem no contexto do fluxo ativo
          const appointmentResult = await this.appointmentFlowManager.handleAppointmentIntent(
            phoneNumber,
            message,
            { name: 'APPOINTMENT_CONTINUE', confidence: 0.9 },
            clinicContext,
            memory
          );
          
          if (appointmentResult && appointmentResult.response) {
            console.log('✅ Fluxo de agendamento continuado com sucesso');
            return appointmentResult;
          }
        } catch (error) {
          console.error('❌ Erro ao continuar fluxo de agendamento:', error);
          // Continuar com LLM se houver erro
        }
      }
      
      // ✅ PROCESSAMENTO NORMAL COM LLM
      console.log('🤖 Processando com OpenAI...');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });
      
      const response = completion.choices[0].message.content;
      
      // ✅ APLICAR LÓGICA DE RESPOSTA
      const finalResponse = await this.applyResponseLogic(
        response, 
        clinicContext, 
        isFirstConversationOfDay, 
        isWithinBusinessHours, 
        memory.userProfile,
        memory.history
      );
      
      // Salvar na memória
      await this.saveConversationMemory(phoneNumber, message, finalResponse, intent);
      
      console.log('✅ Resposta final gerada:', finalResponse.substring(0, 100) + '...');
      
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
      console.error('❌ Erro no LLMOrchestrator:', error);
      
      // ✅ FALLBACK INTELIGENTE
      const fallbackResponse = this.generateIntelligentFallbackResponse(
        { name: 'ERROR' }, 
        clinicContext || {}, 
        false, 
        true, 
        null, 
        message
      );
      
      return {
        response: fallbackResponse,
        intent: { name: 'ERROR', confidence: 0.0 },
        toolsUsed: ['fallback'],
        error: error.message
      };
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
- Mensagem fora do horário: "${outOfHoursMessage}"

EMERGÊNCIAS CARDÍACAS (se configuradas):
${cardiacEmergencies.length > 0 ? cardiacEmergencies.map(emergency => `- ${emergency}`).join('\n') : 'Não configuradas'}

EXEMPLOS DE RESPOSTAS CORRETAS:
❌ INCORRETO: "Olá! Sou o Cardio, assistente virtual da CardioPrime. Como posso ajudá-lo hoje, Lucas?"
✅ CORRETO: "Olá Lucas! É um prazer atendê-lo. Como posso auxiliar você em relação à sua saúde cardiovascular?"

❌ INCORRETO: "Sou o Cardio, assistente virtual da CardioPrime. Como posso ajudá-lo hoje?"
✅ CORRETO: "Como posso auxiliar você hoje, Lucas?"

IMPORTANTE: 
- Sempre mantenha a personalidade e tom de comunicação definidos
- 🔧 SEMPRE use o nome do usuário quando disponível
- 🔧 NUNCA adicione saudações automáticas
- 🔧 NUNCA seja repetitivo ou automático
- 🔧 Mantenha a conversa natural e contextualizada
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
      
      // Se está fora do horário, usar mensagem fora do horário
      if (!isWithinBusinessHours) {
        const outOfHoursMessage = agentConfig.mensagem_fora_horario || 
          'No momento estamos fora do horário de atendimento. Retornaremos seu contato no próximo horário comercial.';
        
        console.log('🕒 [LLMOrchestrator] Aplicando mensagem fora do horário');
        return outOfHoursMessage;
      }

      let finalResponse = response;

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
      const formattedResponse = this.fixMessageFormatting(finalResponse);
      if (formattedResponse !== finalResponse) {
        console.log('✅ [LLMOrchestrator] Formatação corrigida automaticamente');
        finalResponse = formattedResponse;
      }

      // Para todas as respostas, verificar duplicações gerais
      const cleanedResponse = this.removeDuplicateContent(finalResponse);
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
    
    // 🔧 CORREÇÃO ESPECÍFICA E DIRETA: Quebras de linha incorretas em nomes com negrito
    // Corrigir padrões como "*Dr.\n\nRoberto Silva*" para "*Dr. Roberto Silva*"
    cleaned = cleaned.replace(/\*\s*([^*]+)\s*\n+\s*([^*]+)\*/gi, '*$1 $2*');
    
    // 🔧 CORREÇÃO ESPECÍFICA: Formatação de listas com traços
    // Corrigir padrões como "- *Dr.\n\nRoberto Silva*:" para "- *Dr. Roberto Silva*:"
    cleaned = cleaned.replace(/-\s*\*\s*([^*]+)\s*\n+\s*([^*]+)\*:/gi, '- *$1 $2*:');
    
    // 🔧 CORREÇÃO ESPECÍFICA: Adicionar quebras de linha após cada item de lista com traços
    // Para o padrão específico identificado pelo usuário
    cleaned = cleaned.replace(/(-\s*\*[^*]+\*[^:]*:)/gi, '$1\n');
    
    // 🔧 CORREÇÃO ESPECÍFICA: Garantir que o título tenha quebra de linha adequada
    cleaned = cleaned.replace(/(conta com os seguintes médicos:)/gi, '$1\n\n');
    cleaned = cleaned.replace(/(conta com os seguintes profissionais:)/gi, '$1\n\n');
    cleaned = cleaned.replace(/(contamos com dois profissionais especializados em cardiologia:)/gi, '$1\n\n');
    cleaned = cleaned.replace(/(oferece os seguintes exames:)/gi, '$1\n\n');
    
    // 🔧 CORREÇÃO ESPECÍFICA: Garantir que a conclusão tenha quebra de linha adequada
    cleaned = cleaned.replace(/(Ambos são dedicados)/gi, '\n\n$1');
    cleaned = cleaned.replace(/(Esses exames são essenciais)/gi, '\n\n$1');
    cleaned = cleaned.replace(/(Ambos estão disponíveis)/gi, '\n\n$1');
    
    // 🔧 CORREÇÃO ESPECÍFICA: Garantir que a ação tenha quebra de linha adequada
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
    
    // 5. Normalizar quebras de linha (máximo 2 consecutivas)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // 6. Garantir espaçamento adequado entre seções
    cleaned = cleaned.replace(/([.!?])\s*([A-Z])/gi, '$1\n\n$2');
    
    // 🔧 CORREÇÃO CRÍTICA: Limpar espaços múltiplos APENAS entre palavras, NÃO quebras de linha
    // Substituir múltiplos espaços por um único espaço, mas preservar quebras de linha
    cleaned = cleaned.replace(/[ ]+/g, ' ');
    
    // 7. Remover quebras de linha extras no final
    cleaned = cleaned.replace(/\n+$/, '');
    
    // 8. Normalizar quebras de linha finais
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
