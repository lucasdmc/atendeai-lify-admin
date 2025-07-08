import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NzI5NzAsImV4cCI6MjA1MTU0ODk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAgentWhatsAppFix() {
  console.log('🧪 Testando correção da Edge Function agent-whatsapp-manager...\n');

  try {
    // 1. Buscar um agente para testar
    console.log('1️⃣ Buscando agentes disponíveis...');
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name')
      .limit(1);

    if (agentsError) {
      throw new Error(`Erro ao buscar agentes: ${agentsError.message}`);
    }

    if (!agents || agents.length === 0) {
      console.log('❌ Nenhum agente encontrado. Criando um agente de teste...');
      
      // Criar um agente de teste
      const { data: newAgent, error: createError } = await supabase
        .from('agents')
        .insert({
          name: 'Agente Teste WhatsApp',
          description: 'Agente para teste de WhatsApp',
          personality: 'profissional e acolhedor',
          temperature: 0.7,
          clinic_id: '1', // Assumindo que existe uma clínica com ID 1
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Erro ao criar agente: ${createError.message}`);
      }

      console.log(`✅ Agente criado: ${newAgent.name} (ID: ${newAgent.id})`);
      var testAgentId = newAgent.id;
    } else {
      console.log(`✅ Agente encontrado: ${agents[0].name} (ID: ${agents[0].id})`);
      var testAgentId = agents[0].id;
    }

    // 2. Testar a função connections (que estava dando erro 400)
    console.log('\n2️⃣ Testando função connections...');
    const { data: connectionsData, error: connectionsError } = await supabase.functions.invoke('agent-whatsapp-manager/connections', {
      body: { agentId: testAgentId }
    });

    if (connectionsError) {
      console.log(`❌ Erro na função connections: ${connectionsError.message}`);
      console.log('Detalhes do erro:', connectionsError);
    } else {
      console.log('✅ Função connections funcionando!');
      console.log(`Conexões encontradas: ${connectionsData.connections?.length || 0}`);
    }

    // 3. Testar a função initialize
    console.log('\n3️⃣ Testando função initialize...');
    const { data: initData, error: initError } = await supabase.functions.invoke('agent-whatsapp-manager/initialize', {
      body: {
        agentId: testAgentId,
        whatsappNumber: '5511999999999'
      }
    });

    if (initError) {
      console.log(`❌ Erro na função initialize: ${initError.message}`);
      console.log('Detalhes do erro:', initError);
    } else {
      console.log('✅ Função initialize funcionando!');
      console.log('Resposta:', initData);
    }

    // 4. Testar novamente a função connections para ver se foi criada uma conexão
    console.log('\n4️⃣ Testando connections novamente...');
    const { data: connectionsData2, error: connectionsError2 } = await supabase.functions.invoke('agent-whatsapp-manager/connections', {
      body: { agentId: testAgentId }
    });

    if (connectionsError2) {
      console.log(`❌ Erro na segunda tentativa: ${connectionsError2.message}`);
    } else {
      console.log('✅ Segunda tentativa funcionando!');
      console.log(`Conexões encontradas: ${connectionsData2.connections?.length || 0}`);
      
      if (connectionsData2.connections && connectionsData2.connections.length > 0) {
        console.log('Conexão criada:', connectionsData2.connections[0]);
      }
    }

    console.log('\n🎉 Teste concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testAgentWhatsAppFix(); 