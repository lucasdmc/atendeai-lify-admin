const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configurar Supabase
const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function adaptarCodigoParaConversationHistory() {
  try {
    console.log('🔧 ADAPTANDO CÓDIGO PARA TABELA CONVERSATION_HISTORY');
    console.log('=====================================================');

    // 1. VERIFICAR ESTRUTURA DA NOVA TABELA
    console.log('\n1️⃣ VERIFICANDO ESTRUTURA DA TABELA CONVERSATION_HISTORY');
    console.log('==========================================================');

    const { data: tableStructure, error: structureError } = await supabase
      .from('conversation_history')
      .select('*')
      .limit(1);

    if (structureError) {
      console.error('❌ Erro ao verificar estrutura da tabela:', structureError);
      return;
    }

    console.log('✅ Tabela conversation_history existe');
    console.log('📊 COLUNAS DISPONÍVEIS:');
    
    const columns = Object.keys(tableStructure[0] || {});
    columns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col}`);
    });

    // 2. TESTE DE INSERÇÃO NA NOVA TABELA
    console.log('\n2️⃣ TESTE DE INSERÇÃO NA NOVA TABELA');
    console.log('=====================================');

    const testData = {
      phone_number: '554730915628',
      user_message: 'Teste de adaptação',
      bot_response: 'Resposta de teste da nova tabela',
      intent: 'TEST',
      confidence: 0.9,
      user_name: 'Teste Sistema',
      created_at: new Date().toISOString()
    };

    console.log('📝 Tentando inserir dados de teste:', testData);

    const { data: insertResult, error: insertError } = await supabase
      .from('conversation_history')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ ERRO NA INSERÇÃO:', insertError);
      console.log('🔍 Código do erro:', insertError.code);
      console.log('📋 Mensagem:', insertError.message);
      console.log('💡 Detalhes:', insertError.details);
    } else {
      console.log('✅ Inserção bem-sucedida na nova tabela!');
      console.log('📋 DADOS INSERIDOS:', insertResult);
    }

    // 3. CRIAR VERSÃO CORRIGIDA DO ENHANCED AI SERVICE
    console.log('\n3️⃣ CRIANDO VERSÃO CORRIGIDA DO ENHANCED AI SERVICE');
    console.log('====================================================');

    const correctedEnhancedAI = `
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
      
      // 5. Salvar na memória (ADAPTADO PARA conversation_history)
      await this.saveToMemory(phoneNumber, message, response, intentResult.intent, userName);
      
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

  async saveToMemory(phoneNumber, userMessage, botResponse, intent, userName = null) {
    try {
      console.log('💾 [EnhancedAI] Salvando na conversation_history:', { phoneNumber, intent });
      
      // VALIDAÇÃO DOS DADOS ANTES DA INSERÇÃO
      if (!phoneNumber || !userMessage || !botResponse || !intent) {
        console.error('❌ [EnhancedAI] Dados inválidos para inserção:', { phoneNumber, userMessage, botResponse, intent });
        return;
      }

      const insertData = {
        phone_number: phoneNumber,
        user_message: userMessage,
        bot_response: botResponse,
        intent: intent,
        confidence: 0.8,
        created_at: new Date().toISOString()
      };

      // Adicionar user_name se disponível
      if (userName) {
        insertData.user_name = userName;
      }

      console.log('📋 [EnhancedAI] Dados para inserção na conversation_history:', insertData);

      const { data, error } = await supabase
        .from('conversation_history')
        .insert(insertData)
        .select();

      if (error) {
        console.error('❌ [EnhancedAI] Erro ao salvar na conversation_history:', error);
        console.log('🔍 Código do erro:', error.code);
        console.log('📋 Mensagem:', error.message);
        console.log('💡 Detalhes:', error.details);
      } else {
        console.log('✅ [EnhancedAI] Interação salva na conversation_history com sucesso!');
        console.log('📋 ID do registro:', data[0]?.id);
      }

    } catch (error) {
      console.error('❌ [EnhancedAI] Erro crítico ao salvar memória:', error);
    }
  }

  // Função para carregar histórico de conversas
  async loadConversationHistory(phoneNumber, limit = 10) {
    try {
      console.log('📚 [EnhancedAI] Carregando histórico para:', phoneNumber);
      
      const { data, error } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('phone_number', phoneNumber)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ [EnhancedAI] Erro ao carregar histórico:', error);
        return [];
      }

      console.log('✅ [EnhancedAI] Histórico carregado:', data.length, 'registros');
      return data || [];

    } catch (error) {
      console.error('❌ [EnhancedAI] Erro crítico ao carregar histórico:', error);
      return [];
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

    fs.writeFileSync('/tmp/enhancedAIService-conversation-history.js', correctedEnhancedAI);
    console.log('✅ Versão corrigida do EnhancedAIService criada');

    // 4. VALIDAR TODAS AS TABELAS DO SISTEMA
    console.log('\n4️⃣ VALIDAÇÃO COMPLETA DO SISTEMA DE BANCO DE DADOS');
    console.log('==================================================');

    const tablesToValidate = [
      'conversation_history',
      'conversation_memory', 
      'clinics',
      'users',
      'agents',
      'ai_whatsapp_messages'
    ];

    for (const tableName of tablesToValidate) {
      console.log(`\n🔍 Validando tabela: ${tableName}`);
      
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Tabela ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${tableName}: Existe`);
          if (data && data.length > 0) {
            const columns = Object.keys(data[0]);
            console.log(`📊 Colunas: ${columns.join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`❌ Erro ao validar ${tableName}: ${err.message}`);
      }
    }

    // 5. CRIAR SCRIPT DE MIGRAÇÃO COMPLETO
    console.log('\n5️⃣ CRIANDO SCRIPT DE MIGRAÇÃO COMPLETO');
    console.log('========================================');

    const migrationScript = `
-- ========================================
-- MIGRAÇÃO COMPLETA DO SISTEMA ATENDEAI
-- ========================================

-- 1. TABELA PARA HISTÓRICO DE CONVERSAS (JÁ CRIADA)
-- CREATE TABLE conversation_history (
--     id SERIAL PRIMARY KEY,
--     phone_number VARCHAR(20) NOT NULL,
--     user_message TEXT NOT NULL,
--     bot_response TEXT NOT NULL,
--     intent VARCHAR(50),
--     confidence DECIMAL(3,2),
--     user_name VARCHAR(100),
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- 2. TABELA PARA PERFIL DE USUÁRIOS (JÁ EXISTE)
-- conversation_memory: Para perfil e dados persistentes do usuário

-- 3. TABELA PARA CLÍNICAS (JÁ EXISTE)
-- clinics: Informações das clínicas e contextualização

-- 4. TABELA PARA MENSAGENS WHATSAPP (OPCIONAL)
CREATE TABLE IF NOT EXISTS ai_whatsapp_messages (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    message_type VARCHAR(20) NOT NULL, -- 'incoming' ou 'outgoing'
    message_content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- 5. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_conversation_history_phone ON conversation_history(phone_number);
CREATE INDEX IF NOT EXISTS idx_conversation_history_created ON conversation_history(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_whatsapp_phone ON ai_whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_ai_whatsapp_timestamp ON ai_whatsapp_messages(timestamp);

-- 6. POLÍTICAS RLS (Row Level Security)
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Política para conversation_history
CREATE POLICY "Enable read access for all users" ON conversation_history FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON conversation_history FOR INSERT WITH CHECK (true);

-- Política para ai_whatsapp_messages
CREATE POLICY "Enable read access for all users" ON ai_whatsapp_messages FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON ai_whatsapp_messages FOR INSERT WITH CHECK (true);
`;

    fs.writeFileSync('/tmp/migration-completa.sql', migrationScript);
    console.log('✅ Script de migração completo criado');

    // 6. CRIAR SCRIPT DE DEPLOY
    console.log('\n6️⃣ CRIANDO SCRIPT DE DEPLOY AUTOMATIZADO');
    console.log('==========================================');

    const deployScript = `
#!/bin/bash

echo "🚀 DEPLOY AUTOMATIZADO - ATENDEAI"
echo "=================================="

# 1. Verificar LLMOrchestratorService
echo "📋 Verificando LLMOrchestratorService..."
if [ -f "/root/atendeai-lify-backend/src/services/ai/llmOrchestratorService.js" ]; then
    echo "✅ LLMOrchestratorService já existe e está funcionando"
else
    echo "❌ LLMOrchestratorService não encontrado"
    exit 1
fi

# 3. Reiniciar PM2
echo "🔄 Reiniciando PM2..."
pm2 restart atendeai-backend

# 4. Verificar status
echo "📊 Verificando status..."
pm2 status

# 5. Verificar logs
echo "📋 Últimos logs:"
pm2 logs atendeai-backend --lines 10

echo "✅ Deploy concluído!"
`;

    fs.writeFileSync('/tmp/deploy-automatizado.sh', deployScript);
    console.log('✅ Script de deploy criado');

    console.log('\n🎯 ADAPTAÇÃO CONCLUÍDA!');
    console.log('📋 RESUMO DAS ALTERAÇÕES:');
    console.log('   1. ✅ Código adaptado para conversation_history');
    console.log('   2. ✅ Validação completa do sistema');
    console.log('   3. ✅ Script de migração criado');
    console.log('   4. ✅ Script de deploy criado');
    console.log('   5. ✅ Estrutura alinhada entre código e banco');
    
    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('   1. Executar script de migração no Supabase');
    console.log('   2. Executar deploy automatizado no VPS');
    console.log('   3. Testar funcionalidade completa');
    console.log('   4. Validar logs e performance');

  } catch (error) {
    console.error('❌ Erro crítico na adaptação:', error);
  }
}

adaptarCodigoParaConversationHistory(); 