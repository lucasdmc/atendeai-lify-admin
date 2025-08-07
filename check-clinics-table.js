// Script para verificar a estrutura da tabela clinics
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClinicsTable() {
  try {
    console.log('🔍 Verificando dados da tabela clinics...');
    
    // 1. Buscar todas as clínicas
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*');

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log(`\n🏥 Clínicas encontradas: ${clinics.length}`);
    clinics.forEach((clinic, index) => {
      console.log(`\n${index + 1}. ${clinic.name}:`);
      console.log(`   - ID: ${clinic.id}`);
      console.log(`   - WhatsApp Phone: ${clinic.whatsapp_phone || 'NÃO CONFIGURADO'}`);
      console.log(`   - Has Contextualization: ${clinic.has_contextualization || false}`);
      console.log(`   - Simulation Mode: ${clinic.simulation_mode || false}`);
      console.log(`   - Contextualization JSON: ${clinic.contextualization_json ? 'PRESENTE' : 'AUSENTE'}`);
    });

    // 2. Verificar se há clínica com o número específico
    const targetNumber = '554730915628';
    const { data: targetClinic, error: targetError } = await supabase
      .from('clinics')
      .select('*')
      .eq('whatsapp_phone', targetNumber)
      .single();

    if (targetError) {
      console.log(`\n❌ Clínica não encontrada para o número ${targetNumber}:`, targetError.message);
      
      // 3. Verificar se há clínica com has_contextualization = true
      const { data: fallbackClinic, error: fallbackError } = await supabase
        .from('clinics')
        .select('*')
        .eq('has_contextualization', true)
        .single();

      if (fallbackError) {
        console.log(`\n❌ Nenhuma clínica com contextualização encontrada:`, fallbackError.message);
      } else {
        console.log(`\n✅ Clínica fallback encontrada: ${fallbackClinic.name}`);
        console.log(`   - WhatsApp Phone: ${fallbackClinic.whatsapp_phone || 'NÃO CONFIGURADO'}`);
      }
    } else {
      console.log(`\n✅ Clínica encontrada para o número ${targetNumber}:`, targetClinic.name);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkClinicsTable();
