import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanTestConversations() {
  console.log('🧹 Limpando conversas de teste e exemplo...\n');

  try {
    // 1. Buscar clínicas disponíveis
    console.log('1️⃣ Buscando clínicas...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('id, name, whatsapp_phone')
      .order('name');

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log(`✅ Clínicas encontradas: ${clinics?.length || 0}`);
    clinics?.forEach(clinic => {
      console.log(`   - ${clinic.name} (${clinic.id}) - ${clinic.whatsapp_phone || 'Sem número'}`);
    });

    if (!clinics || clinics.length === 0) {
      console.log('❌ Nenhuma clínica encontrada');
      return;
    }

    // 2. Buscar todas as conversas
    console.log('\n2️⃣ Buscando todas as conversas...');
    const { data: allConversations, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .order('created_at', { ascending: false });

    if (convError) {
      console.error('❌ Erro ao buscar conversas:', convError);
      return;
    }

    console.log(`✅ Total de conversas: ${allConversations?.length || 0}`);

    // 3. Identificar conversas de teste/exemplo
    const testConversations = allConversations?.filter(conv => {
      // Conversas com números de teste
      const testNumbers = [
        '5511999999999',
        '5511888888888',
        '5511777777777',
        '5511666666666',
        '5511555555555'
      ];
      
      // Conversas com nomes de teste
      const testNames = [
        'João Silva',
        'Maria Santos',
        'Pedro Oliveira',
        'Ana Costa',
        'Carlos Ferreira',
        'Teste',
        'Test User',
        'Example User'
      ];

      return testNumbers.includes(conv.phone_number) || 
             testNames.some(name => conv.name?.includes(name));
    }) || [];

    console.log(`🔍 Conversas de teste identificadas: ${testConversations.length}`);
    testConversations.forEach(conv => {
      console.log(`   - ${conv.phone_number} (${conv.name})`);
    });

    // 4. Deletar conversas de teste
    if (testConversations.length > 0) {
      console.log('\n3️⃣ Deletando conversas de teste...');
      
      for (const conv of testConversations) {
        try {
          // Primeiro deletar mensagens relacionadas
          const { error: msgError } = await supabase
            .from('whatsapp_messages')
            .delete()
            .eq('conversation_id', conv.id);

          if (msgError) {
            console.error(`❌ Erro ao deletar mensagens da conversa ${conv.id}:`, msgError);
          }

          // Depois deletar a conversa
          const { error: convError } = await supabase
            .from('whatsapp_conversations')
            .delete()
            .eq('id', conv.id);

          if (convError) {
            console.error(`❌ Erro ao deletar conversa ${conv.id}:`, convError);
          } else {
            console.log(`✅ Deletada: ${conv.phone_number} (${conv.name})`);
          }
        } catch (error) {
          console.error(`❌ Erro ao processar conversa ${conv.id}:`, error);
        }
      }
    }

    // 5. Associar conversas reais às clínicas
    console.log('\n4️⃣ Associando conversas reais às clínicas...');
    
    const realConversations = allConversations?.filter(conv => {
      return !testConversations.some(test => test.id === conv.id);
    }) || [];

    console.log(`📱 Conversas reais: ${realConversations.length}`);

    // Associar conversas baseado no número de telefone da clínica
    for (const conversation of realConversations) {
      // Encontrar clínica pelo número de telefone
      const matchingClinic = clinics.find(clinic => {
        if (!clinic.whatsapp_phone) return false;
        
        // Remover formatação e comparar
        const clinicNumber = clinic.whatsapp_phone.replace(/\D/g, '');
        const convNumber = conversation.phone_number.replace(/\D/g, '');
        
        return clinicNumber === convNumber || convNumber.includes(clinicNumber) || clinicNumber.includes(convNumber);
      });

      if (matchingClinic) {
        try {
          const { error: updateError } = await supabase
            .from('whatsapp_conversations')
            .update({ clinic_id: matchingClinic.id })
            .eq('id', conversation.id);

          if (updateError) {
            console.error(`❌ Erro ao associar conversa ${conversation.phone_number}:`, updateError);
          } else {
            console.log(`✅ Associada: ${conversation.phone_number} → ${matchingClinic.name}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao processar conversa ${conversation.phone_number}:`, error);
        }
      } else {
        console.log(`⚠️  Clínica não encontrada para: ${conversation.phone_number}`);
      }
    }

    // 6. Verificar resultado final
    console.log('\n5️⃣ Verificando resultado final...');
    const { data: finalConversations, error: finalError } = await supabase
      .from('whatsapp_conversations')
      .select('id, phone_number, name, clinic_id, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (finalError) {
      console.error('❌ Erro ao verificar conversas finais:', finalError);
    } else {
      console.log(`✅ Conversas restantes: ${finalConversations?.length || 0}`);
      finalConversations?.forEach(conv => {
        const clinic = clinics.find(c => c.id === conv.clinic_id);
        console.log(`   - ${conv.phone_number} (${conv.name}) → ${clinic?.name || 'Sem clínica'}`);
      });
    }

    console.log('\n🎉 Limpeza concluída!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
cleanTestConversations(); 