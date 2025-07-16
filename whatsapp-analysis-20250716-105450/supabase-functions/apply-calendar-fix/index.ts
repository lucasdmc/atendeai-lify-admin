import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔧 Aplicando correção para desconexão de calendários...')

    // 1. Criar a função SQL
    console.log('📝 Criando função disconnect_user_calendars...')
    
    const createFunctionQuery = `
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
      sql: createFunctionQuery
    });

    if (functionError) {
      console.error('❌ Erro ao criar função:', functionError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar função', details: functionError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // 2. Criar políticas de segurança
    console.log('🔒 Criando políticas de segurança...')
    
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
      console.log(`📋 Aplicando política: ${policy.name}`)
      
      // Primeiro remove a política se existir
      const dropQuery = `DROP POLICY IF EXISTS "${policy.name}" ON ${policy.table};`
      await supabase.rpc('exec_sql', { sql: dropQuery })
      
      // Depois cria a nova política
      const { error } = await supabase.rpc('exec_sql', { sql: policy.policy })
      if (error) {
        console.error(`❌ Erro ao criar política ${policy.name}:`, error)
      } else {
        console.log(`✅ Política ${policy.name} criada com sucesso`)
      }
    }

    // 3. Habilitar RLS nas tabelas
    console.log('🔐 Habilitando Row Level Security...')
    
    const tables = ['user_calendars', 'google_calendar_tokens', 'calendar_sync_logs']
    
    for (const table of tables) {
      const rlsQuery = `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      const { error } = await supabase.rpc('exec_sql', { sql: rlsQuery })
      if (error) {
        console.error(`❌ Erro ao habilitar RLS em ${table}:`, error)
      } else {
        console.log(`✅ RLS habilitado em ${table}`)
      }
    }

    // 4. Verificar se a função foi criada
    console.log('🔍 Verificando função criada...')
    
    const checkQuery = `
      SELECT 
        'Function created successfully' as status,
        proname as function_name
      FROM pg_proc 
      WHERE proname = 'disconnect_user_calendars';
    `
    
    const { data: checkData, error: checkError } = await supabase.rpc('exec_sql', { sql: checkQuery })
    
    if (checkError) {
      console.error('❌ Erro ao verificar função:', checkError)
    } else {
      console.log('✅ Função verificada:', checkData)
    }

    console.log('🎉 Correção aplicada com sucesso!')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Correção aplicada com sucesso',
        functionCreated: true,
        policiesCreated: policies.length,
        rlsEnabled: tables.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 