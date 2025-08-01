import { createClient } from '@supabase/supabase-js';

// Configuração real do Supabase
const SUPABASE_URL = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAllTables() {
  console.log('🔍 VERIFICANDO TODAS AS TABELAS');
  console.log('=================================\n');

  const tablesToCheck = [
    'contextualization_data',
    'clinics',
    'conversation_memory',
    'user_profiles',
    'whatsapp_conversations',
    'whatsapp_messages'
  ];

  for (const table of tablesToCheck) {
    console.log(`\n📋 Verificando tabela: ${table}`);
    console.log('─'.repeat(50));
    
    try {
      // Tentar buscar dados
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Erro: ${error.message}`);
      } else {
        console.log(`✅ Tabela acessível`);
        console.log(`📊 Registros: ${data?.length || 0}`);
        
        if (data && data.length > 0) {
          console.log('📋 Colunas disponíveis:');
          const columns = Object.keys(data[0]);
          columns.forEach(col => {
            console.log(`   - ${col}: ${typeof data[0][col]}`);
          });
        }
      }
    } catch (err) {
      console.log(`❌ Erro geral: ${err.message}`);
    }
  }

  // Verificar se existe alguma tabela com dados de contextualização
  console.log('\n🔍 PROCURANDO DADOS DE CONTEXTUALIZAÇÃO');
  console.log('─'.repeat(50));
  
  const possibleContextTables = [
    'clinics',
    'clinic_data',
    'context_data',
    'knowledge_base'
  ];

  for (const table of possibleContextTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (!error && data && data.length > 0) {
        console.log(`✅ Encontrada tabela com dados: ${table}`);
        console.log(`📊 Registros: ${data.length}`);
        console.log('📋 Colunas:', Object.keys(data[0]));
      }
    } catch (err) {
      // Tabela não existe, continuar
    }
  }
}

// Executar verificação
checkAllTables(); 