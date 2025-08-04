// Script para verificar a estrutura da tabela conversation_memory
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMemoryTableStructure() {
  console.log('🔍 Verificando estrutura da tabela conversation_memory...');
  
  try {
    // Verificar se a tabela existe
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'conversation_memory')
      .single();

    if (tableError || !tableExists) {
      console.log('❌ Tabela conversation_memory não existe!');
      return;
    }

    console.log('✅ Tabela conversation_memory existe');

    // Verificar estrutura da tabela
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'conversation_memory')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
      return;
    }

    console.log('\n📋 Estrutura da tabela conversation_memory:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    // Verificar dados existentes
    const { data: records, error: recordsError } = await supabase
      .from('conversation_memory')
      .select('*')
      .limit(5);

    if (recordsError) {
      console.error('❌ Erro ao buscar registros:', recordsError);
      return;
    }

    console.log(`\n📊 Registros encontrados: ${records.length}`);
    records.forEach((record, index) => {
      console.log(`\n📝 Registro ${index + 1}:`);
      console.log(`  - ID: ${record.id}`);
      console.log(`  - Phone: ${record.phone_number}`);
      console.log(`  - User Name: ${record.user_name || 'NULL'}`);
      console.log(`  - Last Interaction: ${record.last_interaction}`);
      console.log(`  - Memory Data: ${record.memory_data ? 'Presente' : 'NULL'}`);
    });

    // Verificar se há problemas específicos
    const { data: nullNames, error: nullError } = await supabase
      .from('conversation_memory')
      .select('phone_number, user_name')
      .is('user_name', null);

    if (!nullError && nullNames.length > 0) {
      console.log(`\n⚠️  Registros sem nome: ${nullNames.length}`);
      nullNames.forEach(record => {
        console.log(`  - ${record.phone_number}: sem nome`);
      });
    }

    // Verificar registros com nomes
    const { data: withNames, error: withNamesError } = await supabase
      .from('conversation_memory')
      .select('phone_number, user_name')
      .not('user_name', 'is', null);

    if (!withNamesError && withNames.length > 0) {
      console.log(`\n✅ Registros com nome: ${withNames.length}`);
      withNames.forEach(record => {
        console.log(`  - ${record.phone_number}: ${record.user_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar verificação
checkMemoryTableStructure().then(() => {
  console.log('\n🏁 Verificação concluída!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 