import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWhatsAppData() {
  console.log('🔍 Verificando dados do WhatsApp...\n');

  try {
    // 1. Verificar tabela whatsapp_conversations
    console.log('📊 Verificando whatsapp_conversations...');
    const { data: conversations, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (convError) {
      console.error('❌ Erro ao buscar conversas:', convError);
    } else {
      console.log(`✅ Encontradas ${conversations?.length || 0} conversas`);
      if (conversations && conversations.length > 0) {
        console.log('📝 Primeira conversa:', conversations[0]);
      }
    }

    // 2. Verificar tabela whatsapp_messages
    console.log('\n📊 Verificando whatsapp_messages...');
    const { data: messages, error: msgError } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (msgError) {
      console.error('❌ Erro ao buscar mensagens:', msgError);
    } else {
      console.log(`✅ Encontradas ${messages?.length || 0} mensagens`);
      if (messages && messages.length > 0) {
        console.log('📝 Primeira mensagem:', messages[0]);
      }
    }

    // 3. Verificar tabela agent_whatsapp_conversations
    console.log('\n📊 Verificando agent_whatsapp_conversations...');
    const { data: agentConversations, error: agentConvError } = await supabase
      .from('agent_whatsapp_conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (agentConvError) {
      console.error('❌ Erro ao buscar conversas de agentes:', agentConvError);
    } else {
      console.log(`✅ Encontradas ${agentConversations?.length || 0} conversas de agentes`);
      if (agentConversations && agentConversations.length > 0) {
        console.log('📝 Primeira conversa de agente:', agentConversations[0]);
      }
    }

    // 4. Verificar tabela agent_whatsapp_messages
    console.log('\n📊 Verificando agent_whatsapp_messages...');
    const { data: agentMessages, error: agentMsgError } = await supabase
      .from('agent_whatsapp_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (agentMsgError) {
      console.error('❌ Erro ao buscar mensagens de agentes:', agentMsgError);
    } else {
      console.log(`✅ Encontradas ${agentMessages?.length || 0} mensagens de agentes`);
      if (agentMessages && agentMessages.length > 0) {
        console.log('📝 Primeira mensagem de agente:', agentMessages[0]);
      }
    }

    // 5. Verificar tabela agents
    console.log('\n📊 Verificando agents...');
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .limit(10);

    if (agentsError) {
      console.error('❌ Erro ao buscar agentes:', agentsError);
    } else {
      console.log(`✅ Encontrados ${agents?.length || 0} agentes`);
      if (agents && agents.length > 0) {
        console.log('📝 Primeiro agente:', agents[0]);
      }
    }

    // 6. Verificar tabela clinics
    console.log('\n📊 Verificando clinics...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*')
      .limit(10);

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
    } else {
      console.log(`✅ Encontradas ${clinics?.length || 0} clínicas`);
      if (clinics && clinics.length > 0) {
        console.log('📝 Primeira clínica:', clinics[0]);
      }
    }

    // 7. Verificar relação entre agents e clinics
    console.log('\n📊 Verificando relação agents-clinics...');
    const { data: agentClinicRelation, error: relationError } = await supabase
      .from('agents')
      .select(`
        id,
        name,
        clinic_id,
        clinics (
          id,
          name
        )
      `)
      .limit(5);

    if (relationError) {
      console.error('❌ Erro ao buscar relação agents-clinics:', relationError);
    } else {
      console.log(`✅ Encontradas ${agentClinicRelation?.length || 0} relações agents-clinics`);
      if (agentClinicRelation && agentClinicRelation.length > 0) {
        console.log('📝 Primeira relação:', agentClinicRelation[0]);
      }
    }

    console.log('\n🎯 Resumo:');
    console.log(`- Conversas WhatsApp: ${conversations?.length || 0}`);
    console.log(`- Mensagens WhatsApp: ${messages?.length || 0}`);
    console.log(`- Conversas de Agentes: ${agentConversations?.length || 0}`);
    console.log(`- Mensagens de Agentes: ${agentMessages?.length || 0}`);
    console.log(`- Agentes: ${agents?.length || 0}`);
    console.log(`- Clínicas: ${clinics?.length || 0}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkWhatsAppData(); 