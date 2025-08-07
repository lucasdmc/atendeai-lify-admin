import { createClient } from '@supabase/supabase-js';

async function testSupabaseData() {
  console.log('🔍 Verificando dados do Supabase...');
  
  // Usar as mesmas credenciais do Railway
  const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Buscar a clínica específica
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('whatsapp_phone', '+554730915628')
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar clínica:', error);
      return;
    }
    
    console.log('📋 Dados da clínica:', {
      id: data.id,
      name: data.name,
      whatsapp_phone: data.whatsapp_phone,
      has_contextualization: data.has_contextualization,
      simulation_mode: data.simulation_mode
    });
    
    if (data.contextualization_json) {
      const context = data.contextualization_json;
      console.log('📋 Estrutura do contextualization_json:', Object.keys(context));
      
      if (context.clinica && context.clinica.horario_funcionamento) {
        console.log('📋 Horários de funcionamento:', JSON.stringify(context.clinica.horario_funcionamento, null, 2));
        
        // Verificar se há alguma diferença na estrutura
        const workingHours = context.clinica.horario_funcionamento;
        console.log('📋 Chaves dos horários:', Object.keys(workingHours));
        
        // Verificar se há algum campo extra
        for (const [day, schedule] of Object.entries(workingHours)) {
          console.log(`📋 ${day}:`, schedule);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testSupabaseData();
