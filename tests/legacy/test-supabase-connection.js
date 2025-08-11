import { createClient } from '@supabase/supabase-js';

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...');
  
  // Usar as mesmas credenciais do Railway
  const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('📋 Testando busca simples...');
    
    // Teste 1: Buscar clínica com telefone exato
    const { data: clinic1, error: error1 } = await supabase
      .from('clinics')
      .select('*')
      .eq('whatsapp_phone', '554730915628')
      .single();
    
    console.log('📋 Resultado 1 (sem +):', {
      data: clinic1 ? 'encontrada' : 'não encontrada',
      error: error1?.message || 'nenhum'
    });
    
    // Teste 2: Buscar clínica com telefone com +
    const { data: clinic2, error: error2 } = await supabase
      .from('clinics')
      .select('*')
      .eq('whatsapp_phone', '+554730915628')
      .single();
    
    console.log('📋 Resultado 2 (com +):', {
      data: clinic2 ? 'encontrada' : 'não encontrada',
      error: error2?.message || 'nenhum'
    });
    
    // Teste 3: Buscar qualquer clínica
    const { data: clinics, error: error3 } = await supabase
      .from('clinics')
      .select('*')
      .limit(1);
    
    console.log('📋 Resultado 3 (qualquer clínica):', {
      count: clinics?.length || 0,
      error: error3?.message || 'nenhum'
    });
    
    if (clinics && clinics.length > 0) {
      console.log('📋 Exemplo de clínica:', {
        id: clinics[0].id,
        name: clinics[0].name,
        whatsapp_phone: clinics[0].whatsapp_phone,
        has_contextualization: clinics[0].has_contextualization
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testSupabaseConnection();
