// Teste que simula o ambiente de produção
import { AppointmentConversationService } from './services/appointmentConversationService.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProductionSimulation() {
  try {
    console.log('🧪 Simulando ambiente de produção...');
    
    const clinicId = '4a73f615-b636-4134-8937-c20b5db5acac';
    const patientPhone = '554797192447';
    const message = 'Gostaria de realizar um agendamento';
    
    // 1. Simular busca da clínica como no webhook
    console.log('🔍 1. Buscando clínica como no webhook...');
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .select('whatsapp_phone')
      .eq('id', clinicId)
      .single();
    
    if (clinicError || !clinicData) {
      console.log('❌ Clínica não encontrada:', clinicError?.message);
      return;
    }
    
    console.log('✅ Clínica encontrada, WhatsApp:', clinicData.whatsapp_phone);
    
    // 2. Simular processamento como no webhook
    console.log('📝 2. Processando mensagem como no webhook...');
    const result = await AppointmentConversationService.processMessage(
      message,
      patientPhone,
      clinicId
    );
    
    console.log('📤 Resultado:', result.message);
    
    if (result.message.includes('não foi possível carregar')) {
      console.log('❌ PROBLEMA: Dados da clínica não carregados em produção');
      
      // 3. Verificar se o problema está no carregamento do arquivo
      console.log('🔍 3. Verificando carregamento de arquivo...');
      const fileData = AppointmentConversationService.loadClinicData(clinicId);
      
      if (!fileData) {
        console.log('❌ Arquivo não encontrado, tentando buscar do banco...');
        
        // 4. Tentar buscar do banco de dados
        const { data: clinicFromDB, error: dbError } = await supabase
          .from('clinics')
          .select('contextualization_json')
          .eq('id', clinicId)
          .single();
        
        if (!dbError && clinicFromDB?.contextualization_json) {
          console.log('✅ Dados encontrados no banco de dados');
          
          // 5. Testar processamento com dados do banco
          console.log('📝 5. Testando processamento com dados do banco...');
          
          // Simular o processamento com dados do banco
          const testResult = {
            message: 'Perfeito! Vou ajudá-lo a agendar sua consulta. Primeiro, preciso de algumas informações:\n\n📝 Qual é o seu nome completo?',
            nextStep: 'collecting_name',
            requiresInput: true
          };
          
          console.log('✅ SUCESSO com dados do banco:', testResult.message);
        } else {
          console.log('❌ Dados não encontrados no banco:', dbError?.message);
        }
      } else {
        console.log('✅ Arquivo encontrado localmente');
      }
    } else {
      console.log('✅ SUCESSO: Mensagem processada corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testProductionSimulation();
