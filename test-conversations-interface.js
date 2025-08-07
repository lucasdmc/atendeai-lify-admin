import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConversationsInterface() {
  console.log('📱 TESTANDO INTERFACE DE CONVERSAS');
  console.log('===================================');

  try {
    // Simular diferentes cenários de filtro
    
    // 1. Teste 1: Sem filtro de clínica (como admin_lify sem clínica selecionada)
    console.log('\n🔍 TESTE 1: Sem filtro de clínica');
    console.log('====================================');
    
    let query1 = supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .order('last_message_at', { ascending: false });

    const { data: conversations1, error: error1 } = await query1;

    if (error1) {
      console.error('❌ Erro no teste 1:', error1);
      return;
    }

    console.log('✅ Conversas encontradas (sem filtro):', conversations1.length);
    conversations1.forEach((conv, index) => {
      const date = new Date(conv.last_message_at);
      console.log(`   ${index + 1}. ${date.toLocaleString('pt-BR')} | Paciente: ${conv.patient_phone_number} | Clínica: ${conv.clinic_whatsapp_number} | Clinic ID: ${conv.clinic_id} | Última: ${conv.last_message_preview}`);
    });

    // 2. Teste 2: Com filtro da clínica CardioPrime
    console.log('\n🔍 TESTE 2: Com filtro da clínica CardioPrime');
    console.log('===============================================');
    
    const cardioprimeClinicId = '4a73f615-b636-4134-8937-c20b5db5acac';
    
    let query2 = supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .eq('clinic_id', cardioprimeClinicId)
      .order('last_message_at', { ascending: false });

    const { data: conversations2, error: error2 } = await query2;

    if (error2) {
      console.error('❌ Erro no teste 2:', error2);
      return;
    }

    console.log('✅ Conversas encontradas (filtro CardioPrime):', conversations2.length);
    conversations2.forEach((conv, index) => {
      const date = new Date(conv.last_message_at);
      console.log(`   ${index + 1}. ${date.toLocaleString('pt-BR')} | Paciente: ${conv.patient_phone_number} | Clínica: ${conv.clinic_whatsapp_number} | Clinic ID: ${conv.clinic_id} | Última: ${conv.last_message_preview}`);
    });

    // 3. Teste 3: Com filtro da clínica ESADI
    console.log('\n🔍 TESTE 3: Com filtro da clínica ESADI');
    console.log('==========================================');
    
    const esadiClinicId = '9b11dfd6-d638-48e3-bc84-f3880f987da2';
    
    let query3 = supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .eq('clinic_id', esadiClinicId)
      .order('last_message_at', { ascending: false });

    const { data: conversations3, error: error3 } = await query3;

    if (error3) {
      console.error('❌ Erro no teste 3:', error3);
      return;
    }

    console.log('✅ Conversas encontradas (filtro ESADI):', conversations3.length);
    conversations3.forEach((conv, index) => {
      const date = new Date(conv.last_message_at);
      console.log(`   ${index + 1}. ${date.toLocaleString('pt-BR')} | Paciente: ${conv.patient_phone_number} | Clínica: ${conv.clinic_whatsapp_number} | Clinic ID: ${conv.clinic_id} | Última: ${conv.last_message_preview}`);
    });

    // 4. Análise final
    console.log('\n🎯 ANÁLISE FINAL:');
    console.log('==================');
    
    if (conversations1.length > 0) {
      console.log('✅ SEM filtro: Conversas encontradas');
    } else {
      console.log('❌ SEM filtro: Nenhuma conversa encontrada');
    }

    if (conversations2.length > 0) {
      console.log('✅ COM filtro CardioPrime: Conversas encontradas');
    } else {
      console.log('❌ COM filtro CardioPrime: Nenhuma conversa encontrada');
    }

    if (conversations3.length > 0) {
      console.log('✅ COM filtro ESADI: Conversas encontradas');
    } else {
      console.log('❌ COM filtro ESADI: Nenhuma conversa encontrada');
    }

    // 5. Verificar qual clínica está selecionada na interface
    console.log('\n🔍 VERIFICANDO CLÍNICA SELECIONADA:');
    console.log('=====================================');
    
    // Simular diferentes cenários de selectedClinicId
    const scenarios = [
      { name: 'Nenhuma clínica selecionada', clinicId: null },
      { name: 'CardioPrime selecionada', clinicId: cardioprimeClinicId },
      { name: 'ESADI selecionada', clinicId: esadiClinicId }
    ];

    for (const scenario of scenarios) {
      console.log(`\n📋 Cenário: ${scenario.name}`);
      
      let query = supabase
        .from('whatsapp_conversations_improved')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (scenario.clinicId) {
        query = query.eq('clinic_id', scenario.clinicId);
      }

      const { data: conversations, error } = await query;

      if (error) {
        console.error('❌ Erro:', error);
        continue;
      }

      console.log(`✅ Conversas encontradas: ${conversations.length}`);
      conversations.forEach((conv, index) => {
        const date = new Date(conv.last_message_at);
        console.log(`   ${index + 1}. ${date.toLocaleString('pt-BR')} | Paciente: ${conv.patient_phone_number} | Clínica: ${conv.clinic_whatsapp_number} | Última: ${conv.last_message_preview}`);
      });
    }

    // 6. Instruções para o usuário
    console.log('\n📱 INSTRUÇÕES PARA O USUÁRIO:');
    console.log('================================');
    console.log('1. Verifique qual clínica está selecionada no combobox');
    console.log('2. Se nenhuma clínica estiver selecionada, selecione "CardioPrime"');
    console.log('3. Se "CardioPrime" estiver selecionada, tente selecionar "Todas"');
    console.log('4. Recarregue a página após mudar a clínica');
    console.log('5. Verifique se as conversas aparecem');

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

testConversationsInterface(); 