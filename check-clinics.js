// check-clinics.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M'
);

async function checkClinics() {
  try {
    console.log('🔍 Verificando clínicas no banco...');
    
    const { data: clinics, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('has_contextualization', true);
    
    if (error) throw error;
    
    console.log(`🏥 Encontradas ${clinics.length} clínicas:`);
    clinics.forEach(clinic => {
      console.log(`\n📋 Clínica:`);
      console.log(`  ID: ${clinic.id}`);
      console.log(`  Nome: ${clinic.name || clinic.clinic_name || 'N/A'}`);
      console.log(`  WhatsApp: ${clinic.whatsapp_phone || 'N/A'}`);
      console.log(`  Tem contextualização: ${clinic.has_contextualization}`);
      console.log(`  Endereço: ${clinic.address || 'N/A'}`);
      console.log(`  Telefone: ${clinic.phone || clinic.main_phone || 'N/A'}`);
      console.log(`  Email: ${clinic.main_email || 'N/A'}`);
    });
    
    // Verificar se há clínicas sem contextualização
    const { data: allClinics, error: allError } = await supabase
      .from('clinics')
      .select('id, name, clinic_name, has_contextualization');
    
    if (!allError) {
      console.log(`\n📊 Total de clínicas: ${allClinics.length}`);
      const withContext = allClinics.filter(c => c.has_contextualization);
      const withoutContext = allClinics.filter(c => !c.has_contextualization);
      
      console.log(`✅ Com contextualização: ${withContext.length}`);
      console.log(`❌ Sem contextualização: ${withoutContext.length}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar clínicas:', error);
  }
}

checkClinics();
