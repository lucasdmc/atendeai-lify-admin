import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConversationsStructure() {
  console.log('🔍 Verificando estrutura das conversas...\n');

  try {
    // 1. Verificar estrutura da tabela whatsapp_conversations
    console.log('1️⃣ Verificando whatsapp_conversations...');
    const { data: conversations, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .limit(5);

    if (convError) {
      console.error('❌ Erro ao buscar conversas:', convError);
      return;
    }

    console.log(`✅ Conversas encontradas: ${conversations?.length || 0}`);
    if (conversations && conversations.length > 0) {
      console.log('📋 Estrutura da primeira conversa:');
      console.log(JSON.stringify(conversations[0], null, 2));
    }

    // 2. Verificar se existe campo clinic_id nas conversas
    console.log('\n2️⃣ Verificando campos das conversas...');
    if (conversations && conversations.length > 0) {
      const firstConv = conversations[0];
      console.log('Campos disponíveis:');
      Object.keys(firstConv).forEach(key => {
        console.log(`   - ${key}: ${typeof firstConv[key]}`);
      });
    }

    // 3. Verificar conversas com o número específico
    console.log('\n3️⃣ Verificando número 554730915628...');
    const { data: specificConversations, error: specificError } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('phone_number', '554730915628');

    if (specificError) {
      console.error('❌ Erro ao buscar conversa específica:', specificError);
    } else {
      console.log(`✅ Conversas com o número: ${specificConversations?.length || 0}`);
      specificConversations?.forEach(conv => {
        console.log(`   - ${conv.phone_number} (${conv.name}) - ID: ${conv.id}`);
      });
    }

    // 4. Verificar se existe alguma relação com clínicas
    console.log('\n4️⃣ Verificando possíveis relações com clínicas...');
    
    // Verificar se existe campo clinic_id (mesmo que null)
    if (conversations && conversations.length > 0) {
      const hasClinicId = 'clinic_id' in conversations[0];
      console.log(`Campo clinic_id existe: ${hasClinicId}`);
      
      if (hasClinicId) {
        const { data: conversationsWithClinic, error: clinicError } = await supabase
          .from('whatsapp_conversations')
          .select('*')
          .not('clinic_id', 'is', null)
          .limit(5);
        
        if (clinicError) {
          console.error('❌ Erro ao buscar conversas com clínica:', clinicError);
        } else {
          console.log(`✅ Conversas com clínica associada: ${conversationsWithClinic?.length || 0}`);
        }
      }
    }

    // 5. Verificar outras tabelas que podem ter relação
    console.log('\n5️⃣ Verificando outras tabelas...');
    
    // Verificar tabela de conexões WhatsApp
    const { data: connections, error: connError } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .limit(5);

    if (connError) {
      console.error('❌ Erro ao buscar conexões:', connError);
    } else {
      console.log(`✅ Conexões WhatsApp encontradas: ${connections?.length || 0}`);
      if (connections && connections.length > 0) {
        console.log('📋 Estrutura da primeira conexão:');
        console.log(JSON.stringify(connections[0], null, 2));
      }
    }

    // 6. Sugestões de solução
    console.log('\n💡 SUGESTÕES DE SOLUÇÃO:');
    console.log('='.repeat(50));
    
    if (conversations && conversations.length > 0) {
      const hasClinicId = 'clinic_id' in conversations[0];
      
      if (hasClinicId) {
        console.log('✅ Campo clinic_id existe - podemos usar para filtrar');
        console.log('1. Adicionar clinic_id às conversas existentes');
        console.log('2. Modificar filtro para usar clinic_id diretamente');
      } else {
        console.log('❌ Campo clinic_id não existe');
        console.log('1. Adicionar campo clinic_id à tabela whatsapp_conversations');
        console.log('2. Associar conversas às clínicas');
        console.log('3. Modificar filtro para usar clinic_id');
      }
    }

    console.log('\n🔄 PRÓXIMOS PASSOS:');
    console.log('1. Adicionar campo clinic_id à tabela whatsapp_conversations');
    console.log('2. Associar conversas existentes às clínicas');
    console.log('3. Modificar lógica de filtro para usar clinic_id diretamente');
    console.log('4. Remover dependência de agentes do código');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkConversationsStructure(); 