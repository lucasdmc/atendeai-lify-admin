import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMemoryRecords() {
  console.log('🔍 VERIFICANDO REGISTROS DE MEMÓRIA');
  console.log('====================================');

  try {
    // Verificar tabela conversation_memory
    console.log('\n1️⃣ Verificando tabela conversation_memory...');
    
    const { data: memoryRecords, error: memoryError } = await supabase
      .from('conversation_memory')
      .select('*')
      .order('created_at', { ascending: false });

    if (memoryError) {
      console.error('❌ Erro ao buscar memória:', memoryError);
    } else {
      console.log(`📊 Encontrados ${memoryRecords?.length || 0} registros de memória:`);
      
      if (memoryRecords && memoryRecords.length > 0) {
        memoryRecords.forEach((record, index) => {
          console.log(`\n📝 Registro ${index + 1}:`);
          console.log(`   ID: ${record.id}`);
          console.log(`   Clinic ID: ${record.clinic_id}`);
          console.log(`   Phone: ${record.phone_number}`);
          console.log(`   Context: ${record.context ? record.context.substring(0, 100) + '...' : 'N/A'}`);
          console.log(`   Created: ${record.created_at}`);
          console.log(`   Updated: ${record.updated_at}`);
        });
      }
    }

    // Verificar estrutura da tabela
    console.log('\n2️⃣ Verificando estrutura da tabela...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'conversation_memory' });

    if (tableError) {
      console.log('ℹ️ Não foi possível obter info da tabela via RPC, tentando alternativa...');
      
      // Tentar deletar com sintaxe correta
      console.log('\n3️⃣ Tentando deletar com sintaxe correta...');
      
      const { error: deleteError } = await supabase
        .from('conversation_memory')
        .delete()
        .not('id', 'is', null); // Deletar todos os registros

      if (deleteError) {
        console.error('❌ Erro ao deletar:', deleteError);
        console.log('\n💡 Tentando método alternativo...');
        
        // Método alternativo: deletar um por um
        if (memoryRecords && memoryRecords.length > 0) {
          console.log(`🗑️ Deletando ${memoryRecords.length} registros um por um...`);
          
          for (const record of memoryRecords) {
            const { error: singleDeleteError } = await supabase
              .from('conversation_memory')
              .delete()
              .eq('id', record.id);
            
            if (singleDeleteError) {
              console.error(`❌ Erro ao deletar registro ${record.id}:`, singleDeleteError);
            } else {
              console.log(`✅ Registro ${record.id} deletado`);
            }
          }
        }
      } else {
        console.log('✅ Todos os registros deletados com sucesso!');
      }
    }

    // Verificar resultado final
    console.log('\n4️⃣ Verificando resultado final...');
    
    const { data: finalMemory, error: finalError } = await supabase
      .from('conversation_memory')
      .select('*');

    if (finalError) {
      console.error('❌ Erro ao verificar resultado:', finalError);
    } else {
      console.log(`📊 Registros restantes: ${finalMemory?.length || 0}`);
      
      if (finalMemory && finalMemory.length > 0) {
        console.log('⚠️ Ainda existem registros!');
        finalMemory.forEach(record => {
          console.log(`   - ID: ${record.id}, Phone: ${record.phone_number}`);
        });
      } else {
        console.log('✅ Todos os registros de memória foram deletados!');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkMemoryRecords(); 