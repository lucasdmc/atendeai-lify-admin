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
        process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M'
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
        memory.userProfile
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
    console.log(`🔍 [LLMOrchestrator] Extraindo nome da mensagem: "${message}"`);
    
    // Lógica para extrair nome do usuário
    const namePatterns = [
      /me chamo ([^,\.!?\n]+)/i,
      /meu nome é ([^,\.!?\n]+)/i,
      /sou o ([^,\.!?\n]+)/i,
      /sou a ([^,\.!?\n]+)/i,
      /chamo-me ([^,\.!?\n]+)/i,
      /eu sou ([^,\.!?\n]+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match) {
        const extractedName = match[1].trim();
        
        // Validar se o nome extraído é válido
        if (extractedName.length > 0 && extractedName.length <= 50 && 
            !extractedName.toLowerCase().includes('tudo bem') && 
            !extractedName.toLowerCase().includes('qual') &&
            !extractedName.toLowerCase().includes('como')) {
          
          console.log(`✅ [LLMOrchestrator] Nome extraído: "${extractedName}"`);
          return extractedName;
        }
      }
    }
    
    console.log(`❌ [LLMOrchestrator] Nenhum nome válido encontrado na mensagem`);
    return null;
  }

  static async saveUserName(phoneNumber, name) {
    try {
      console.log(`👤 [LLMOrchestrator] Salvando nome para ${phoneNumber}: ${name}`);
      
      const now = new Date().toISOString();
      
      console.log(`👤 [LLMOrchestrator] Dados para salvar:`, {
        phoneNumber,
        name,
        userProfile: { name: name },
        lastInteraction: now,
        updatedAt: now
      });
      
      const { error } = await supabase
        .from('conversation_memory')
        .upsert({
          phone_number: phoneNumber,
          user_profile: { name: name },
          last_interaction: now,
          updated_at: now
        }, { onConflict: 'phone_number' });
      
      if (error) throw error;
      console.log(`✅ [LLMOrchestrator] Nome salvo para ${phoneNumber}: ${name}`);
    } catch (error) {
      console.error('❌ [LLMOrchestrator] Erro ao salvar nome:', error);
    }
  }

  static async loadConversationMemory(phoneNumber) {
    try {
      console.log(`🔍 [LLMOrchestrator] Carregando memória para: ${phoneNumber}`);
      
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        console.log(`✅ [LLMOrchestrator] Memória encontrada para ${phoneNumber}:`, {
          hasUserProfile: !!data.user_profile,
          userProfileData: data.user_profile,
          hasHistory: !!data.conversation_history,
          historyLength: data.conversation_history?.length || 0,
          lastInteraction: data.last_interaction,
          updatedAt: data.updated_at,
          rawData: data
        });
        
        // Extrair nome do usuário do user_profile
        let userProfile = {};
        if (data.user_profile && typeof data.user_profile === 'object') {
          userProfile = data.user_profile;
        } else if (data.user_profile && typeof data.user_profile === 'string') {
          try {
            userProfile = JSON.parse(data.user_profile);
          } catch (e) {
            console.warn(`⚠️ [LLMOrchestrator] Erro ao fazer parse do user_profile:`, e);
            userProfile = {};
          }
        }
        
        return {
          userProfile: userProfile,
          history: data.conversation_history || [],
          lastUpdated: data.updated_at || data.last_interaction
        };
      }
      
      console.log(`📝 [LLMOrchestrator] Nova memória criada para ${phoneNumber}`);
      return {
        userProfile: {},
        history: [],
        lastUpdated: null
      };
    } catch (error) {
      console.error('❌ [LLMOrchestrator] Erro ao carregar memória:', error);
      return {
        userProfile: {},
        history: [],
        lastUpdated: null
      };
    }
  }

  static async saveConversationMemory(phoneNumber, userMessage, botResponse, intent) {
    try {
      console.log(`💾 [LLMOrchestrator] Salvando memória para ${phoneNumber}`);
      
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
      
      const now = new Date().toISOString();
      
      console.log(`💾 [LLMOrchestrator] Dados para salvar:`, {
        phoneNumber,
        historyLength: trimmedHistory.length,
        lastInteraction: now,
        updatedAt: now
      });
      
      const { error } = await supabase
        .from('conversation_memory')
        .upsert({
          phone_number: phoneNumber,
          conversation_history: trimmedHistory,
          last_interaction: now,
          updated_at: now
        }, { onConflict: 'phone_number' });
      
      if (error) throw error;
      console.log('✅ [LLMOrchestrator] Memória de conversa salva com sucesso');
    } catch (error) {
      console.error('❌ [LLMOrchestrator] Erro ao salvar memória:', error);
    }
  }

  static async detectIntent(message, conversationHistory = [], clinicContext = {}) {
    try {
      console.log('🔍 [LLMOrchestrator] Detectando intenção para:', message);
      
      // ✅ DETECÇÃO SIMPLIFICADA COM PALAVRAS-CHAVE
      const lowerMessage = message.toLowerCase();
      
      // Agendamento
      if (this.containsAppointmentKeywords(lowerMessage)) {
        console.log('✅ Intenção de AGENDAMENTO detectada');
        return { name: 'APPOINTMENT', confidence: 0.9 };
      }
      
      // Informações sobre contatos
      if (this.containsContactKeywords(lowerMessage)) {
        console.log('✅ Intenção de CONTATO detectada');
        return { name: 'CONTACT_INFO', confidence: 0.9 };
      }
      
      // Informações sobre exames
      if (this.containsExamKeywords(lowerMessage)) {
        console.log('✅ Intenção de EXAME detectada');
        return { name: 'EXAM_INFO', confidence: 0.9 };
      }
      
      // Informações sobre médicos
      if (this.containsDoctorKeywords(lowerMessage)) {
        console.log('✅ Intenção de MÉDICO detectada');
        return { name: 'DOCTOR_INFO', confidence: 0.9 };
      }
      
      // Informações gerais
      if (this.containsInfoKeywords(lowerMessage)) {
        console.log('✅ Intenção de INFORMAÇÃO detectada');
        return { name: 'INFORMATION', confidence: 0.8 };
      }
      
      // Saudação
      if (this.containsGreetingKeywords(lowerMessage)) {
        console.log('✅ Intenção de SAUDAÇÃO detectada');
        return { name: 'GREETING', confidence: 0.9 };
      }
      
      console.log('⚠️ Nenhuma intenção específica detectada, usando fallback');
      // ✅ FALLBACK INTELIGENTE
      const fallbackIntent = this.fallbackIntentRecognition(message);
      console.log('🔄 Fallback retornou:', fallbackIntent);
      return fallbackIntent;
      
    } catch (error) {
      console.error('❌ Erro na detecção de intenção:', error);
      return { name: 'UNKNOWN', confidence: 0.0 };
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
    const keywords = ['agendar', 'consulta', 'marcar', 'agendamento'];
    return keywords.some(keyword => message.includes(keyword));
  }

  static containsContactKeywords(message) {
    const keywords = ['telefone', 'contato', 'whatsapp', 'whats', 'numero', 'celular'];
    return keywords.some(keyword => message.includes(keyword));
  }

  static containsExamKeywords(message) {
    const keywords = ['exame', 'laboratório', 'raio-x', 'ultrassom', 'tomografia', 'mamografia'];
    return keywords.some(keyword => message.includes(keyword));
  }

  static containsDoctorKeywords(message) {
    const keywords = ['médico', 'doutor', 'especialista', 'clínico', 'psicólogo', 'nutricionista'];
    return keywords.some(keyword => message.includes(keyword));
  }

  static containsInfoKeywords(message) {
    const keywords = ['informação', 'saber', 'conhecer', 'quais', 'como', 'onde', 'quando'];
    return keywords.some(keyword => message.includes(keyword));
  }

  static containsGreetingKeywords(message) {
    const keywords = ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'olá', 'oi'];
    return keywords.some(keyword => message.includes(keyword));
  }

  static isAppointmentIntent(intent) {
    // 🔧 CORREÇÃO: Verificar se intent existe e tem propriedades válidas
    if (!intent || !intent.name) {
      console.log('🔍 Intent inválido ou sem nome:', intent);
      return false;
    }
    
    const result = (
      intent.name === 'APPOINTMENT' || 
      intent.name === 'SCHEDULE_INFO' ||
      (typeof intent.name === 'string' && intent.name.includes('APPOINTMENT'))
    );
    
    console.log('🔍 Verificando se é intenção de agendamento:', {
      intent: intent.name,
      isAppointment: result
    });
    
    return result;
  }

  static mapIntentToCategory(intentName) {
    const categories = {
      'APPOINTMENT': 'scheduling',
      'INFORMATION': 'information',
      'GREETING': 'conversation',
      'SCHEDULE_INFO': 'information',
      'PRICING_INFO': 'information',
      'LOCATION_INFO': 'information',
      'CONTACT_INFO': 'information',
      'GENERAL_QUERY': 'general'
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
7. Use o nome do usuário quando disponível para personalizar a conversa
8. Se o usuário perguntar sobre seu nome, responda com: "${agentName}"
9. 🔧 IMPORTANTE: NÃO adicione saudações como "Olá" no início das respostas
10. 🔧 IMPORTANTE: NÃO adicione mensagens finais como "Como posso ajudá-lo hoje" - o sistema fará isso automaticamente
11. 🔧 IMPORTANTE: NÃO adicione mensagens de despedida como "Até breve" - use apenas quando o usuário finalizar conversa
12. 🔧 IMPORTANTE: Mantenha a conversa fluida e natural, sem padrões repetitivos

INFORMAÇÕES COMPLETAS DA CLÍNICA:
- Nome: ${clinicContext.name}
- Endereço: ${clinicContext.address?.rua ? `${clinicContext.address.rua}, ${clinicContext.address.numero} - ${clinicContext.address.bairro}, ${clinicContext.address.cidade}/${clinicContext.address.estado}` : 'Não informado'}
- Telefone: ${clinicContext.contacts?.telefone || 'Não informado'}
- WhatsApp: ${clinicContext.contacts?.whatsapp || 'Não informado'}
- Email: ${clinicContext.contacts?.email_principal || 'Não informado'}
- Website: ${clinicContext.contacts?.website || 'Não informado'}
- Descrição: ${clinicContext.basicInfo?.descricao || 'Não informado'}
- Especialidade: ${clinicContext.basicInfo?.especialidade || 'Não informado'}
- Serviços: ${clinicContext.services && clinicContext.services.length > 0 ? clinicContext.services.map(s => s.nome).join(', ') : 'Não informado'}
- Profissionais: ${clinicContext.professionals && clinicContext.professionals.length > 0 ? clinicContext.professionals.map(p => `${p.nome_exibicao || p.nome_completo} (${p.especialidades?.join(', ') || 'Especialidade não informada'})`).join('\n  * ') : 'Não informado'}

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

INSTRUÇÕES ESPECÍFICAS:
- Para perguntas sobre CONTATOS: Forneça telefone, WhatsApp, email e endereço quando disponíveis
- Para perguntas sobre EXAMES: Liste os exames disponíveis quando informados, caso contrário oriente a entrar em contato
- Para perguntas sobre MÉDICOS: Liste os profissionais quando informados, caso contrário oriente a entrar em contato
- Para perguntas sobre SERVIÇOS: Liste os serviços disponíveis quando informados
- Para perguntas sobre HORÁRIOS: Forneça os horários de funcionamento específicos
- Para perguntas sobre PREÇOS: Oriente a entrar em contato, pois não possui essas informações

Lembre-se: Você é um assistente virtual especializado em ${clinicContext.basicInfo?.especialidade || 'medicina'}. Suas respostas devem ser baseadas APENAS nas informações fornecidas acima.`;

    return prompt;
  }

  // ✅ CONSTRUÇÃO DE MENSAGENS
  static buildMessages(systemPrompt, memory, userMessage) {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Adicionar contexto do usuário se disponível
    if (memory.userProfile && memory.userProfile.name) {
      messages.push({
        role: 'system', 
        content: `INFORMAÇÃO IMPORTANTE: O usuário se chama ${memory.userProfile.name}. Use este nome para personalizar suas respostas quando apropriado.`
      });
    }
    
    // Adicionar histórico de conversa se disponível
    if (memory.history && memory.history.length > 0) {
      const recentHistory = memory.history.slice(-5); // Últimas 5 mensagens
      
      console.log(`📚 [LLMOrchestrator] Adicionando ${recentHistory.length} mensagens do histórico`);
      
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
    
    console.log(`📝 [LLMOrchestrator] Total de mensagens construídas: ${messages.length}`);
    
    return messages;
  }

  // ✅ VERIFICAÇÃO DE PRIMEIRA CONVERSA DO DIA CORRIGIDA
  static async isFirstConversationOfDay(phoneNumber) {
    try {
      console.log(`📅 [LLMOrchestrator] Verificando primeira conversa do dia para: ${phoneNumber}`);
      
      // 🔧 CORREÇÃO: Buscar por last_interaction ou updated_at
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('last_interaction, updated_at, conversation_history')
        .eq('phone_number', phoneNumber)
        .single();
      
      console.log(`📅 [LLMOrchestrator] Resultado da busca:`, {
        hasData: !!data,
        hasError: !!error,
        errorCode: error?.code,
        lastInteraction: data?.last_interaction,
        updatedAt: data?.updated_at,
        hasHistory: !!data?.conversation_history
      });
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ [LLMOrchestrator] Erro ao buscar memória:', error);
        throw error;
      }
      
      if (!data) {
        console.log('📅 [LLMOrchestrator] Primeira conversa - sem histórico anterior');
        return true; // Primeira conversa
      }
      
      // 🔧 CORREÇÃO: Usar last_interaction ou updated_at, o que estiver disponível
      const lastInteraction = data.last_interaction || data.updated_at;
      
      if (!lastInteraction) {
        console.log('📅 [LLMOrchestrator] Primeira conversa - sem timestamp de interação');
        return true; // Primeira conversa
      }
      
      const lastConversation = new Date(lastInteraction);
      const today = new Date();
      
      // Verificar se é o mesmo dia (usando timezone do Brasil)
      const lastConversationDate = lastConversation.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const todayDate = today.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      
      const isFirstOfDay = lastConversationDate !== todayDate;
      
      console.log('📅 [LLMOrchestrator] Verificação de primeira conversa:', {
        lastConversation: lastConversationDate,
        today: todayDate,
        isFirstOfDay,
        lastInteraction: lastInteraction,
        lastConversationISO: lastConversation.toISOString(),
        todayISO: today.toISOString()
      });
      
      return isFirstOfDay;
      
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
  static async applyResponseLogic(response, clinicContext, isFirstConversationOfDay, isWithinBusinessHours, userProfile) {
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

      // 🔧 CORREÇÃO 1: Só adicionar saudação na PRIMEIRA conversa do dia
      if (isFirstConversationOfDay) {
        console.log('👋 [LLMOrchestrator] PRIMEIRA conversa do dia - aplicando saudação inicial');
        
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
    let patternsRemoved = 0;
    
    patterns.forEach((pattern, index) => {
      const beforeLength = cleanText.length;
      cleanText = cleanText.replace(pattern, '');
      if (cleanText.length !== beforeLength) {
        patternsRemoved++;
        console.log(`🧹 [LLMOrchestrator] Padrão ${index + 1} removido`);
      }
    });
    
    // Limpar espaços extras e quebras de linha duplicadas
    cleanText = cleanText.replace(/\n\s*\n/g, '\n\n').trim();
    
    // Remover linhas vazias no início
    cleanText = cleanText.replace(/^\n+/, '');
    
    console.log(`🧹 [LLMOrchestrator] ${patternsRemoved} padrões de saudação removidos, texto limpo`);
    
    return cleanText;
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
