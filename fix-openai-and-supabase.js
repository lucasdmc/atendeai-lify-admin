const fs = require('fs');
require('dotenv').config();

async function fixOpenAIAndSupabase() {
  try {
    console.log('🔧 CORRIGINDO API KEY DO OPENAI E CONECTIVIDADE');
    console.log('================================================');

    // 1. CORRIGIR API KEY DO OPENAI
    console.log('\n1️⃣ Corrigindo API key do OpenAI...');
    
    const envPath = '/root/atendeai-lify-backend/.env';
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Substituir a API key placeholder
    const oldOpenAIKey = 'OPENAI_API_KEY=your-openai-key';
    const newOpenAIKey = 'OPENAI_API_KEY=sk-proj-1234567890abcdef'; // Chave de exemplo - você precisa substituir pela chave real
    
    if (envContent.includes(oldOpenAIKey)) {
      envContent = envContent.replace(oldOpenAIKey, newOpenAIKey);
      fs.writeFileSync(envPath, envContent);
      console.log('✅ API key do OpenAI atualizada');
      console.log('⚠️ IMPORTANTE: Substitua pela chave real do OpenAI!');
    } else {
      console.log('⚠️ API key do OpenAI não encontrada ou já foi atualizada');
    }

    // 2. CORRIGIR ENHANCED AI SERVICE PARA USAR SUPABASE CORRETAMENTE
    console.log('\n2️⃣ Corrigindo EnhancedAIService...');
    
    const enhancedAIPath = '/root/atendeai-lify-backend/src/services/ai/enhancedAIService.js';
    let enhancedAIContent = fs.readFileSync(enhancedAIPath, 'utf8');
    
    // Corrigir configuração do Supabase
    const oldSupabaseConfig = `const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);`;
    
    const newSupabaseConfig = `const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);`;
    
    if (enhancedAIContent.includes(oldSupabaseConfig)) {
      enhancedAIContent = enhancedAIContent.replace(oldSupabaseConfig, newSupabaseConfig);
      fs.writeFileSync(enhancedAIPath, enhancedAIContent);
      console.log('✅ Configuração do Supabase corrigida');
    }

    // 3. CRIAR VERSÃO SIMPLIFICADA DO ENHANCED AI SERVICE
    console.log('\n3️⃣ Criando versão simplificada do EnhancedAIService...');
    
    const simplifiedEnhancedAI = `
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

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
    this.temperature = 0.7;
  }

  async processMessage(message, phoneNumber, agentId, context = {}) {
    try {
      console.log('🧠 [EnhancedAI] Processando mensagem:', { phoneNumber, agentId, message });

      // 1. Detectar intenção básica
      const intentResult = await this.detectIntent(message);
      
      // 2. Extrair nome do usuário
      const userName = this.extractUserName(message);
      
      // 3. Verificar se é saudação repetida
      const isRepeatedGreeting = this.isRepeatedGreeting(message);
      
      // 4. Gerar resposta contextualizada
      const response = await this.generateContextualResponse({
        message,
        context,
        intentResult,
        userName,
        isRepeatedGreeting
      });
      
      // 5. Salvar na memória (simplificado)
      await this.saveToMemory(phoneNumber, message, response, intentResult.intent);
      
      return {
        success: true,
        response: response,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        metadata: {
          userName: userName,
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

  async detectIntent(message) {
    try {
      const prompt = \`Analise a mensagem e classifique a intenção principal.

Mensagem: "\${message}"

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
      intentResult,
      userName,
      isRepeatedGreeting
    } = params;

    try {
      // Construir prompt contextualizado
      let systemPrompt = context.systemPrompt || \`Você é o Dr. Carlos, assistente virtual da CardioPrime.
        Seja acolhedor, profissional e útil. Use emojis ocasionalmente.
        Mantenha respostas concisas e diretas.\`;

      // Adicionar contexto específico baseado na intenção
      systemPrompt += this.getIntentSpecificContext(intentResult.intent);

      // Adicionar contexto de personalização
      if (userName) {
        systemPrompt += \`\\n\\nO nome do usuário é \${userName}. Use o nome ocasionalmente para personalizar as respostas.\`;
      }

      // Adicionar contexto de saudação repetida
      if (isRepeatedGreeting) {
        systemPrompt += \`\\n\\nO usuário já cumprimentou antes nesta conversa. Responda de forma natural sem se reapresentar.\`;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
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
      GOODBYE: '\\n\\nDespeça-se de forma cordial e deixe a porta aberta para retorno.'
    };

    return contexts[intent] || '';
  }

  extractUserName(message) {
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

  isRepeatedGreeting(message) {
    const greetingPatterns = /^(olá|oi|ola|bom dia|boa tarde|boa noite|hey|e aí)/i;
    return greetingPatterns.test(message);
  }

  async saveToMemory(phoneNumber, userMessage, botResponse, intent) {
    try {
      const { error } = await supabase
        .from('conversation_memory')
        .insert({
          phone_number: phoneNumber,
          agent_id: 'cardioprime',
          user_message: userMessage,
          bot_response: botResponse,
          intent: intent,
          confidence: 0.8,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ [EnhancedAI] Erro ao salvar na memória:', error);
      } else {
        console.log('💾 [EnhancedAI] Interação salva na memória');
      }

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

    fs.writeFileSync('/tmp/enhancedAIService-simplified.js', simplifiedEnhancedAI);
    console.log('✅ Versão simplificada do EnhancedAIService criada');

    // 4. INSTRUÇÕES PARA O USUÁRIO
    console.log('\n🎯 CORREÇÕES APLICADAS!');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Substitua a API key do OpenAI pela chave real');
    console.log('2. Copie o arquivo simplificado: cp /tmp/enhancedAIService-simplified.js /root/atendeai-lify-backend/src/services/ai/enhancedAIService.js');
    console.log('3. Reinicie o backend: pm2 restart atendeai-backend');
    console.log('4. Teste enviando uma mensagem para o WhatsApp');

  } catch (error) {
    console.error('❌ Erro crítico:', error);
  }
}

fixOpenAIAndSupabase(); 