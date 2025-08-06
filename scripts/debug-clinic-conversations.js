import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugClinicConversations() {
  console.log('🔍 Debugando conversas da clínica CardioPrime...\n');

  try {
    // 1. Buscar a clínica CardioPrime
    console.log('1️⃣ Buscando clínica CardioPrime...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*')
      .ilike('name', '%CardioPrime%');

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log(`✅ Clínicas encontradas: ${clinics?.length || 0}`);
    clinics?.forEach(clinic => {
      console.log(`   - ${clinic.name} (${clinic.id})`);
    });

    if (!clinics || clinics.length === 0) {
      console.log('❌ Nenhuma clínica CardioPrime encontrada');
      return;
    }

    const cardiprimeClinic = clinics[0];
    console.log(`\n🎯 Clínica selecionada: ${cardiprimeClinic.name} (${cardiprimeClinic.id})`);

    // 2. Buscar agentes da clínica
    console.log('\n2️⃣ Buscando agentes da clínica...');
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .eq('clinic_id', cardiprimeClinic.id);

    if (agentsError) {
      console.error('❌ Erro ao buscar agentes:', agentsError);
      return;
    }

    console.log(`✅ Agentes encontrados: ${agents?.length || 0}`);
    agents?.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.id}) - Ativo: ${agent.is_active}`);
    });

    if (!agents || agents.length === 0) {
      console.log('❌ Nenhum agente encontrado para a clínica');
      return;
    }

    // 3. Buscar conversas dos agentes
    console.log('\n3️⃣ Buscando conversas dos agentes...');
    const agentIds = agents.map(agent => agent.id);
    
    const { data: agentConversations, error: convError } = await supabase
      .from('agent_whatsapp_conversations')
      .select('*')
      .in('agent_id', agentIds);

    if (convError) {
      console.error('❌ Erro ao buscar conversas de agentes:', convError);
      return;
    }

    console.log(`✅ Conversas de agentes encontradas: ${agentConversations?.length || 0}`);
    agentConversations?.forEach(conv => {
      console.log(`   - ${conv.phone_number} (${conv.contact_name}) - Agente: ${conv.agent_id}`);
    });

    // 4. Buscar conversas gerais
    console.log('\n4️⃣ Buscando conversas gerais...');
    const { data: generalConversations, error: generalError } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (generalError) {
      console.error('❌ Erro ao buscar conversas gerais:', generalError);
      return;
    }

    console.log(`✅ Conversas gerais encontradas: ${generalConversations?.length || 0}`);
    generalConversations?.forEach(conv => {
      console.log(`   - ${conv.phone_number} (${conv.name})`);
    });

    // 5. Verificar se o número 554730915628 existe
    console.log('\n5️⃣ Verificando número específico 554730915628...');
    
    // Buscar em conversas gerais
    const { data: specificGeneral, error: specificGeneralError } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('phone_number', '554730915628');

    if (specificGeneralError) {
      console.error('❌ Erro ao buscar número em conversas gerais:', specificGeneralError);
    } else {
      console.log(`✅ Número em conversas gerais: ${specificGeneral?.length || 0}`);
      specificGeneral?.forEach(conv => {
        console.log(`   - ${conv.phone_number} (${conv.name}) - ID: ${conv.id}`);
      });
    }

    // Buscar em conversas de agentes
    const { data: specificAgent, error: specificAgentError } = await supabase
      .from('agent_whatsapp_conversations')
      .select('*')
      .eq('phone_number', '554730915628');

    if (specificAgentError) {
      console.error('❌ Erro ao buscar número em conversas de agentes:', specificAgentError);
    } else {
      console.log(`✅ Número em conversas de agentes: ${specificAgent?.length || 0}`);
      specificAgent?.forEach(conv => {
        console.log(`   - ${conv.phone_number} (${conv.contact_name}) - Agente: ${conv.agent_id}`);
      });
    }

    // 6. Resumo do problema
    console.log('\n📊 RESUMO DO PROBLEMA:');
    console.log('='.repeat(50));
    
    if (agents && agents.length > 0) {
      console.log('✅ Agentes encontrados para a clínica');
    } else {
      console.log('❌ NENHUM AGENTE ENCONTRADO - Este é o problema!');
    }
    
    if (agentConversations && agentConversations.length > 0) {
      console.log('✅ Conversas de agentes encontradas');
    } else {
      console.log('❌ NENHUMA CONVERSA DE AGENTE ENCONTRADA');
    }
    
    if (specificGeneral && specificGeneral.length > 0) {
      console.log('✅ Número 554730915628 encontrado em conversas gerais');
    } else {
      console.log('❌ Número 554730915628 NÃO encontrado em conversas gerais');
    }
    
    if (specificAgent && specificAgent.length > 0) {
      console.log('✅ Número 554730915628 encontrado em conversas de agentes');
    } else {
      console.log('❌ Número 554730915628 NÃO encontrado em conversas de agentes');
    }

    console.log('\n💡 SOLUÇÃO:');
    if (!agents || agents.length === 0) {
      console.log('1. Criar agentes para a clínica CardioPrime');
      console.log('2. Associar conversas aos agentes');
    } else if (!agentConversations || agentConversations.length === 0) {
      console.log('1. Associar conversas existentes aos agentes');
      console.log('2. Ou criar novas conversas para os agentes');
    } else {
      console.log('1. Verificar se o filtro está funcionando corretamente');
      console.log('2. Verificar se as conversas estão sendo exibidas');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugClinicConversations(); 