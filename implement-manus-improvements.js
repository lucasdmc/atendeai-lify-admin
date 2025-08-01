const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurar Supabase
const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function implementManusImprovements() {
  try {
    console.log('🚀 IMPLEMENTANDO MELHORIAS BASEADAS NA ANÁLISE DO MANUS');
    console.log('========================================================');

    // 1. VERIFICAR SISTEMA ATUAL
    console.log('\n1️⃣ Verificando sistema atual...');
    
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('whatsapp_phone', '554730915628')
      .single();

    if (clinicError) {
      console.error('❌ Erro ao buscar clínica:', clinicError);
    } else {
      console.log('✅ Clínica encontrada:', clinicData.name);
      console.log('🎯 Tem contextualização:', clinicData.has_contextualization);
    }

    // 2. TESTAR FUNÇÃO GET_CLINIC_CONTEXTUALIZATION
    console.log('\n2️⃣ Testando função get_clinic_contextualization...');
    
    try {
      const { data: contextData, error: contextError } = await supabase.rpc('get_clinic_contextualization', {
        p_whatsapp_phone: '554730915628'
      });

      if (contextError) {
        console.error('❌ Erro na função get_clinic_contextualization:', contextError);
      } else {
        console.log('✅ Função funcionando!');
        console.log('📋 Dados retornados:', contextData);
      }
    } catch (e) {
      console.log('⚠️ Função ainda não disponível');
    }

    // 3. VERIFICAR TABELAS DE MEMÓRIA
    console.log('\n3️⃣ Verificando tabelas de memória...');
    
    const { data: memoryData, error: memoryError } = await supabase
      .from('conversation_memory')
      .select('*')
      .limit(1);

    if (memoryError) {
      console.error('❌ Erro na tabela conversation_memory:', memoryError);
    } else {
      console.log('✅ Tabela conversation_memory funcionando!');
    }

    const { data: messagesData, error: messagesError } = await supabase
      .from('ai_whatsapp_messages')
      .select('*')
      .limit(1);

    if (messagesError) {
      console.error('❌ Erro na tabela ai_whatsapp_messages:', messagesError);
    } else {
      console.log('✅ Tabela ai_whatsapp_messages funcionando!');
    }

    // 4. CRIAR ENHANCED AI SERVICE (SE NÃO EXISTIR)
    console.log('\n4️⃣ Criando EnhancedAIService...');
    
    const enhancedAIServiceCode = `
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const ConversationMemoryService = require('./conversationMemoryService');
const IntentRecognitionService = require('./intentRecognitionService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
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
      await this.saveConversationMemory(phoneNumber, agentId, {
        userMessage: message,
        botResponse: response,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        userName: conversationMemory.userName,
        pendingAction: pendingAction,
        isUserReturn: isUserReturn,
        timestamp: new Date().toISOString()
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
      const prompt = \`Analise a mensagem e classifique a intenção principal.

Mensagem: "\${message}"

Histórico recente: \${JSON.stringify(conversationMemory.recentMessages || [])}

Intenções possíveis:
- GREETING: Saudações (olá, oi, bom dia, etc.)
- APPOINTMENT_REQUEST: Solicitação de agendamento
- CLINIC_INFO: Informações gerais da clínica
- DOCTOR_INFO: Informações sobre médicos
- SCHEDULE_INFO: Horários de funcionamento
- PRICE_INFO: Informações sobre preços/valores
- LOCATION_INFO: Localização da clínica
- ABOUT_BOT: Perguntas sobre o assistente/capacidades
- HELP: Pedidos de ajuda
- CONTINUE_ACTION: Continuar ação anterior
- GOODBYE: Despedidas
- OTHER: Outras intenções

Responda apenas com o nome da intenção e um score de confiança (0-1).
Formato: INTENÇÃO|CONFIANÇA\`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 50,
        temperature: 0.3
      });

      const result = completion.choices[0].message.content.trim();
      const [intent, confidence] = result.split('|');

      return {
        intent: intent || 'OTHER',
        confidence: parseFloat(confidence) || 0.5
      };

    } catch (error) {
      console.error('❌ [EnhancedAI] Erro na detecção de intenção:', error);
      return { intent: 'OTHER', confidence: 0.5 };
    }
  }

  async generateContextualResponse(params) {
    const {
      message,
      context,
      conversationMemory,
      intentResult,
      isRepeatedGreeting,
      userName,
      pendingAction,
      isUserReturn
    } = params;

    try {
      // Construir prompt contextualizado
      let systemPrompt = context.systemPrompt || \`Você é um assistente virtual de uma clínica médica.
        Seja acolhedor, profissional e útil. Use emojis ocasionalmente.
        Mantenha respostas concisas e diretas.\`;

      // Adicionar contexto específico baseado na intenção
      systemPrompt += this.getIntentSpecificContext(intentResult.intent);

      // Adicionar contexto de personalização
      if (userName) {
        systemPrompt += \`\\n\\nO nome do usuário é \${userName}. Use o nome ocasionalmente para personalizar as respostas.\`;
      }

      // Adicionar contexto de ações pendentes
      if (pendingAction) {
        systemPrompt += \`\\n\\nO usuário tem uma ação pendente: \${pendingAction}. Ofereça para continuar se relevante.\`;
      }

      // Adicionar contexto de retorno
      if (isUserReturn) {
        systemPrompt += \`\\n\\nEste usuário já conversou antes. Seja acolhedor no retorno.\`;
      }

      // Adicionar contexto de saudação repetida
      if (isRepeatedGreeting) {
        systemPrompt += \`\\n\\nO usuário já cumprimentou antes nesta conversa. Responda de forma natural sem se reapresentar.\`;
      }

      // Construir mensagens para o OpenAI
      const messages = [
        { role: "system", content: systemPrompt }
      ];

      // Adicionar histórico de conversa
      if (conversationMemory.recentMessages) {
        conversationMemory.recentMessages.forEach(msg => {
          messages.push({ role: "user", content: msg.user });
          messages.push({ role: "assistant", content: msg.assistant });
        });
      }

      // Adicionar mensagem atual
      messages.push({ role: "user", content: message });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature
      });

      return completion.choices[0].message.content.trim();

    } catch (error) {
      console.error('❌ [EnhancedAI] Erro na geração de resposta:', error);
      return 'Desculpe, estou com dificuldades técnicas. Tente novamente em alguns instantes.';
    }
  }

  getIntentSpecificContext(intent) {
    const contexts = {
      GREETING: '\\n\\nPara saudações, seja caloroso e pergunte como pode ajudar.',
      APPOINTMENT_REQUEST: '\\n\\nPara agendamentos, colete informações básicas e oriente a confirmar por telefone.',
      CLINIC_INFO: '\\n\\nForneça informações gerais da clínica de forma clara e útil.',
      DOCTOR_INFO: '\\n\\nForneça informações sobre os médicos disponíveis.',
      SCHEDULE_INFO: '\\n\\nInforme os horários de funcionamento claramente.',
      PRICE_INFO: '\\n\\nPara preços, oriente a consultar diretamente a clínica.',
      LOCATION_INFO: '\\n\\nForneça informações de localização e como chegar.',
      ABOUT_BOT: '\\n\\nExplique suas capacidades como assistente virtual da clínica.',
      HELP: '\\n\\nOfereça ajuda específica e liste opções disponíveis.',
      CONTINUE_ACTION: '\\n\\nAjude a continuar a ação que estava em andamento.',
      GOODBYE: '\\n\\nDespeça-se de forma cordial e deixe a porta aberta para retorno.'
    };

    return contexts[intent] || '';
  }

  extractUserName(message, conversationMemory) {
    if (conversationMemory.userName) return conversationMemory.userName;

    const namePatterns = [
      /meu nome é (\\w+)/i,
      /me chamo (\\w+)/i,
      /sou o (\\w+)/i,
      /sou a (\\w+)/i,
      /eu sou (\\w+)/i
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
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(this.maxHistoryTurns);

      if (error) throw error;

      const recentMessages = data.map(record => ({
        user: record.user_message,
        assistant: record.bot_response,
        timestamp: record.created_at
      })).reverse();

      const userName = data.find(record => record.user_name)?.user_name || null;

      return {
        recentMessages,
        userName,
        totalMessages: data.length
      };

    } catch (error) {
      console.error('❌ [EnhancedAI] Erro ao carregar memória:', error);
      return { recentMessages: [], userName: null, totalMessages: 0 };
    }
  }

  async saveConversationMemory(phoneNumber, agentId, interaction) {
    try {
      const { error } = await supabase
        .from('conversation_memory')
        .insert({
          phone_number: phoneNumber,
          agent_id: agentId,
          user_message: interaction.userMessage,
          bot_response: interaction.botResponse,
          intent: interaction.intent,
          confidence: interaction.confidence,
          user_name: interaction.userName,
          pending_action: interaction.pendingAction,
          is_user_return: interaction.isUserReturn,
          created_at: interaction.timestamp
        });

      if (error) throw error;

      console.log('💾 [EnhancedAI] Interação salva na memória', { phoneNumber, agentId });

    } catch (error) {
      console.error('❌ [EnhancedAI] Erro ao salvar memória:', error);
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

module.exports = {
  EnhancedAIService,
  processMessage
};
`;

    // Salvar o EnhancedAIService
    const fs = require('fs');
    fs.writeFileSync('/tmp/enhancedAIService.js', enhancedAIServiceCode);
    console.log('✅ EnhancedAIService criado em /tmp/enhancedAIService.js');

    // 5. CRIAR SCRIPT DE TESTE
    console.log('\n5️⃣ Criando script de teste...');
    
    const testScript = `
const { EnhancedAIService } = require('./enhancedAIService');

async function testEnhancedAI() {
  console.log('🧪 TESTANDO ENHANCED AI SERVICE');
  console.log('================================');
  
  const ai = new EnhancedAIService();
  const testPhoneNumber = '554730915628';
  const testAgentId = 'cardioprime';
  
  // Teste 1: Primeira saudação
  console.log('\\n📝 Teste 1: Primeira saudação');
  const test1 = await ai.processMessage(
    'Olá!',
    testPhoneNumber,
    testAgentId,
    {
      systemPrompt: 'Você é o Dr. Carlos, assistente virtual da CardioPrime.',
      enableRAG: true,
      enableMemory: true,
      enablePersonalization: true
    }
  );
  console.log('Resposta:', test1.response);
  console.log('Intenção:', test1.intent);
  console.log('Confiança:', test1.confidence);
  console.log('✅ Teste 1 concluído\\n');
  
  // Teste 2: Saudação repetida
  console.log('📝 Teste 2: Saudação repetida');
  const test2 = await ai.processMessage(
    'Olá!',
    testPhoneNumber,
    testAgentId,
    {
      systemPrompt: 'Você é o Dr. Carlos, assistente virtual da CardioPrime.',
      enableRAG: true,
      enableMemory: true,
      enablePersonalization: true
    }
  );
  console.log('Resposta:', test2.response);
  console.log('É saudação repetida:', test2.metadata.isRepeatedGreeting);
  console.log('✅ Teste 2 concluído\\n');
  
  // Teste 3: Apresentação com nome
  console.log('📝 Teste 3: Apresentação com nome');
  const test3 = await ai.processMessage(
    'Meu nome é João',
    testPhoneNumber,
    testAgentId,
    {
      systemPrompt: 'Você é o Dr. Carlos, assistente virtual da CardioPrime.',
      enableRAG: true,
      enableMemory: true,
      enablePersonalization: true
    }
  );
  console.log('Resposta:', test3.response);
  console.log('Nome extraído:', test3.metadata.userName);
  console.log('✅ Teste 3 concluído\\n');
  
  // Teste 4: Pergunta sobre capacidades
  console.log('📝 Teste 4: Pergunta sobre capacidades');
  const test4 = await ai.processMessage(
    'Para que você serve? Quais são suas capacidades?',
    testPhoneNumber,
    testAgentId,
    {
      systemPrompt: 'Você é o Dr. Carlos, assistente virtual da CardioPrime.',
      enableRAG: true,
      enableMemory: true,
      enablePersonalization: true
    }
  );
  console.log('Resposta:', test4.response);
  console.log('Intenção:', test4.intent);
  console.log('✅ Teste 4 concluído\\n');
  
  // Teste 5: Solicitação de agendamento
  console.log('📝 Teste 5: Solicitação de agendamento');
  const test5 = await ai.processMessage(
    'Gostaria de agendar uma consulta',
    testPhoneNumber,
    testAgentId,
    {
      systemPrompt: 'Você é o Dr. Carlos, assistente virtual da CardioPrime.',
      enableRAG: true,
      enableMemory: true,
      enablePersonalization: true
    }
  );
  console.log('Resposta:', test5.response);
  console.log('Intenção:', test5.intent);
  console.log('Usa nome do usuário:', test5.response.includes('João'));
  console.log('✅ Teste 5 concluído\\n');
  
  console.log('🎉 Todos os testes concluídos!');
}

testEnhancedAI().catch(console.error);
`;

    fs.writeFileSync('/tmp/test-enhanced-ai.js', testScript);
    console.log('✅ Script de teste criado em /tmp/test-enhanced-ai.js');

    console.log('\n🎯 IMPLEMENTAÇÃO CONCLUÍDA!');
    console.log('📋 RESUMO:');
    console.log('   ✅ EnhancedAIService criado');
    console.log('   ✅ Script de teste preparado');
    console.log('   ✅ Sistema pronto para otimização');
    console.log('   ✅ Próximo passo: Integrar no webhook');

  } catch (error) {
    console.error('❌ Erro crítico:', error);
  }
}

implementManusImprovements(); 