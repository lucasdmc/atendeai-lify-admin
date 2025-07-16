import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Criar tabela user_calendars usando SQL direto
    const { error: createTableError } = await supabaseClient
      .from('user_calendars')
      .select('id')
      .limit(1)

    if (createTableError && createTableError.code === '42P01') {
      // Tabela não existe, vamos criar
      console.log('Creating user_calendars table...')
      
      // Como não podemos executar DDL via Supabase client, vamos retornar instruções
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Tabela user_calendars não existe. Execute o seguinte SQL no Supabase Dashboard:',
          sql: `
            CREATE TABLE IF NOT EXISTS user_calendars (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              google_calendar_id TEXT NOT NULL,
              access_token TEXT NOT NULL,
              refresh_token TEXT,
              expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
              calendar_name TEXT,
              calendar_color TEXT,
              is_primary BOOLEAN DEFAULT false,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(user_id, google_calendar_id)
            );
            
            CREATE INDEX IF NOT EXISTS idx_user_calendars_user_id ON user_calendars(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_calendars_google_calendar_id ON user_calendars(google_calendar_id);
            
            ALTER TABLE user_calendars ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY IF NOT EXISTS "Users can view their own calendars" ON user_calendars
              FOR SELECT USING (auth.uid() = user_id);
            
            CREATE POLICY IF NOT EXISTS "Users can insert their own calendars" ON user_calendars
              FOR INSERT WITH CHECK (auth.uid() = user_id);
            
            CREATE POLICY IF NOT EXISTS "Users can update their own calendars" ON user_calendars
              FOR UPDATE USING (auth.uid() = user_id);
            
            CREATE POLICY IF NOT EXISTS "Users can delete their own calendars" ON user_calendars
              FOR DELETE USING (auth.uid() = user_id);
          `
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Verificar se a tabela calendar_sync_logs existe
    const { error: logsTableError } = await supabaseClient
      .from('calendar_sync_logs')
      .select('id')
      .limit(1)

    if (logsTableError && logsTableError.code === '42P01') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Tabela calendar_sync_logs não existe. Execute o seguinte SQL no Supabase Dashboard:',
          sql: `
            CREATE TABLE IF NOT EXISTS calendar_sync_logs (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_calendar_id UUID REFERENCES user_calendars(id) ON DELETE CASCADE,
              sync_type TEXT NOT NULL,
              event_id TEXT,
              status TEXT NOT NULL,
              error_message TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            ALTER TABLE calendar_sync_logs ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY IF NOT EXISTS "Users can view their own sync logs" ON calendar_sync_logs
              FOR SELECT USING (
                EXISTS (
                  SELECT 1 FROM user_calendars 
                  WHERE user_calendars.id = calendar_sync_logs.user_calendar_id 
                  AND user_calendars.user_id = auth.uid()
                )
              );
            
            CREATE POLICY IF NOT EXISTS "Users can insert their own sync logs" ON calendar_sync_logs
              FOR INSERT WITH CHECK (
                EXISTS (
                  SELECT 1 FROM user_calendars 
                  WHERE user_calendars.id = calendar_sync_logs.user_calendar_id 
                  AND user_calendars.user_id = auth.uid()
                )
              );
          `
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Tables already exist' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
}) 