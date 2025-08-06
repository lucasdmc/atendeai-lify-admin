import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function associateConversationsToClinics() {
  console.log('🔗 Associando conversas às clínicas...\n');

  try {
    // 1. Buscar clínicas disponíveis
    console.log('1️⃣ Buscando clínicas...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('id, name')
      .order('name');

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log(`✅ Clínicas encontradas: ${clinics?.length || 0}`);
    clinics?.forEach(clinic => {
      console.log(`   - ${clinic.name} (${clinic.id})`);
    });

    if (!clinics || clinics.length === 0) {
      console.log('❌ Nenhuma clínica encontrada');
      return;
    }

    // 2. Buscar conversas sem clínica associada
    console.log('\n2️⃣ Buscando conversas sem clínica...');
    const { data: conversations, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .is('clinic_id', null);

    if (convError) {
      console.error('❌ Erro ao buscar conversas:', convError);
      return;
    }

    console.log(`✅ Conversas sem clínica: ${conversations?.length || 0}`);
    
    if (!conversations || conversations.length === 0) {
      console.log('✅ Todas as conversas já têm clínica associada');
      return;
    }

    // 3. Associar conversas às clínicas
    console.log('\n3️⃣ Associando conversas às clínicas...');
    
    // Para este exemplo, vou associar todas as conversas à primeira clínica
    // Em um sistema real, você pode ter uma lógica mais sofisticada
    const defaultClinicId = clinics[0].id;
    console.log(`🎯 Usando clínica padrão: ${clinics[0].name} (${defaultClinicId})`);

    let successCount = 0;
    let errorCount = 0;

    for (const conversation of conversations) {
      try {
        const { error: updateError } = await supabase
          .from('whatsapp_conversations')
          .update({ clinic_id: defaultClinicId })
          .eq('id', conversation.id);

        if (updateError) {
          console.error(`❌ Erro ao associar conversa ${conversation.phone_number}:`, updateError);
          errorCount++;
        } else {
          console.log(`✅ Associada: ${conversation.phone_number} → ${clinics[0].name}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar conversa ${conversation.phone_number}:`, error);
        errorCount++;
      }
    }

    // 4. Verificar resultado
    console.log('\n4️⃣ Verificando resultado...');
    const { data: updatedConversations, error: checkError } = await supabase
      .from('whatsapp_conversations')
      .select('id, phone_number, name, clinic_id')
      .not('clinic_id', 'is', null)
      .limit(10);

    if (checkError) {
      console.error('❌ Erro ao verificar conversas atualizadas:', checkError);
    } else {
      console.log(`✅ Conversas com clínica associada: ${updatedConversations?.length || 0}`);
      updatedConversations?.forEach(conv => {
        const clinic = clinics.find(c => c.id === conv.clinic_id);
        console.log(`   - ${conv.phone_number} → ${clinic?.name || 'Clínica não encontrada'}`);
      });
    }

    // 5. Resumo
    console.log('\n📊 RESUMO:');
    console.log('='.repeat(50));
    console.log(`✅ Conversas associadas com sucesso: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`🎯 Clínica padrão: ${clinics[0].name}`);

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Modificar código do frontend para usar clinic_id');
    console.log('2. Remover dependência de agentes');
    console.log('3. Testar filtro por clínica');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

associateConversationsToClinics(); 