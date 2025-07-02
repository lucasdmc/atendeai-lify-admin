import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Usar as variáveis de ambiente corretas
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env');
  console.log('💡 Adicione a chave service_role do Supabase no arquivo .env:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyDisconnectFix() {
  console.log('🔧 Aplicando correção para desconexão de calendários...');

  try {
    // 1. Criar a função SQL
    console.log('📝 Criando função disconnect_user_calendars...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION disconnect_user_calendars(user_id UUID)
      RETURNS VOID
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- Primeiro, deleta os logs de sincronização relacionados aos calendários do usuário
        DELETE FROM calendar_sync_logs 
        WHERE user_calendar_id IN (
          SELECT id FROM user_calendars WHERE user_id = disconnect_user_calendars.user_id
        );
        
        -- Depois, deleta os calendários do usuário
        DELETE FROM user_calendars WHERE user_id = disconnect_user_calendars.user_id;
        
        -- Por fim, deleta os tokens do usuário
        DELETE FROM google_calendar_tokens WHERE user_id = disconnect_user_calendars.user_id;
      END;
      $$;
    `;

    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: createFunctionSQL
    });

    if (functionError) {
      console.error('❌ Erro ao criar função:', functionError);
      return;
    }

    console.log('✅ Função disconnect_user_calendars criada com sucesso');

    // 2. Criar políticas de segurança
    console.log('🔒 Criando políticas de segurança...');
    
    const policies = [
      {
        name: 'Users can delete their own calendars',
        table: 'user_calendars',
        policy: `CREATE POLICY "Users can delete their own calendars" ON user_calendars FOR DELETE USING (auth.uid() = user_id);`
      },
      {
        name: 'Users can delete their own tokens',
        table: 'google_calendar_tokens',
        policy: `CREATE POLICY "Users can delete their own tokens" ON google_calendar_tokens FOR DELETE USING (auth.uid() = user_id);`
      },
      {
        name: 'Users can delete their own sync logs',
        table: 'calendar_sync_logs',
        policy: `CREATE POLICY "Users can delete their own sync logs" ON calendar_sync_logs FOR DELETE USING (user_calendar_id IN (SELECT id FROM user_calendars WHERE user_id = auth.uid()));`
      }
    ];

    for (const policy of policies) {
      console.log(`📋 Aplicando política: ${policy.name}`);
      
      // Primeiro remove a política se existir
      const dropQuery = `DROP POLICY IF EXISTS "${policy.name}" ON ${policy.table};`;
      await supabase.rpc('exec_sql', { sql: dropQuery });
      
      // Depois cria a nova política
      const { error } = await supabase.rpc('exec_sql', { sql: policy.policy });
      if (error) {
        console.error(`❌ Erro ao criar política ${policy.name}:`, error);
      } else {
        console.log(`✅ Política ${policy.name} criada com sucesso`);
      }
    }

    // 3. Habilitar RLS nas tabelas
    console.log('🔐 Habilitando Row Level Security...');
    
    const tables = ['user_calendars', 'google_calendar_tokens', 'calendar_sync_logs'];
    
    for (const table of tables) {
      const rlsQuery = `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`;
      const { error } = await supabase.rpc('exec_sql', { sql: rlsQuery });
      if (error) {
        console.error(`❌ Erro ao habilitar RLS em ${table}:`, error);
      } else {
        console.log(`✅ RLS habilitado em ${table}`);
      }
    }

    // 4. Verificar se a função foi criada
    console.log('🔍 Verificando função criada...');
    
    const checkQuery = `
      SELECT 
        'Function created successfully' as status,
        proname as function_name
      FROM pg_proc 
      WHERE proname = 'disconnect_user_calendars';
    `;
    
    const { data: checkData, error: checkError } = await supabase.rpc('exec_sql', { sql: checkQuery });
    
    if (checkError) {
      console.error('❌ Erro ao verificar função:', checkError);
    } else {
      console.log('✅ Função verificada:', checkData);
    }

    console.log('🎉 Correção aplicada com sucesso!');
    console.log('📋 Próximos passos:');
    console.log('   1. Teste o botão "Desconectar calendários" no frontend');
    console.log('   2. Verifique se não há mais erros de chave estrangeira');
    console.log('   3. Confirme que os calendários são removidos corretamente');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

applyDisconnectFix(); 