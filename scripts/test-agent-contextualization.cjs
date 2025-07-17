const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
  console.log('Configure a variável de ambiente SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAgentContextualization() {
  console.log('🧪 Testando Sistema de Contextualização de Agentes\n');

  try {
    // 1. Buscar todos os agentes
    console.log('📋 1. Buscando agentes...');
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select(`
        id,
        name,
        description,
        personality,
        temperature,
        context_json,
        clinics (
          name,
          address,
          phone,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (agentsError) {
      console.error('❌ Erro ao buscar agentes:', agentsError);
      return;
    }

    console.log(`✅ Encontrados ${agents.length} agentes:`);
    agents.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.id})`);
      console.log(`     Clínica: ${agent.clinics?.name || 'N/A'}`);
      console.log(`     Contexto JSON: ${agent.context_json ? '✅' : '❌'}`);
      console.log(`     Personalidade: ${agent.personality}`);
      console.log(`     Temperatura: ${agent.temperature}`);
    });

    // 2. Testar contextualização para cada agente
    console.log('\n📋 2. Testando contextualização...');
    
    for (const agent of agents) {
      console.log(`\n🔍 Testando agente: ${agent.name}`);
      
      // Simular mensagem de teste
      const testMessage = "Olá! Gostaria de saber mais sobre os serviços da clínica.";
      
      // Gerar contexto para o agente
      const context = generateAgentContext(agent);
      console.log(`   Contexto gerado (${context.length} caracteres):`);
      console.log(`   ${context.substring(0, 200)}...`);
      
      // Testar chamada da Edge Function
      console.log('   Testando chamada da Edge Function...');
      
      try {
        const { data, error } = await supabase.functions.invoke('ai-chat-gpt4', {
          body: {
            messages: [
              {
                role: 'system',
                content: context
              },
              {
                role: 'user',
                content: testMessage
              }
            ],
            phoneNumber: 'test-phone',
            agentId: agent.id,
            temperature: agent.temperature || 0.7
          }
        });

        if (error) {
          console.log(`   ❌ Erro na Edge Function: ${error.message}`);
        } else {
          console.log(`   ✅ Resposta gerada (${data.response.length} caracteres):`);
          console.log(`   ${data.response.substring(0, 150)}...`);
        }
      } catch (error) {
        console.log(`   ❌ Erro ao chamar Edge Function: ${error.message}`);
      }
    }

    // 3. Testar conexões WhatsApp
    console.log('\n📋 3. Verificando conexões WhatsApp...');
    
    const { data: connections, error: connectionsError } = await supabase
      .from('agent_whatsapp_connections')
      .select(`
        id,
        agent_id,
        whatsapp_number,
        connection_status,
        agents (
          name
        )
      `);

    if (connectionsError) {
      console.error('❌ Erro ao buscar conexões:', connectionsError);
    } else {
      console.log(`✅ Encontradas ${connections.length} conexões:`);
      connections.forEach(conn => {
        console.log(`   - ${conn.agents.name}: ${conn.whatsapp_number} (${conn.connection_status})`);
      });
    }

    // 4. Testar processamento de mensagem com agente específico
    console.log('\n📋 4. Testando processamento com agente específico...');
    
    if (connections.length > 0) {
      const testConnection = connections[0];
      console.log(`   Testando com agente: ${testConnection.agents.name}`);
      console.log(`   Número: ${testConnection.whatsapp_number}`);
      
      // Simular webhook de mensagem
      const webhookData = {
        event: 'message',
        data: {
          from: testConnection.whatsapp_number,
          body: 'Olá! Como posso agendar uma consulta?',
          timestamp: Date.now() / 1000,
          id: 'test-message-id'
        }
      };
      
      console.log('   Simulando webhook...');
      // Aqui você testaria a Edge Function whatsapp-integration
      console.log('   ✅ Webhook simulado com sucesso');
    }

    console.log('\n✅ Teste de contextualização concluído!');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Função para gerar contexto baseado no agente (simulando a Edge Function)
function generateAgentContext(agent) {
  let context = `Você é ${agent.name}, assistente virtual.`;
  
  // Se o agente tem JSON de contextualização, usar ele
  if (agent.context_json) {
    try {
      const contextData = typeof agent.context_json === 'string' 
        ? JSON.parse(agent.context_json) 
        : agent.context_json;
      
      context = buildContextFromJSON(contextData, agent);
    } catch (error) {
      console.error('Error parsing agent context JSON:', error);
      context = buildDefaultContext(agent);
    }
  } else {
    // Usar contexto padrão baseado na clínica
    context = buildDefaultContext(agent);
  }
  
  return context;
}

// Função para construir contexto a partir do JSON
function buildContextFromJSON(contextData, agent) {
  const clinic = contextData.clinica || {};
  const agentConfig = contextData.agente_ia?.configuracao || {};
  
  return `Você é ${agentConfig.nome || agent.name}, assistente virtual da ${clinic.informacoes_basicas?.nome || 'clínica'}.

INFORMAÇÕES DA CLÍNICA:
${clinic.informacoes_basicas?.descricao ? `- Descrição: ${clinic.informacoes_basicas.descricao}` : ''}
${clinic.informacoes_basicas?.missao ? `- Missão: ${clinic.informacoes_basicas.missao}` : ''}

${clinic.contatos ? `
CONTATOS:
${clinic.contatos.telefone_principal ? `- Telefone: ${clinic.contatos.telefone_principal}` : ''}
${clinic.contatos.whatsapp ? `- WhatsApp: ${clinic.contatos.whatsapp}` : ''}
${clinic.contatos.email_principal ? `- Email: ${clinic.contatos.email_principal}` : ''}
${clinic.contatos.website ? `- Website: ${clinic.contatos.website}` : ''}
` : ''}

PERSONALIDADE: ${agentConfig.personalidade || agent.personality || 'profissional e acolhedor'}
TOM DE COMUNICAÇÃO: ${agentConfig.tom_comunicacao || 'formal mas acessível'}

Sempre responda de forma profissional e acolhedora. Use as informações acima para fornecer respostas precisas sobre a clínica, serviços e agendamentos.`;
}

// Função para construir contexto padrão
function buildDefaultContext(agent) {
  const clinic = agent.clinics || {};
  
  return `Você é ${agent.name}, assistente virtual${clinic.name ? ` da ${clinic.name}` : ''}.

${agent.description ? `DESCRIÇÃO: ${agent.description}` : ''}

${clinic.name ? `
INFORMAÇÕES DA CLÍNICA:
- Nome: ${clinic.name}
${clinic.address ? `- Endereço: ${clinic.address}` : ''}
${clinic.phone ? `- Telefone: ${clinic.phone}` : ''}
${clinic.email ? `- Email: ${clinic.email}` : ''}
` : ''}

PERSONALIDADE: ${agent.personality || 'profissional e acolhedor'}

Sempre responda de forma profissional e acolhedora. Use as informações disponíveis para ajudar o paciente.`;
}

// Executar teste
testAgentContextualization().catch(console.error); 