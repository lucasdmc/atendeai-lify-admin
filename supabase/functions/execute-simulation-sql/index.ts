import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🚀 Verificando estrutura atual da tabela clinics...')

    // Primeiro, vamos verificar se a coluna já existe
    const { data: checkData, error: checkError } = await supabase
      .from('clinics')
      .select('*')
      .limit(1)

    if (checkError) {
      console.error('❌ Erro ao verificar tabela clinics:', checkError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao verificar tabela clinics',
          details: checkError 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log('✅ Tabela clinics existe e está acessível')

    // Verificar se a coluna simulation_mode já existe
    const { data: columnCheck, error: columnError } = await supabase
      .from('clinics')
      .select('simulation_mode')
      .limit(1)

    if (columnError && columnError.message.includes('column "simulation_mode" does not exist')) {
      console.log('📝 Coluna simulation_mode não existe.')
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Coluna simulation_mode não existe',
          message: 'Para adicionar a coluna simulation_mode, execute o seguinte SQL no Supabase Dashboard:',
          sql: `
            -- Adicionar campo simulation_mode na tabela clinics
            ALTER TABLE clinics
            ADD COLUMN IF NOT EXISTS simulation_mode BOOLEAN DEFAULT FALSE;

            -- Adicionar comentário para documentação
            COMMENT ON COLUMN clinics.simulation_mode IS 'Controla se o chatbot está em modo simulação (true) ou produção (false)';

            -- Criar índice para busca por modo de simulação
            CREATE INDEX IF NOT EXISTS idx_clinics_simulation_mode ON clinics(simulation_mode);
          `,
          dashboard_url: 'https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi/sql/new'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
      
    } else if (columnError) {
      console.error('❌ Erro ao verificar coluna simulation_mode:', columnError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao verificar coluna simulation_mode',
          details: columnError 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    } else {
      console.log('✅ Coluna simulation_mode já existe!')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Coluna simulation_mode já existe!',
          data: columnCheck 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}) 