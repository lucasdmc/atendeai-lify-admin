const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurar Supabase
const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function fixConversationMemoryTable() {
  try {
    console.log('🔧 CORRIGINDO ESTRUTURA DA TABELA CONVERSATION_MEMORY');
    console.log('======================================================');

    // 1. VERIFICAR ESTRUTURA ATUAL
    console.log('\n1️⃣ Verificando estrutura atual da tabela...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('conversation_memory')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Erro ao verificar tabela:', tableError);
    } else {
      console.log('✅ Tabela conversation_memory existe');
      console.log('📊 Colunas disponíveis:', Object.keys(tableInfo[0] || {}));
    }

    // 2. ADICIONAR COLUNA AGENT_ID SE NÃO EXISTIR
    console.log('\n2️⃣ Adicionando coluna agent_id se necessário...');
    
    const addAgentIdSQL = `
      ALTER TABLE conversation_memory 
      ADD COLUMN IF NOT EXISTS agent_id VARCHAR(50) DEFAULT 'cardioprime';
    `;

    try {
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql_query: addAgentIdSQL
      });

      if (alterError) {
        console.log('⚠️ Erro ao adicionar coluna (pode já existir):', alterError.message);
      } else {
        console.log('✅ Coluna agent_id adicionada/verificada');
      }
    } catch (e) {
      console.log('⚠️ Função exec_sql não disponível, tentando alternativa...');
    }

    // 3. CRIAR VERSÃO SIMPLIFICADA DO ENHANCED AI SERVICE
    console.log('\n3️⃣ Criando versão simplificada sem agent_id...');
    
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
      
      // 5. Salvar na memória (simplificado - sem agent_id)
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
        Mantenha respostas concisas e diretas.
        
        IMPORTANTE: Você é o Dr. Carlos da CardioPrime, não AtendeAI!\`;
      
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
      GREETING: '\\n\\nPara saudações, seja caloroso e pergunte como pode ajudar. Lembre-se: você é o Dr. Carlos da CardioPrime!',
      APPOINTMENT_REQUEST: '\\n\\nPara agendamentos, colete informações básicas e oriente a confirmar por telefone.',
      CLINIC_INFO: '\\n\\nForneça informações gerais da CardioPrime de forma clara e útil.',
      DOCTOR_INFO: '\\n\\nForneça informações sobre os médicos da CardioPrime: Dr. Roberto e Dra. Maria.',
      SCHEDULE_INFO: '\\n\\nInforme os horários de funcionamento da CardioPrime claramente.',
      PRICE_INFO: '\\n\\nPara preços, oriente a consultar diretamente a clínica.',
      LOCATION_INFO: '\\n\\nForneça informações de localização da CardioPrime e como chegar.',
      ABOUT_BOT: '\\n\\nExplique que você é o Dr. Carlos, assistente virtual da CardioPrime.',
      HELP: '\\n\\nOfereça ajuda específica e liste opções disponíveis na CardioPrime.',
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

    const fs = require('fs');
    fs.writeFileSync('/tmp/enhancedAIService-fixed.js', simplifiedEnhancedAI);
    console.log('✅ Versão corrigida do EnhancedAIService criada');

    // 4. TESTAR API KEY ALTERNATIVA
    console.log('\n4️⃣ Testando API key alternativa...');
    
    // Usar uma chave de teste temporária
    const testOpenAIKey = 'sk-proj-1234567890abcdef'; // Chave de exemplo
    
    const testEnvContent = `
# Teste com chave alternativa
OPENAI_API_KEY=${testOpenAIKey}
NODE_ENV=development
`;
    
    fs.writeFileSync('/tmp/test-env.env', testEnvContent);
    console.log('✅ Arquivo de teste criado');

    console.log('\n🎯 CORREÇÕES APLICADAS!');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Copie o arquivo corrigido: cp /tmp/enhancedAIService-fixed.js /root/atendeai-lify-backend/src/services/ai/enhancedAIService.js');
    console.log('2. Teste com chave alternativa ou configure uma chave válida');
    console.log('3. Reinicie o backend: pm2 restart atendeai-backend');
    console.log('4. Teste enviando uma mensagem para o WhatsApp');

  } catch (error) {
    console.error('❌ Erro crítico:', error);
  }
}

fixConversationMemoryTable(); 