// ========================================
// TESTE DOS NÚMEROS DE WHATSAPP CADASTRADOS
// Verifica quais números estão cadastrados na tabela clinic_whatsapp_numbers
// ========================================

import { createClient } from '@supabase/supabase-js';

async function testClinicWhatsAppNumbers() {
  console.log('🧪 [Teste] Verificando números de WhatsApp cadastrados...');
  
  try {
    // Configuração do Supabase
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Buscar todos os números cadastrados
    console.log('📋 [Teste] Buscando números na tabela clinic_whatsapp_numbers...');
    
    const { data: whatsappNumbers, error } = await supabase
      .from('clinic_whatsapp_numbers')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.error('❌ [Teste] Erro ao buscar números:', error);
      return false;
    }
    
    console.log('✅ [Teste] Números encontrados:', whatsappNumbers?.length || 0);
    
    if (whatsappNumbers && whatsappNumbers.length > 0) {
      console.log('📊 [Teste] Detalhes dos números:');
      whatsappNumbers.forEach((number, index) => {
        console.log(`  ${index + 1}. Número: ${number.whatsapp_number}`);
        console.log(`     Clínica ID: ${number.clinic_id}`);
        console.log(`     Ativo: ${number.is_active}`);
        console.log(`     Criado em: ${number.created_at}`);
        console.log('');
      });
    } else {
      console.log('⚠️ [Teste] Nenhum número cadastrado encontrado');
    }
    
    // Testar busca por número específico
    console.log('🔍 [Teste] Testando busca por número específico...');
    
    const testNumbers = [
      '554730915628',
      '5547999999999',
      '698766983327246', // ID da Meta
      '+554730915628',
      '+5547999999999'
    ];
    
    for (const testNumber of testNumbers) {
      console.log(`\n🔍 [Teste] Testando número: ${testNumber}`);
      
      // Remover + se presente para buscar na tabela
      const cleanNumber = testNumber.replace('+', '');
      
      const { data: foundClinics, error: searchError } = await supabase
        .from('clinic_whatsapp_numbers')
        .select('clinic_id, whatsapp_number')
        .eq('whatsapp_number', cleanNumber)
        .eq('is_active', true);
      
      if (searchError) {
        console.log(`  ❌ Erro na busca: ${searchError.message}`);
      } else if (foundClinics && foundClinics.length > 0) {
        console.log(`  ✅ Encontrado: ${foundClinics.length} registro(s)`);
        foundClinics.forEach((clinic, idx) => {
          console.log(`     ${idx + 1}. Clínica ID: ${clinic.clinic_id}, Número: ${clinic.whatsapp_number}`);
        });
      } else {
        console.log(`  ❌ Não encontrado`);
      }
    }
    
    // Verificar clínicas disponíveis
    console.log('\n🏥 [Teste] Verificando clínicas disponíveis...');
    
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('id, name, whatsapp_phone')
      .eq('is_active', true);
    
    if (clinicsError) {
      console.error('❌ [Teste] Erro ao buscar clínicas:', clinicsError);
    } else {
      console.log('✅ [Teste] Clínicas encontradas:', clinics?.length || 0);
      clinics?.forEach((clinic, index) => {
        console.log(`  ${index + 1}. ID: ${clinic.id}`);
        console.log(`     Nome: ${clinic.name}`);
        console.log(`     WhatsApp: ${clinic.whatsapp_phone}`);
        console.log('');
      });
    }
    
    console.log('\n🎉 [Teste] Verificação concluída!');
    return true;
    
  } catch (error) {
    console.error('💥 [Teste] Erro durante a verificação:', error);
    return false;
  }
}

// Executar teste se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testClinicWhatsAppNumbers()
    .then(success => {
      if (success) {
        console.log('\n✅ [Teste] Verificação dos números concluída!');
        process.exit(0);
      } else {
        console.log('\n❌ [Teste] Verificação falhou!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 [Teste] Erro fatal na verificação:', error);
      process.exit(1);
    });
}

export { testClinicWhatsAppNumbers };
