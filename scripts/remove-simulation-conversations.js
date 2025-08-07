import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeSimulationConversations() {
  console.log('🧹 REMOVENDO CONVERSAS DE SIMULAÇÃO');
  console.log('=====================================');

  const simulationNumbers = ['5547997192447', '5547999999999'];

  try {
    for (const phoneNumber of simulationNumbers) {
      console.log(`\n🔍 Buscando conversas do número: ${phoneNumber}`);
      
      // 1. Buscar conversas que envolvem este número
      const { data: conversations, error: conversationsError } = await supabase
        .from('whatsapp_conversations_improved')
        .select('*')
        .or(`patient_phone_number.eq.${phoneNumber},clinic_whatsapp_number.eq.${phoneNumber}`);

      if (conversationsError) {
        console.error(`❌ Erro ao buscar conversas para ${phoneNumber}:`, conversationsError);
        continue;
      }

      console.log(`📋 Encontradas ${conversations?.length || 0} conversas para ${phoneNumber}`);

      if (conversations && conversations.length > 0) {
        // 2. Para cada conversa, remover mensagens primeiro
        for (const conversation of conversations) {
          console.log(`🗑️ Removendo mensagens da conversa ${conversation.id}...`);
          
          const { error: messagesError } = await supabase
            .from('whatsapp_messages_improved')
            .delete()
            .eq('conversation_id', conversation.id);

          if (messagesError) {
            console.error(`❌ Erro ao remover mensagens da conversa ${conversation.id}:`, messagesError);
          } else {
            console.log(`✅ Mensagens da conversa ${conversation.id} removidas`);
          }
        }

        // 3. Remover as conversas
        console.log(`🗑️ Removendo ${conversations.length} conversas...`);
        
        const conversationIds = conversations.map(c => c.id);
        const { error: deleteError } = await supabase
          .from('whatsapp_conversations_improved')
          .delete()
          .in('id', conversationIds);

        if (deleteError) {
          console.error(`❌ Erro ao remover conversas:`, deleteError);
        } else {
          console.log(`✅ ${conversations.length} conversas removidas com sucesso`);
        }
      } else {
        console.log(`ℹ️ Nenhuma conversa encontrada para ${phoneNumber}`);
      }
    }

    // 4. Verificar se ainda existem conversas com esses números
    console.log('\n🔍 Verificando se ainda existem conversas de simulação...');
    
    const { data: remainingConversations, error: checkError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .or(`patient_phone_number.eq.5547997192447,patient_phone_number.eq.5547999999999,clinic_whatsapp_number.eq.5547997192447,clinic_whatsapp_number.eq.5547999999999`);

    if (checkError) {
      console.error('❌ Erro ao verificar conversas restantes:', checkError);
    } else {
      console.log(`📊 Conversas de simulação restantes: ${remainingConversations?.length || 0}`);
      if (remainingConversations && remainingConversations.length > 0) {
        console.log('⚠️ Ainda existem conversas de simulação:');
        remainingConversations.forEach(conv => {
          console.log(`   - ID: ${conv.id} | Paciente: ${conv.patient_phone_number} | Clínica: ${conv.clinic_whatsapp_number}`);
        });
      } else {
        console.log('✅ Todas as conversas de simulação foram removidas!');
      }
    }

    console.log('\n✅ LIMPEZA CONCLUÍDA!');
    console.log('======================');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

removeSimulationConversations(); 