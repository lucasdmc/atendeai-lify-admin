
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class EnhancedAIService {
  constructor() {
    this.maxTokens = 1500;
    this.maxHistoryTurns = 12;
    this.temperature = 0.7;
  }

  async processMessage(message, phoneNumber, agentId, context = {}) {
    try {
      console.log('🧠 [EnhancedAI] Processando mensagem com IA AVANÇADA', { phoneNumber, agentId });

      // 1. Carregar memória da conversa
      const conversationMemory = await this.loadConversationMemory(phoneNumber, agentId);
      
      // 2. Detectar intenção da mensagem
      const intentResult = await this.detectIntent(message, conversationMemory);
      
      // 3. Verificar se é uma saudação repetida
      const isRepeatedGreeting = this.isRepeatedGreeting(message, conversationMemory);
      
      // 4. Extrair nome do usuário se presente
      const userName = this.extractUserName(message, conversationMemory);
      if (userName && !conversationMemory.userName) {
        conversationMemory.userName = userName;
      }
      
      // 5. Detectar ações pendentes
      const pendingAction = this.detectPendingAction(conversationMemory);
      
      // 6. Verificar se é retorno do usuário
      const isUserReturn = this.isUserReturn(conversationMemory);
      
      // 7. Gerar resposta contextualizada
      const response = await this.generateContextualResponse({
        message,
        phoneNumber,
        agentId,
        context,
        conversationMemory,
        intentResult,
        isRepeatedGreeting,
        userName: conversationMemory.userName,
        pendingAction,
        isUserReturn
      });
      
      // 8. Salvar interação na memória
      await this.saveInteraction(phoneNumber, message, response, intentResult.intent, {
        agentId: agentId,
        confidence: intentResult.confidence,
        userName: conversationMemory.userName,
        pendingAction: pendingAction,
        isUserReturn: isUserReturn,
        conversationContext: {
          intent: intentResult.intent,
          confidence: intentResult.confidence,
          isRepeatedGreeting: isRepeatedGreeting
        }
      });
      
      return {
        success: true,
        response: response,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        metadata: {
          userName: conversationMemory.userName,
          pendingAction: pendingAction,
          isUserReturn: isUserReturn,
          isRepeatedGreeting: isRepeatedGreeting
        }
      };

    } catch (error) {
      console.error('❌ [EnhancedAI] Erro no processamento:', error);
      return {
        success: false,
        response: 'Desculpe, estou com dificuldades técnicas. Tente novamente em alguns instantes.',
        error: error.message
      };
    }
  }

  async detectIntent(message, conversationMemory) {
    try {
      const prompt = `Analise a mensagem e classifique a intenção principal.

Mensagem: "${message}"

Histórico da conversa:
${conversationMemory.recentMessages ? conversationMemory.recentMessages.map(msg => `- Usuário: ${msg.user}\n- Bot: ${msg.assistant}`).join('\n') : 'Nenhum histórico'}

Classifique em uma das seguintes categorias:
- GREETING: Saudações, olá, bom dia, etc.
- INTRODUCTION: Apresentação, "me chamo", "meu nome é", etc.
- PERSONAL_INFO: Perguntas sobre informações pessoais, "qual meu nome", etc.
- APPOINTMENT: Agendamento, consulta, marcação, etc.
- INFORMATION: Informações sobre serviços, horários, localização, etc.
- SUPPORT: Ajuda, suporte, problemas, etc.
- GOODBYE: Despedidas, tchau, até logo, etc.

Responda apenas com o nome da categoria.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 50,
      });

      const intentName = completion.choices[0]?.message?.content?.trim() || 'GREETING';

      return {
        intent: intentName,
        confidence: 0.8,
        entities: {},
        requiresAction: false
      };

    } catch (error) {
      console.error('❌ [EnhancedAI] Erro ao detectar intenção:', error);
      return {
        intent: 'GREETING',
        confidence: 0.5,
        entities: {},
        requiresAction: false
      };
    }
  }

  extractUserName(message, conversationMemory) {
    if (conversationMemory.userName) return conversationMemory.userName;

    const namePatterns = [
      /meu nome é (\w+)/i,
      /me chamo (\w+)/i,
      /sou o (\w+)/i,
      /sou a (\w+)/i,
      /eu sou (\w+)/i
    ];

    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  isRepeatedGreeting(message, conversationMemory) {
    const greetingPatterns = /^(olá|oi|ola|bom dia|boa tarde|boa noite|hey|e aí)/i;
    
    if (!greetingPatterns.test(message)) return false;
    
    if (!conversationMemory.recentMessages) return false;
    
    return conversationMemory.recentMessages.some(msg => 
      greetingPatterns.test(msg.user)
    );
  }

  detectPendingAction(conversationMemory) {
    if (!conversationMemory.recentMessages) return null;

    const actionPatterns = {
      'agendamento': /agend|consulta|marcar/i,
      'informações': /informação|info|saber sobre/i,
      'preços': /preço|valor|custo|quanto/i,
      'horários': /horário|funcionamento|aberto/i,
      'localização': /onde|endereço|localização|como chegar/i
    };

    for (const [action, pattern] of Object.entries(actionPatterns)) {
      const hasAction = conversationMemory.recentMessages.some(msg => 
        pattern.test(msg.user) && !msg.assistant.includes('telefone') && !msg.assistant.includes('diretamente')
      );
      
      if (hasAction) return action;
    }

    return null;
  }

  isUserReturn(conversationMemory) {
    if (!conversationMemory.recentMessages) return false;
    return conversationMemory.recentMessages.length > 3;
  }

  async loadConversationMemory(phoneNumber, agentId) {
    try {
      console.log('🧠 [EnhancedAI] Carregando memória conversacional', { phoneNumber, agentId });
      
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(this.maxHistoryTurns);

      if (error) {
        console.error('❌ [EnhancedAI] Erro ao carregar memória do Supabase:', error);
        throw error;
      }

      console.log('✅ [EnhancedAI] Memória carregada com sucesso', { 
        recordsFound: data?.length || 0,
        phoneNumber,
        agentId 
      });

      if (!data || data.length === 0) {
        console.log('📝 [EnhancedAI] Nenhuma memória encontrada - primeira conversa', { phoneNumber });
        return {
          recentMessages: [],
          userName: null,
          totalMessages: 0,
          hasIntroduced: false,
          lastIntent: null
        };
      }

      // Processar dados da memória
      const recentMessages = data.map(record => ({
        user: record.user_message,
        assistant: record.bot_response,
        intent: record.intent,
        confidence: record.confidence,
        timestamp: record.created_at
      })).reverse(); // Ordem cronológica

      // Extrair informações importantes
      const userName = data.find(record => record.user_name)?.user_name || null;
      const hasIntroduced = data.some(record => record.has_introduced) || false;
      const lastIntent = data[0]?.intent || null;

      console.log('🎯 [EnhancedAI] Memória processada', {
        messagesCount: recentMessages.length,
        userName: userName,
        hasIntroduced: hasIntroduced,
        lastIntent: lastIntent
      });

      return {
        recentMessages,
        userName,
        totalMessages: data.length,
        hasIntroduced,
        lastIntent
      };

    } catch (error) {
      console.error('💥 [EnhancedAI] ERRO CRÍTICO ao carregar memória:', error);
      
      // Em caso de erro, retornar estrutura vazia mas logar o problema
      return {
        recentMessages: [],
        userName: null,
        totalMessages: 0,
        hasIntroduced: false,
        lastIntent: null,
        error: error.message
      };
    }
  }

  async saveInteraction(phoneNumber, message, response, intent, metadata = {}) {
    try {
      console.log('💾 [EnhancedAI] Salvando interação na memória', { 
        phoneNumber, 
        messageLength: message.length,
        responseLength: response.length,
        intent 
      });

      const interactionData = {
        phone_number: phoneNumber,
        agent_id: metadata.agentId || 'default',
        user_message: message,
        bot_response: response,
        intent: intent,
        confidence: metadata.confidence || 0.5,
        user_name: metadata.userName || null,
        pending_action: metadata.pendingAction || null,
        is_user_return: metadata.isUserReturn || false,
        is_repeated_greeting: metadata.isRepeatedGreeting || false,
        has_introduced: metadata.hasIntroduced || false,
        conversation_context: metadata.conversationContext || {},
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('conversation_memory')
        .insert(interactionData)
        .select();

      if (error) {
        console.error('❌ [EnhancedAI] Erro ao salvar interação:', error);
        throw error;
      }

      console.log('✅ [EnhancedAI] Interação salva com sucesso', { 
        interactionId: data[0]?.id,
        phoneNumber,
        userName: metadata.userName 
      });

      return { success: true, interactionId: data[0]?.id };

    } catch (error) {
      console.error('💥 [EnhancedAI] ERRO CRÍTICO ao salvar interação:', error);
      return { success: false, error: error.message };
    }
  }

  async generateContextualResponse(context) {
    try {
      const { message, conversationMemory, intentResult, userName, pendingAction, isUserReturn } = context;
      
      // Construir prompt contextualizado
      let systemPrompt = `Você é o Dr. Carlos, assistente virtual da CardioPrime.

PERSONALIDADE: Acolhedor, profissional e empático. Use emojis ocasionalmente para tornar a conversa mais amigável.

INFORMAÇÕES DA CLÍNICA:
Nome: CardioPrime
Especialidade: Cardiologia

EQUIPE MÉDICA:
- Dr. João Silva (Cardiologia Clínica) - CRM: 12345-SP
- Dra. Maria Oliveira (Cardiologia Intervencionista) - CRM: 67890-SP

HORÁRIOS DE FUNCIONAMENTO:
Segunda a Sexta: 8h às 18h
Sábado: 8h às 12h
Domingo: Fechado

SERVIÇOS OFERECIDOS:
- Consulta Cardiológica: R$ 250,00 (30 minutos)
- Eletrocardiograma (ECG): R$ 80,00 (15 minutos)
- Ecocardiograma: R$ 350,00 (45 minutos)
- Teste Ergométrico: R$ 400,00 (60 minutos)

LOCALIZAÇÃO:
Rua das Flores, 123, Centro, São Paulo/SP - CEP: 01234-567

CONTATOS:
Telefone: +55 11 3456-7890
WhatsApp: +55 11 99876-5432
Email: contato@cardioprime.com.br

INSTRUÇÕES IMPORTANTES:
1. SEMPRE use as informações específicas da clínica fornecidas acima
2. NUNCA invente informações que não estão no contexto
3. Para agendamentos, oriente a entrar em contato pelo telefone: +55 11 3456-7890
4. Para emergências, oriente a procurar atendimento médico imediato
5. NUNCA dê conselhos médicos - apenas informações sobre a clínica
6. Use o nome do usuário quando ele se apresentar
7. Seja consistente com as informações - não contradiga dados anteriores
8. Mantenha as respostas concisas mas completas`;

      // Adicionar contexto da conversa
      if (conversationMemory.recentMessages && conversationMemory.recentMessages.length > 0) {
        systemPrompt += `\n\nHISTÓRICO DA CONVERSA:\n`;
        conversationMemory.recentMessages.slice(-3).forEach(msg => {
          systemPrompt += `- Usuário: ${msg.user}\n- Bot: ${msg.assistant}\n`;
        });
      }

      // Adicionar informações do usuário
      if (userName) {
        systemPrompt += `\n\nNOME DO USUÁRIO: ${userName}`;
      }

      // Adicionar contexto de intenção
      if (intentResult.intent === 'PERSONAL_INFO' && userName) {
        systemPrompt += `\n\nO usuário está perguntando sobre informações pessoais. Se ele perguntar sobre o nome dele, responda que se chama ${userName}.`;
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      });

      return completion.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';

    } catch (error) {
      console.error('❌ [EnhancedAI] Erro ao gerar resposta:', error);
      return 'Desculpe, estou com dificuldades técnicas. Tente novamente em alguns instantes.';
    }
  }
}

// Função de compatibilidade com o sistema atual
async function processMessage(params) {
  const enhancedAI = new EnhancedAIService();
  return await enhancedAI.processMessage(
    params.message,
    params.phoneNumber,
    params.agentId,
    params.context
  );
}

export {
  EnhancedAIService,
  processMessage
};
