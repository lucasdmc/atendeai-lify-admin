import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestMemoryData() {
  console.log('🚀 Inserindo dados de memória de teste...\n');

  try {
    // Dados de teste para conversation_memory
    const testMemoryData = [
      {
        phone_number: '5547999999999',
        user_name: 'João Silva',
        memory_data: {
          name: 'João Silva',
          preferences: {
            language: 'pt-BR',
            timezone: 'America/Sao_Paulo'
          },
          last_interaction: new Date().toISOString()
        }
      },
      {
        phone_number: '5547888888888',
        user_name: 'Maria Santos',
        memory_data: {
          name: 'Maria Santos',
          preferences: {
            language: 'pt-BR',
            timezone: 'America/Sao_Paulo'
          },
          last_interaction: new Date().toISOString()
        }
      },
      {
        phone_number: '5547777777777',
        user_name: 'Pedro Costa',
        memory_data: {
          name: 'Pedro Costa',
          preferences: {
            language: 'pt-BR',
            timezone: 'America/Sao_Paulo'
          },
          last_interaction: new Date().toISOString()
        }
      },
      {
        phone_number: '554730915628',
        user_name: 'Ana Oliveira',
        memory_data: {
          name: 'Ana Oliveira',
          preferences: {
            language: 'pt-BR',
            timezone: 'America/Sao_Paulo'
          },
          last_interaction: new Date().toISOString()
        }
      }
    ];

    for (const memory of testMemoryData) {
      const { data, error } = await supabase
        .from('conversation_memory')
        .upsert({
          phone_number: memory.phone_number,
          user_name: memory.user_name,
          memory_data: memory.memory_data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'phone_number'
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Erro ao inserir memória para ${memory.phone_number}:`, error);
      } else {
        console.log(`✅ Memória inserida para: ${memory.user_name} (${memory.phone_number})`);
      }
    }

    console.log('\n✅ Dados de memória inseridos com sucesso!');
    console.log('👤 Agora os nomes dos usuários aparecerão corretamente na tela de conversas.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

insertTestMemoryData(); 