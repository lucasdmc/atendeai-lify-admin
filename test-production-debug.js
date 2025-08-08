// Teste específico para debugar o problema em produção
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProductionDebug() {
  try {
    console.log('🧪 Debugando problema em produção...');
    
    // Simular exatamente o que acontece no webhook
    const phoneNumber = '554730915628'; // display_phone_number do webhook
    const patientPhone = '554797192447';
    const message = 'Gostaria de realizar um agendamento';
    
    console.log('📋 Parâmetros do webhook:');
    console.log('  - display_phone_number:', phoneNumber);
    console.log('  - patient_phone:', patientPhone);
    console.log('  - message:', message);
    
    // 1. Buscar clínica pelo número do WhatsApp (como no webhook)
    console.log('\n🔍 1. Buscando clínica pelo número do WhatsApp...');
    
    // Tentar diferentes formatos do número
    const numberFormats = [
      phoneNumber, // 554730915628
      `+${phoneNumber}`, // +554730915628
      phoneNumber.substring(2), // 4730915628 (sem 55)
      `+55${phoneNumber.substring(2)}` // +554730915628
    ];
    
    let clinicFound = null;
    
    for (const numberFormat of numberFormats) {
      console.log(`  Tentando formato: ${numberFormat}`);
      
      const { data: clinic, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('whatsapp_phone', numberFormat)
        .single();
      
      if (!error && clinic) {
        console.log(`  ✅ Clínica encontrada: ${clinic.name}`);
        console.log(`  📋 ID: ${clinic.id}`);
        console.log(`  📱 WhatsApp: ${clinic.whatsapp_phone}`);
        clinicFound = clinic;
        break;
      } else {
        console.log(`  ❌ Não encontrada: ${error?.message}`);
      }
    }
    
    if (!clinicFound) {
      console.log('\n❌ Nenhuma clínica encontrada pelos números testados');
      
      // 2. Tentar buscar por conversas anteriores
      console.log('\n🔍 2. Buscando por conversas anteriores...');
      const { data: conversations, error: convError } = await supabase
        .from('whatsapp_conversations_improved')
        .select('clinic_id')
        .eq('patient_phone_number', patientPhone)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!convError && conversations) {
        console.log(`  ✅ Conversa encontrada, clinic_id: ${conversations.clinic_id}`);
        
        // Buscar dados da clínica pelo ID da conversa
        const { data: clinicFromConv, error: clinicError } = await supabase
          .from('clinics')
          .select('*')
          .eq('id', conversations.clinic_id)
          .single();
        
        if (!clinicError && clinicFromConv) {
          console.log(`  ✅ Clínica encontrada via conversa: ${clinicFromConv.name}`);
          clinicFound = clinicFromConv;
        }
      } else {
        console.log('  ❌ Nenhuma conversa encontrada');
      }
    }
    
    if (clinicFound) {
      console.log('\n✅ Clínica encontrada! Testando processamento...');
      
      // 3. Testar se os dados da clínica estão disponíveis
      console.log('\n🔍 3. Verificando dados da clínica...');
      console.log(`  📋 Tem contextualização: ${!!clinicFound.contextualization_json}`);
      console.log(`  📋 Has contextualization: ${clinicFound.has_contextualization}`);
      
      if (clinicFound.contextualization_json) {
        console.log('  ✅ Dados de contextualização disponíveis');
        
        // 4. Simular processamento
        console.log('\n📝 4. Simulando processamento...');
        const simulatedResponse = {
          message: 'Perfeito! Vou ajudá-lo a agendar sua consulta. Primeiro, preciso de algumas informações:\n\n📝 Qual é o seu nome completo?',
          nextStep: 'collecting_name',
          requiresInput: true
        };
        
        console.log('  ✅ Resposta simulada:', simulatedResponse.message);
      } else {
        console.log('  ❌ Dados de contextualização não disponíveis');
      }
    } else {
      console.log('\n❌ PROBLEMA: Nenhuma clínica encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testProductionDebug();
