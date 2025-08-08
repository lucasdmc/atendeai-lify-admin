// Teste para verificar busca de clínica
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClinicSearch() {
  try {
    console.log('🧪 Testando busca de clínica...');
    
    // 1. Buscar clínica pelo número do WhatsApp
    const whatsappNumber = '554730915628';
    console.log(`🔍 Buscando clínica pelo WhatsApp: ${whatsappNumber}`);
    
    const { data: clinicByWhatsapp, error: whatsappError } = await supabase
      .from('clinics')
      .select('*')
      .eq('whatsapp_phone', whatsappNumber)
      .single();
    
    if (whatsappError) {
      console.log('❌ Clínica não encontrada pelo WhatsApp:', whatsappError.message);
    } else {
      console.log('✅ Clínica encontrada pelo WhatsApp:', clinicByWhatsapp.name);
      console.log('📋 ID:', clinicByWhatsapp.id);
      console.log('📱 WhatsApp:', clinicByWhatsapp.whatsapp_phone);
      console.log('📋 Tem contextualização:', !!clinicByWhatsapp.contextualization_json);
    }
    
    // 2. Buscar clínica pelo ID específico
    const clinicId = '4a73f615-b636-4134-8937-c20b5db5acac';
    console.log(`🔍 Buscando clínica pelo ID: ${clinicId}`);
    
    const { data: clinicById, error: idError } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .single();
    
    if (idError) {
      console.log('❌ Clínica não encontrada pelo ID:', idError.message);
    } else {
      console.log('✅ Clínica encontrada pelo ID:', clinicById.name);
      console.log('📋 ID:', clinicById.id);
      console.log('📱 WhatsApp:', clinicById.whatsapp_phone);
      console.log('📋 Tem contextualização:', !!clinicById.contextualization_json);
    }
    
    // 3. Buscar conversas do paciente
    const patientPhone = '554797192447';
    console.log(`🔍 Buscando conversas do paciente: ${patientPhone}`);
    
    const { data: conversations, error: convError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('clinic_id')
      .eq('patient_phone_number', patientPhone)
      .order('last_message_at', { ascending: false })
      .limit(1);
    
    if (convError) {
      console.log('❌ Erro ao buscar conversas:', convError.message);
    } else if (conversations && conversations.length > 0) {
      console.log('✅ Conversa encontrada, clinic_id:', conversations[0].clinic_id);
    } else {
      console.log('❌ Nenhuma conversa encontrada para o paciente');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testClinicSearch();
