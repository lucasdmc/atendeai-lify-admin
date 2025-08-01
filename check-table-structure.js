import { createClient } from '@supabase/supabase-js';

// Configuração real do Supabase
const SUPABASE_URL = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTableStructure() {
  console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA');
  console.log('===================================\n');

  try {
    // Tentar buscar dados da tabela
    const { data, error } = await supabase
      .from('contextualization_data')
      .select('*')
      .limit(5);

    if (error) {
      console.log(`❌ Erro ao acessar tabela: ${error.message}`);
      console.log('🔍 Detalhes do erro:', error);
    } else {
      console.log(`✅ Tabela acessível`);
      console.log(`📊 Dados encontrados: ${data?.length || 0} registros`);
      
      if (data && data.length > 0) {
        console.log('\n📋 Estrutura do primeiro registro:');
        const firstRecord = data[0];
        Object.keys(firstRecord).forEach(key => {
          console.log(`   ${key}: ${typeof firstRecord[key]} = ${JSON.stringify(firstRecord[key]).substring(0, 50)}...`);
        });
      }
    }

    // Tentar inserir um registro de teste
    console.log('\n🧪 Testando inserção...');
    const { data: insertData, error: insertError } = await supabase
      .from('contextualization_data')
      .insert({
        title: 'Teste de Estrutura',
        content: 'Conteúdo de teste',
        category: 'teste',
        tags: ['teste']
      })
      .select();

    if (insertError) {
      console.log(`❌ Erro na inserção: ${insertError.message}`);
    } else {
      console.log(`✅ Inserção bem-sucedida: ${insertData?.length || 0} registros`);
      
      // Remover o registro de teste
      if (insertData && insertData.length > 0) {
        const { error: deleteError } = await supabase
          .from('contextualization_data')
          .delete()
          .eq('id', insertData[0].id);
        
        if (deleteError) {
          console.log(`⚠️ Erro ao remover teste: ${deleteError.message}`);
        } else {
          console.log('✅ Registro de teste removido');
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar verificação
checkTableStructure(); 