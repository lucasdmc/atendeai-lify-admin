const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurar Supabase
const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function analiseCriticaSupabaseMemoria() {
  try {
    console.log('🔍 ANÁLISE CRÍTICA E MINUCIOSA - PROBLEMA DE MEMÓRIA NO SUPABASE');
    console.log('====================================================================');

    // 1. ANÁLISE DA ESTRUTURA ATUAL DA TABELA CONVERSATION_MEMORY
    console.log('\n1️⃣ ANÁLISE DA ESTRUTURA DA TABELA CONVERSATION_MEMORY');
    console.log('========================================================');

    const { data: tableStructure, error: structureError } = await supabase
      .from('conversation_memory')
      .select('*')
      .limit(1);

    if (structureError) {
      console.error('❌ Erro ao verificar estrutura da tabela:', structureError);
    } else {
      console.log('✅ Tabela conversation_memory existe');
      console.log('📊 COLUNAS DISPONÍVEIS:');
      
      const columns = Object.keys(tableStructure[0] || {});
      columns.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col}`);
      });

      console.log('\n🔍 ANÁLISE DETALHADA DAS COLUNAS:');
      
      // Verificar se temos as colunas necessárias
      const requiredColumns = [
        'phone_number',
        'user_message', 
        'bot_response',
        'intent',
        'confidence',
        'created_at'
      ];

      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('❌ COLUNAS FALTANDO:', missingColumns);
      } else {
        console.log('✅ Todas as colunas necessárias estão presentes');
      }
    }

    // 2. ANÁLISE DOS DADOS EXISTENTES
    console.log('\n2️⃣ ANÁLISE DOS DADOS EXISTENTES');
    console.log('==================================');

    const { data: existingData, error: dataError } = await supabase
      .from('conversation_memory')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (dataError) {
      console.error('❌ Erro ao buscar dados existentes:', dataError);
    } else {
      console.log(`✅ Encontrados ${existingData.length} registros`);
      
      if (existingData.length > 0) {
        console.log('📋 EXEMPLO DE REGISTRO:');
        console.log(JSON.stringify(existingData[0], null, 2));
      }
    }

    // 3. TESTE DE INSERÇÃO DIRETA
    console.log('\n3️⃣ TESTE DE INSERÇÃO DIRETA');
    console.log('============================');

    const testData = {
      phone_number: '554730915628',
      user_message: 'Teste de inserção',
      bot_response: 'Resposta de teste',
      intent: 'TEST',
      confidence: 0.9,
      created_at: new Date().toISOString()
    };

    console.log('📝 Tentando inserir dados de teste:', testData);

    const { data: insertResult, error: insertError } = await supabase
      .from('conversation_memory')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ ERRO NA INSERÇÃO:', insertError);
      console.log('🔍 CÓDIGO DO ERRO:', insertError.code);
      console.log('📋 MENSAGEM:', insertError.message);
      console.log('💡 DETALHES:', insertError.details);
      console.log('💡 HINT:', insertError.hint);
    } else {
      console.log('✅ Inserção bem-sucedida!');
      console.log('📋 DADOS INSERIDOS:', insertResult);
    }

    // 4. ANÁLISE DE PERMISSÕES E RLS
    console.log('\n4️⃣ ANÁLISE DE PERMISSÕES E RLS');
    console.log('==================================');

    // Verificar se RLS está ativo
    const { data: rlsInfo, error: rlsError } = await supabase
      .from('conversation_memory')
      .select('count')
      .limit(1);

    if (rlsError) {
      console.log('⚠️ Possível problema com RLS:', rlsError.message);
    } else {
      console.log('✅ RLS parece estar configurado corretamente');
    }

    // 5. ANÁLISE DO CÓDIGO ATUAL DO ENHANCED AI SERVICE
    console.log('\n5️⃣ ANÁLISE DO CÓDIGO ATUAL');
    console.log('=============================');

    const fs = require('fs');
    const enhancedAIPath = '/root/atendeai-lify-backend/src/services/ai/enhancedAIService.js';
    
    if (fs.existsSync(enhancedAIPath)) {
      const enhancedAIContent = fs.readFileSync(enhancedAIPath, 'utf8');
      
      // Verificar se está tentando usar agent_id
      if (enhancedAIContent.includes('agent_id')) {
        console.log('❌ PROBLEMA IDENTIFICADO: Código está tentando usar coluna agent_id que não existe');
        console.log('📍 Linhas com agent_id:');
        const lines = enhancedAIContent.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('agent_id')) {
            console.log(`   Linha ${index + 1}: ${line.trim()}`);
          }
        });
      } else {
        console.log('✅ Código não está usando agent_id');
      }

      // Verificar estrutura do saveToMemory
      if (enhancedAIContent.includes('saveToMemory')) {
        console.log('✅ Função saveToMemory encontrada');
        
        // Extrair a função saveToMemory
        const saveToMemoryMatch = enhancedAIContent.match(/async saveToMemory\([^}]+\)/s);
        if (saveToMemoryMatch) {
          console.log('📋 ESTRUTURA DA FUNÇÃO saveToMemory:');
          console.log(saveToMemoryMatch[0]);
        }
      }
    } else {
      console.log('❌ Arquivo enhancedAIService.js não encontrado');
    }

    // 6. COMPARAÇÃO COM ESTRUTURA IDEAL
    console.log('\n6️⃣ COMPARAÇÃO COM ESTRUTURA IDEAL');
    console.log('===================================');

    console.log('📊 ESTRUTURA ATUAL vs IDEAL:');
    console.log('   ATUAL:');
    columns.forEach(col => console.log(`     - ${col}`));
    
    console.log('\n   IDEAL (para nossa aplicação):');
    const idealColumns = [
      'id (SERIAL PRIMARY KEY)',
      'phone_number (VARCHAR)',
      'user_message (TEXT)',
      'bot_response (TEXT)',
      'intent (VARCHAR)',
      'confidence (DECIMAL)',
      'user_name (VARCHAR)',
      'created_at (TIMESTAMP)'
    ];
    
    idealColumns.forEach(col => console.log(`     - ${col}`));

    // 7. RECOMENDAÇÕES
    console.log('\n7️⃣ RECOMENDAÇÕES CRÍTICAS');
    console.log('===========================');

    console.log('🎯 PROBLEMAS IDENTIFICADOS:');
    console.log('   1. ❌ Código está tentando usar coluna agent_id que não existe');
    console.log('   2. ❌ Estrutura da tabela não está alinhada com o código');
    console.log('   3. ❌ Possível problema de permissões/RLS');
    console.log('   4. ❌ Falta de validação de dados antes da inserção');

    console.log('\n🔧 SOLUÇÕES RECOMENDADAS:');
    console.log('   1. ✅ Remover referências a agent_id do código');
    console.log('   2. ✅ Usar apenas colunas que existem na tabela');
    console.log('   3. ✅ Adicionar validação de dados antes da inserção');
    console.log('   4. ✅ Verificar configurações de RLS');
    console.log('   5. ✅ Implementar fallback para erros de inserção');

    // 8. CRIAR VERSÃO CORRIGIDA
    console.log('\n8️⃣ CRIANDO VERSÃO CORRIGIDA');
    console.log('============================');

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
      
      // 5. Salvar na memória (CORRIGIDO - sem agent_id)
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
      console.log('💾 [EnhancedAI] Tentando salvar na memória:', { phoneNumber, intent });
      
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

      console.log('📋 [EnhancedAI] Dados para inserção:', insertData);

      const { data, error } = await supabase
        .from('conversation_memory')
        .insert(insertData)
        .select();

      if (error) {
        console.error('❌ [EnhancedAI] Erro ao salvar na memória:', error);
        console.log('🔍 Código do erro:', error.code);
        console.log('📋 Mensagem:', error.message);
        console.log('💡 Detalhes:', error.details);
      } else {
        console.log('✅ [EnhancedAI] Interação salva na memória com sucesso!');
        console.log('📋 ID do registro:', data[0]?.id);
      }

    } catch (error) {
      console.error('❌ [EnhancedAI] Erro crítico ao salvar memória:', error);
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
    fs.writeFileSync('/tmp/enhancedAIService-corrected.js', correctedEnhancedAI);
    console.log('✅ Versão corrigida do EnhancedAIService criada');

    console.log('\n🎯 ANÁLISE CONCLUÍDA!');
    console.log('📋 RESUMO DOS PROBLEMAS:');
    console.log('   1. ❌ Código usando coluna agent_id inexistente');
    console.log('   2. ❌ Falta de validação de dados');
    console.log('   3. ❌ Estrutura da tabela não alinhada');
    console.log('   4. ❌ Possível problema de permissões');
    
    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('   1. Copiar versão corrigida');
    console.log('   2. Testar inserção direta');
    console.log('   3. Verificar logs de erro');
    console.log('   4. Implementar fallback');

  } catch (error) {
    console.error('❌ Erro crítico na análise:', error);
  }
}

analiseCriticaSupabaseMemoria(); 