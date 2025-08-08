// Teste que simula exatamente o que acontece no webhook
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWebhookSimulation() {
  try {
    console.log('🧪 Simulando exatamente o que acontece no webhook...');
    
    // Simular dados do webhook
    const toNumber = '554730915628'; // display_phone_number do webhook
    const messageFrom = '554797192447';
    const messageText = 'Gostaria de realizar um agendamento';
    
    console.log('📋 Dados do webhook:');
    console.log('  - toNumber (display_phone_number):', toNumber);
    console.log('  - messageFrom:', messageFrom);
    console.log('  - messageText:', messageText);
    
    // 1. Buscar clínica na tabela clinic_whatsapp_numbers (como no webhook)
    console.log('\n🔍 1. Buscando clínica na tabela clinic_whatsapp_numbers...');
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinic_whatsapp_numbers')
      .select('clinic_id')
      .eq('whatsapp_number', toNumber) // Usar número original (sem +)
      .eq('is_active', true)
      .single();
    
    if (clinicError || !clinicData) {
      console.log('❌ Clínica não encontrada na tabela clinic_whatsapp_numbers:', clinicError?.message);
      return;
    }
    
    console.log('✅ Clínica encontrada, clinic_id:', clinicData.clinic_id);
    
    // 2. Verificar modo de simulação
    console.log('\n🔍 2. Verificando modo de simulação...');
    const { data: clinicInfo, error: clinicInfoError } = await supabase
      .from('clinics')
      .select('simulation_mode')
      .eq('id', clinicData.clinic_id)
      .single();
    
    if (clinicInfoError) {
      console.log('❌ Erro ao verificar modo simulação:', clinicInfoError.message);
      return;
    }
    
    const isSimulationMode = clinicInfo?.simulation_mode || false;
    console.log('📋 Modo simulação:', isSimulationMode);
    
    if (isSimulationMode) {
      console.log('⚠️ Clínica em modo simulação, não processando agendamento');
      return;
    }
    
    // 3. Simular processamento de agendamento
    console.log('\n📝 3. Simulando processamento de agendamento...');
    
    // Buscar dados da clínica para obter o número do WhatsApp
    const { data: clinicDetails, error: clinicDetailsError } = await supabase
      .from('clinics')
      .select('whatsapp_phone')
      .eq('id', clinicData.clinic_id)
      .single();
    
    if (clinicDetailsError || !clinicDetails) {
      console.log('❌ Erro ao buscar dados da clínica:', clinicDetailsError?.message);
      return;
    }
    
    console.log('✅ Dados da clínica obtidos, WhatsApp:', clinicDetails.whatsapp_phone);
    
    // 4. Simular resposta de agendamento
    console.log('\n📤 4. Simulando resposta de agendamento...');
    const simulatedResponse = {
      message: 'Perfeito! Vou ajudá-lo a agendar sua consulta. Primeiro, preciso de algumas informações:\n\n📝 Qual é o seu nome completo?',
      nextStep: 'collecting_name',
      requiresInput: true
    };
    
    console.log('✅ Resposta simulada:', simulatedResponse.message);
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('📋 O webhook deveria funcionar corretamente com essas configurações');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testWebhookSimulation();
