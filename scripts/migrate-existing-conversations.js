import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateExistingConversations() {
  console.log('🔄 MIGRANDO CONVERSAS EXISTENTES');
  console.log('==================================');

  try {
    // 1. Buscar conversas existentes
    console.log('\n1️⃣ Buscando conversas existentes...');
    
    const { data: existingConversations, error: conversationsError } = await supabase
      .from('whatsapp_conversations')
      .select('*');

    if (conversationsError) {
      console.error('❌ Erro ao buscar conversas existentes:', conversationsError);
      return;
    }

    console.log(`✅ Encontradas ${existingConversations?.length || 0} conversas existentes`);

    // 2. Migrar conversas para nova estrutura
    console.log('\n2️⃣ Migrando conversas...');
    
    let migratedCount = 0;
    let skippedCount = 0;

    for (const conversation of existingConversations || []) {
      console.log(`\n💬 Processando conversa: ${conversation.phone_number}`);
      
      // Pular conversas do próprio número da clínica
      if (conversation.phone_number === '554730915628') {
        console.log(`⚠️ Pulando conversa do próprio número da clínica`);
        skippedCount++;
        continue;
      }

      // Migrar conversa para nova estrutura
      const { error: migrateError } = await supabase
        .from('whatsapp_conversations_improved')
        .upsert({
          clinic_id: '4a73f615-b636-4134-8937-c20b5db5acac', // CardioPrime
          patient_phone_number: conversation.phone_number,
          clinic_whatsapp_number: '554730915628', // Número da CardioPrime
          patient_name: conversation.name,
          last_message_preview: conversation.last_message_preview,
          unread_count: conversation.unread_count || 0,
          last_message_at: conversation.updated_at || conversation.created_at,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at
        }, {
          onConflict: 'clinic_id,patient_phone_number,clinic_whatsapp_number'
        });

      if (migrateError) {
        console.error(`❌ Erro ao migrar conversa ${conversation.phone_number}:`, migrateError);
      } else {
        console.log(`✅ Conversa migrada: ${conversation.phone_number}`);
        migratedCount++;
      }
    }

    // 3. Verificar conversas migradas
    console.log('\n3️⃣ Verificando conversas migradas...');
    
    const { data: migratedConversations, error: checkError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (checkError) {
      console.error('❌ Erro ao verificar conversas migradas:', checkError);
    } else {
      console.log(`✅ Conversas migradas: ${migratedConversations?.length || 0}`);
      
      migratedConversations?.forEach((conv, index) => {
        console.log(`   ${index + 1}. Paciente: ${conv.patient_phone_number} | Nome: ${conv.patient_name || 'N/A'} | Última: ${conv.last_message_preview}`);
      });
    }

    // 4. Resumo da migração
    console.log('\n📊 RESUMO DA MIGRAÇÃO:');
    console.log(`✅ Conversas migradas: ${migratedCount}`);
    console.log(`⚠️ Conversas puladas: ${skippedCount}`);
    console.log(`📋 Total processado: ${existingConversations?.length || 0}`);

    console.log('\n✅ MIGRAÇÃO CONCLUÍDA!');
    console.log('=======================');
    console.log('🎯 Agora você deve ver as conversas na tela!');

  } catch (error) {
    console.error('❌ Erro durante migração:', error);
  }
}

migrateExistingConversations(); 