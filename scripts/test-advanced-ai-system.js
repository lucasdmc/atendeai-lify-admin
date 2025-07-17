#!/usr/bin/env node

/**
 * Script para testar o sistema avançado de IA do WhatsApp
 * Testa: Reconhecimento de intenções, RAG, personalização e memória
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdvancedAISystem() {
  console.log('🚀 Testando Sistema Avançado de IA do WhatsApp\n');

  const testCases = [
    {
      name: 'Saudação',
      message: 'Oi, tudo bem?',
      expectedIntent: 'GREETING'
    },
    {
      name: 'Agendamento',
      message: 'Quero agendar uma consulta',
      expectedIntent: 'APPOINTMENT_CREATE'
    },
    {
      name: 'Horários',
      message: 'Qual o horário de funcionamento?',
      expectedIntent: 'INFO_HOURS'
    },
    {
      name: 'Localização',
      message: 'Onde fica a clínica?',
      expectedIntent: 'INFO_LOCATION'
    },
    {
      name: 'Serviços',
      message: 'Quais especialidades vocês atendem?',
      expectedIntent: 'INFO_SERVICES'
    }
  ];

  for (const testCase of testCases) {
    console.log(`📝 Testando: ${testCase.name}`);
    console.log(`💬 Mensagem: "${testCase.message}"`);
    
    try {
      const result = await testAdvancedAI(testCase.message);
      
      console.log(`✅ Resposta: ${result.response}`);
      console.log(`🎯 Intenção: ${result.intent} (esperado: ${testCase.expectedIntent})`);
      console.log(`📊 Confiança: ${result.confidence}`);
      
      if (result.metadata) {
        console.log(`🔍 Metadados:`);
        if (result.metadata.ragSources) {
          console.log(`   📚 Fontes RAG: ${result.metadata.ragSources.length}`);
        }
        if (result.metadata.personalization) {
          console.log(`   👤 Personalização: ${result.metadata.personalization.name}`);
        }
        if (result.metadata.memory) {
          console.log(`   🧠 Memória: ${result.metadata.memory.length} mensagens`);
        }
      }
      
      console.log('---\n');
      
    } catch (error) {
      console.error(`❌ Erro no teste "${testCase.name}":`, error.message);
      console.log('---\n');
    }
  }

  console.log('🎉 Teste do Sistema Avançado de IA concluído!');
}

async function testAdvancedAI(message) {
  const { data, error } = await supabase.functions.invoke('ai-chat-gpt4', {
    body: {
      messages: [
        {
          role: 'system',
          content: `Você é uma recepcionista virtual de uma clínica médica.
Sua personalidade é profissional, empática e prestativa.

DIRETRIZES FUNDAMENTAIS:
1. Use EXCLUSIVAMENTE as informações fornecidas no contexto da clínica
2. Seja sempre cordial, profissional e empática
3. Para agendamentos, oriente sobre o processo
4. Se não souber uma informação, diga educadamente que não possui essa informação
5. NUNCA invente informações ou dê conselhos médicos
6. Mantenha respostas concisas e objetivas (máximo 3 parágrafos)
7. Use emojis ocasionalmente para tornar a conversa mais amigável

Use as informações do contexto para responder de forma precisa e útil.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      phoneNumber: '5511999999999',
      agentId: 'test-agent',
      temperature: 0.7,
      enableAdvancedAI: true,
      enableIntentRecognition: true,
      enableRAG: true,
      enablePersonalization: true,
      enableMemory: true
    }
  });

  if (error) {
    throw new Error(`Erro na Edge Function: ${error.message}`);
  }

  return data;
}

async function testWhatsAppIntegration() {
  console.log('📱 Testando Integração WhatsApp com IA Avançada\n');

  const testMessage = {
    phoneNumber: '5511999999999',
    message: 'Oi, quero agendar uma consulta de cardiologia',
    agentId: 'test-agent'
  };

  try {
    console.log('📤 Enviando mensagem para processamento...');
    
    const { data, error } = await supabase.functions.invoke('whatsapp-integration/webhook', {
      body: {
        event: 'message',
        data: {
          from: testMessage.phoneNumber,
          body: testMessage.message,
          timestamp: Date.now(),
          id: 'test-message-id'
        }
      }
    });

    if (error) {
      console.error('❌ Erro na integração WhatsApp:', error);
    } else {
      console.log('✅ Mensagem processada com sucesso');
      console.log('📊 Resultado:', data);
    }

  } catch (error) {
    console.error('❌ Erro no teste de integração:', error.message);
  }
}

async function testAgentContext() {
  console.log('🤖 Testando Contexto de Agente\n');

  try {
    // Buscar agentes disponíveis
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, description, personality, context_json')
      .limit(3);

    if (agentsError) {
      console.error('❌ Erro ao buscar agentes:', agentsError);
      return;
    }

    console.log(`📋 ${agents.length} agentes encontrados:`);
    agents.forEach(agent => {
      console.log(`   - ${agent.name}: ${agent.description}`);
      if (agent.context_json) {
        try {
          const context = JSON.parse(agent.context_json);
          console.log(`     Contexto: ${Object.keys(context).length} seções`);
        } catch (e) {
          console.log(`     Contexto: Erro no parse`);
        }
      }
    });

    if (agents.length > 0) {
      const testAgent = agents[0];
      console.log(`\n🧪 Testando com agente: ${testAgent.name}`);
      
      const result = await testAdvancedAI('Quais são os horários de atendimento?');
      console.log(`✅ Resposta com contexto do agente: ${result.response}`);
    }

  } catch (error) {
    console.error('❌ Erro no teste de contexto:', error.message);
  }
}

async function main() {
  console.log('🔬 INICIANDO TESTES DO SISTEMA AVANÇADO DE IA\n');

  try {
    // Teste 1: Sistema Avançado de IA
    await testAdvancedAISystem();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Teste 2: Contexto de Agente
    await testAgentContext();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Teste 3: Integração WhatsApp
    await testWhatsAppIntegration();

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error);
  }

  console.log('\n🎯 Testes concluídos!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testAdvancedAISystem,
  testWhatsAppIntegration,
  testAgentContext
}; 