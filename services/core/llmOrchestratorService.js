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
      // Por enquanto, usar clínica padrão 'cardioprime'
      // TODO: Implementar seleção de clínica baseada no número do WhatsApp
      const clinicContext = await this.getClinicContext('cardioprime');
      
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
        console.log('📅 Intenção de agendamento detectada, delegando para AppointmentFlowManager');
        
        try {
          const appointmentResult = await this.appointmentFlowManager.handleAppointmentIntent(
            phoneNumber,
            message,
            intent,
            clinicContext,
            memory
          );
          
          if (appointmentResult.success) {
            console.log('✅ Agendamento processado com sucesso');
            return appointmentResult;
          }
        } catch (error) {
          console.error('❌ Erro no AppointmentFlowManager:', error);
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
        clinicContext, 
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

  // ✅ FUNÇÃO SIMPLIFICADA PARA OBTER CONTEXTO
  static async getClinicContext(clinicKey = 'cardioprime') {
    try {
      console.log(`🏥 [LLMOrchestrator] Buscando contextualização para: ${clinicKey}`);
      
      // ✅ USAR APENAS JSON - ClinicContextManager simplificado
      return ClinicContextManager.getClinicContext(clinicKey);
      
    } catch (error) {
      console.error('❌ [LLMOrchestrator] Erro ao obter contexto:', error);
      // Fallback para contexto padrão
      return ClinicContextManager.getDefaultContext(clinicKey);
    }
  }

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
          user_profile: { name: name },
          updated_at: new Date().toISOString()
        });
      
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
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        return {
          userProfile: data.user_profile || {},
          history: data.conversation_history || [],
          lastUpdated: data.updated_at
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
          conversation_history: trimmedHistory,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      console.log('✅ Memória de conversa salva');
    } catch (error) {
      console.error('❌ Erro ao salvar memória:', error);
    }
  }

  static async detectIntent(message, conversationHistory = [], clinicContext = {}) {
    try {
      console.log('🔍 Detectando intenção...');
      
      // ✅ DETECÇÃO SIMPLIFICADA COM PALAVRAS-CHAVE
      const lowerMessage = message.toLowerCase();
      
      // Agendamento
      if (this.containsAppointmentKeywords(lowerMessage)) {
        return { name: 'APPOINTMENT', confidence: 0.9 };
      }
      
      // Informações
      if (this.containsInfoKeywords(lowerMessage)) {
        return { name: 'INFORMATION', confidence: 0.8 };
      }
      
      // Saudação
      if (this.containsGreetingKeywords(lowerMessage)) {
        return { name: 'GREETING', confidence: 0.9 };
      }
      
      // ✅ FALLBACK INTELIGENTE
      return this.fallbackIntentRecognition(message);
      
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
    const keywords = ['agendar', 'consulta', 'marcar', 'horário', 'disponível', 'agendamento'];
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
    return intent && (
      intent.name === 'APPOINTMENT' || 
      intent.name === 'SCHEDULE_INFO' ||
      intent.name.includes('APPOINTMENT')
    );
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

INFORMAÇÕES COMPLETAS DA CLÍNICA:
- Nome: ${clinicContext.name}
- Endereço: ${clinicContext.address || 'Não informado'}
- Telefone: ${clinicContext.phone || 'Não informado'}
- Email: ${clinicContext.email || 'Não informado'}
- Website: ${clinicContext.website || 'Não informado'}
- Descrição: ${clinicContext.description || 'Não informado'}
- Missão: ${clinicContext.mission || 'Não informado'}
- Valores: ${clinicContext.values && clinicContext.values.length > 0 ? clinicContext.values.join(', ') : 'Não informado'}
- Diferenciais: ${clinicContext.differentiators && clinicContext.differentiators.length > 0 ? clinicContext.differentiators.join(', ') : 'Não informado'}
- Especialidades: ${clinicContext.specialties && clinicContext.specialties.length > 0 ? clinicContext.specialties.join(', ') : 'Não informado'}
- Serviços: ${clinicContext.services && clinicContext.services.length > 0 ? clinicContext.services.join(', ') : 'Não informado'}
- Profissionais: ${clinicContext.professionals && clinicContext.professionals.length > 0 ? clinicContext.professionals.map(p => p.nome_completo || p.nome).join(', ') : 'Não informado'}

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
- Saudação inicial: "${initialGreeting}"
- Mensagem de despedida: "${farewellMessage}"
- Mensagem fora do horário: "${outOfHoursMessage}"

EMERGÊNCIAS CARDÍACAS (se configuradas):
${cardiacEmergencies.length > 0 ? cardiacEmergencies.map(emergency => `- ${emergency}`).join('\n') : 'Não configuradas'}

IMPORTANTE: Sempre mantenha a personalidade e tom de comunicação definidos. Use as mensagens específicas quando apropriado.`;

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

  // ✅ VERIFICAÇÃO DE PRIMEIRA CONVERSA DO DIA
  static async isFirstConversationOfDay(phoneNumber) {
    try {
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('updated_at')
        .eq('phone_number', phoneNumber)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data || !data.updated_at) {
        return true; // Primeira conversa
      }
      
      const lastConversation = new Date(data.updated_at);
      const today = new Date();
      
      // Verificar se é o mesmo dia
      return lastConversation.toDateString() !== today.toDateString();
      
    } catch (error) {
      console.error('❌ Erro ao verificar primeira conversa do dia:', error);
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

  // ✅ APLICAÇÃO DE LÓGICA DE RESPOSTA
  static async applyResponseLogic(response, clinicContext, isFirstConversationOfDay, isWithinBusinessHours, userProfile) {
    try {
      // Obter configurações do agente
      const agentConfig = clinicContext.agentConfig || {};
      
      console.log('🔧 Configurações do agente encontradas:', {
        nome: agentConfig.nome,
        saudacao_inicial: agentConfig.saudacao_inicial ? 'CONFIGURADA' : 'NÃO CONFIGURADA',
        mensagem_despedida: agentConfig.mensagem_despedida ? 'CONFIGURADA' : 'NÃO CONFIGURADA',
        mensagem_fora_horario: agentConfig.mensagem_fora_horario ? 'CONFIGURADA' : 'NÃO CONFIGURADA'
      });
      
      // Se está fora do horário, usar mensagem fora do horário
      if (!isWithinBusinessHours) {
        const outOfHoursMessage = agentConfig.mensagem_fora_horario || 
          'No momento estamos fora do horário de atendimento. Retornaremos seu contato no próximo horário comercial.';
        
        console.log('🕒 Aplicando mensagem fora do horário');
        return outOfHoursMessage;
      }

      // Se é primeira conversa do dia, adicionar saudação inicial
      if (isFirstConversationOfDay) {
        const initialGreeting = agentConfig.saudacao_inicial || 
          `Olá! Sou o ${agentConfig.nome || 'Assistente Virtual'}, assistente virtual da ${clinicContext.name}. Como posso ajudá-lo hoje?`;
        
        console.log('👋 Aplicando saudação inicial:', initialGreeting.substring(0, 50) + '...');
        
        // Personalizar saudação com nome do usuário se disponível
        let personalizedGreeting = initialGreeting;
        if (userProfile?.name) {
          personalizedGreeting = initialGreeting.replace('Como posso ajudá-lo hoje?', `Como posso ajudá-lo hoje, ${userProfile.name}?`);
        }
        
        // Verificar se já tem saudação na resposta do LLM
        const hasGreeting = response.includes('Olá! Sou o') || 
                           response.includes('assistente virtual') ||
                           response.includes('Como posso ajudá-lo') ||
                           response.includes('Em que posso ajudar') ||
                           response.includes('Como posso cuidar');
        
        console.log('🔍 Verificando duplicação de saudação:', hasGreeting ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
        
        if (hasGreeting) {
          // Remover saudações duplicadas da resposta
          const cleanResponse = this.removeGreetingPatterns(response);
          console.log('🧹 Saudação duplicada removida da resposta');
          return personalizedGreeting + "\n\n" + cleanResponse;
        } else {
          // Não tem saudação, adicionar normalmente
          return personalizedGreeting + "\n\n" + response;
        }
      }

      // Para todas as respostas, verificar duplicações gerais
      const cleanedResponse = this.removeDuplicateContent(response);
      if (cleanedResponse !== response) {
        console.log('🧹 Conteúdo duplicado removido da resposta');
      }

      return cleanedResponse;
      
    } catch (error) {
      console.error('❌ Erro ao aplicar lógica de resposta:', error);
      return response;
    }
  }

  // ✅ REMOÇÃO DE PADRÕES DE SAUDAÇÃO DUPLICADOS
  static removeGreetingPatterns(text) {
    const patterns = [
      /Olá! Sou o .*?assistente virtual.*?Como posso ajudá-lo hoje\?/gi,
      /Olá! Sou o .*?assistente virtual.*?Em que posso ajudar/gi,
      /Olá! Sou o .*?assistente virtual.*?Como posso cuidar/gi,
      /Olá! Sou o .*?assistente virtual.*?Como posso ajudá-lo/gi,
      /Olá! Sou o .*?assistente virtual.*?Em que posso ajudá-lo/gi,
      /Olá! Sou o .*?assistente virtual.*?Como posso ajudar/gi
    ];
    
    let cleanText = text;
    patterns.forEach(pattern => {
      cleanText = cleanText.replace(pattern, '');
    });
    
    // Limpar espaços extras e quebras de linha duplicadas
    cleanText = cleanText.replace(/\n\s*\n/g, '\n\n').trim();
    
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
