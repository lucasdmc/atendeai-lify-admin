// ========================================
// CORREÇÃO DO SISTEMA DE MEMÓRIA - SQL DIRETO
// ========================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function fixMemorySystemDirect() {
  console.log('🔧 CORREÇÃO DO SISTEMA DE MEMÓRIA - SQL DIRETO');
  console.log('==============================================');

  try {
    // PASSO 1: VERIFICAR TABELAS EXISTENTES
    console.log('\n📋 1. Verificando tabelas existentes...');
    
    // Testar se conversation_memory existe
    try {
      const { data: existingData, error: existingError } = await supabase
        .from('conversation_memory')
        .select('*')
        .limit(1);
      
      if (existingError) {
        console.log('❌ Tabela conversation_memory não existe');
      } else {
        console.log('✅ Tabela conversation_memory já existe');
        console.log('📊 Estrutura atual:', Object.keys(existingData[0] || {}));
      }
    } catch (error) {
      console.log('❌ Tabela conversation_memory não existe');
    }

    // PASSO 2: CRIAR TABELA SE NÃO EXISTIR
    console.log('\n📋 2. Criando tabela conversation_memory...');
    
    // Primeiro, vamos tentar inserir um registro de teste para ver se a tabela existe
    const testInsert = {
      phone_number: '+5547999999999',
      agent_id: 'test_clinic',
      user_message: 'Teste de criação',
      bot_response: 'Teste de resposta',
      intent: 'TEST',
      confidence: 0.9,
      user_name: 'Teste',
      created_at: new Date().toISOString()
    };

    try {
      const { data: insertData, error: insertError } = await supabase
        .from('conversation_memory')
        .insert(testInsert)
        .select();

      if (insertError) {
        console.log('❌ Erro ao inserir teste:', insertError.message);
        console.log('🔧 A tabela precisa ser criada manualmente no Supabase');
        console.log('📋 Execute o seguinte SQL no Supabase Dashboard:');
        console.log(`
-- Criar tabela conversation_memory
CREATE TABLE IF NOT EXISTS conversation_memory (
  id BIGSERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  agent_id VARCHAR(50) NOT NULL,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  intent VARCHAR(50),
  confidence DECIMAL(3,2),
  user_name VARCHAR(100),
  pending_action VARCHAR(100),
  is_user_return BOOLEAN DEFAULT FALSE,
  is_repeated_greeting BOOLEAN DEFAULT FALSE,
  has_introduced BOOLEAN DEFAULT FALSE,
  conversation_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_conversation_memory_phone ON conversation_memory(phone_number);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_agent ON conversation_memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_created_at ON conversation_memory(created_at DESC);

-- Habilitar RLS
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Enable all operations for conversation_memory" ON conversation_memory
  FOR ALL USING (true);
        `);
      } else {
        console.log('✅ Tabela conversation_memory existe e está funcionando!');
        
        // Limpar o registro de teste
        await supabase
          .from('conversation_memory')
          .delete()
          .eq('id', insertData[0].id);
        
        console.log('🧹 Registro de teste removido');
      }
    } catch (error) {
      console.log('❌ Erro ao testar tabela:', error.message);
    }

    // PASSO 3: CRIAR ENHANCED AI SERVICE CORRIGIDO
    console.log('\n📋 3. Criando EnhancedAIService corrigido...');
    
    const enhancedAIServiceCode = `
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
      const prompt = \`Analise a mensagem e classifique a intenção principal.

Mensagem: "\${message}"

Histórico da conversa:
\${conversationMemory.recentMessages ? conversationMemory.recentMessages.map(msg => \`- Usuário: \${msg.user}\\n- Bot: \${msg.assistant}\`).join('\\n') : 'Nenhum histórico'}

Classifique em uma das seguintes categorias:
- GREETING: Saudações, olá, bom dia, etc.
- INTRODUCTION: Apresentação, "me chamo", "meu nome é", etc.
- PERSONAL_INFO: Perguntas sobre informações pessoais, "qual meu nome", etc.
- APPOINTMENT: Agendamento, consulta, marcação, etc.
- INFORMATION: Informações sobre serviços, horários, localização, etc.
- SUPPORT: Ajuda, suporte, problemas, etc.
- GOODBYE: Despedidas, tchau, até logo, etc.

Responda apenas com o nome da categoria.\`;

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
      let systemPrompt = \`Você é o Dr. Carlos, assistente virtual da CardioPrime.

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
8. Mantenha as respostas concisas mas completas\`;

      // Adicionar contexto da conversa
      if (conversationMemory.recentMessages && conversationMemory.recentMessages.length > 0) {
        systemPrompt += \`\\n\\nHISTÓRICO DA CONVERSA:\\n\`;
        conversationMemory.recentMessages.slice(-3).forEach(msg => {
          systemPrompt += \`- Usuário: \${msg.user}\\n- Bot: \${msg.assistant}\\n\`;
        });
      }

      // Adicionar informações do usuário
      if (userName) {
        systemPrompt += \`\\n\\nNOME DO USUÁRIO: \${userName}\`;
      }

      // Adicionar contexto de intenção
      if (intentResult.intent === 'PERSONAL_INFO' && userName) {
        systemPrompt += \`\\n\\nO usuário está perguntando sobre informações pessoais. Se ele perguntar sobre o nome dele, responda que se chama \${userName}.\`;
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
`;

    // Salvar o EnhancedAIService corrigido
    const fs = await import('fs');
    fs.writeFileSync('src/services/ai/enhancedAIService.js', enhancedAIServiceCode);
    console.log('✅ EnhancedAIService corrigido criado!');

    // PASSO 4: CRIAR SCRIPT DE TESTE
    console.log('\n📋 4. Criando script de teste...');
    
    const testScript = `
// ========================================
// TESTE DO SISTEMA DE MEMÓRIA CORRIGIDO
// ========================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function testMemorySystem() {
  console.log('🧪 Testando Sistema de Memória Corrigido...\\n');
  
  const testPhone = '+5547999999999';
  const testAgent = 'test_clinic';
  
  // Teste 1: Carregar memória vazia
  console.log('📝 Teste 1: Carregando memória vazia');
  try {
    const { data, error } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', testPhone + '_new')
      .eq('agent_id', testAgent)
      .limit(5);
    
    if (error) {
      console.log('❌ Erro ao carregar memória:', error.message);
    } else {
      console.log('✅ Memória vazia carregada corretamente');
      console.log('📊 Registros encontrados:', data?.length || 0);
    }
  } catch (error) {
    console.log('❌ Erro crítico:', error.message);
  }
  
  // Teste 2: Salvar primeira interação
  console.log('\\n📝 Teste 2: Salvando primeira interação');
  try {
    const insertData = {
      phone_number: testPhone,
      agent_id: testAgent,
      user_message: 'Olá!',
      bot_response: 'Olá! Como posso ajudar?',
      intent: 'GREETING',
      confidence: 0.95,
      user_name: null,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('conversation_memory')
      .insert(insertData)
      .select();
    
    if (error) {
      console.log('❌ Erro ao salvar interação:', error.message);
    } else {
      console.log('✅ Primeira interação salva com sucesso!');
      console.log('📋 ID do registro:', data[0]?.id);
    }
  } catch (error) {
    console.log('❌ Erro crítico ao salvar:', error.message);
  }
  
  // Teste 3: Salvar interação com nome
  console.log('\\n📝 Teste 3: Salvando interação com nome');
  try {
    const insertData2 = {
      phone_number: testPhone,
      agent_id: testAgent,
      user_message: 'Meu nome é Lucas',
      bot_response: 'Olá Lucas! Prazer em conhecê-lo!',
      intent: 'INTRODUCTION',
      confidence: 0.90,
      user_name: 'Lucas',
      has_introduced: true,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('conversation_memory')
      .insert(insertData2)
      .select();
    
    if (error) {
      console.log('❌ Erro ao salvar interação com nome:', error.message);
    } else {
      console.log('✅ Interação com nome salva com sucesso!');
      console.log('📋 ID do registro:', data[0]?.id);
    }
  } catch (error) {
    console.log('❌ Erro crítico ao salvar com nome:', error.message);
  }
  
  // Teste 4: Carregar memória com dados
  console.log('\\n📝 Teste 4: Carregando memória com dados');
  try {
    const { data, error } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', testPhone)
      .eq('agent_id', testAgent)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('❌ Erro ao carregar memória com dados:', error.message);
    } else {
      console.log('✅ Memória com dados carregada com sucesso!');
      console.log('📊 Total de registros:', data?.length || 0);
      
      if (data && data.length > 0) {
        const userName = data.find(record => record.user_name)?.user_name;
        console.log('👤 Nome do usuário encontrado:', userName || 'Nenhum');
        
        const lastMessage = data[0];
        console.log('💬 Última mensagem:', lastMessage.user_message);
        console.log('🤖 Última resposta:', lastMessage.bot_response);
      }
    }
  } catch (error) {
    console.log('❌ Erro crítico ao carregar dados:', error.message);
  }
  
  console.log('\\n🎉 Teste do Sistema de Memória Concluído!');
}

// Executar teste
testMemorySystem().catch(console.error);
`;

    fs.writeFileSync('test-memory-system-corrected.js', testScript);
    console.log('✅ Script de teste criado!');

    console.log('\n🎉 CORREÇÃO DO SISTEMA DE MEMÓRIA CONCLUÍDA!');
    console.log('✅ EnhancedAIService corrigido criado');
    console.log('✅ Script de teste criado');
    console.log('📋 Próximos passos:');
    console.log('1. Execute o SQL no Supabase Dashboard para criar a tabela');
    console.log('2. Execute: node test-memory-system-corrected.js');
    console.log('3. Integre o EnhancedAIService no webhook');

  } catch (error) {
    console.error('💥 ERRO CRÍTICO na correção:', error);
    throw error;
  }
}

// Executar correção
fixMemorySystemDirect().catch(console.error); 