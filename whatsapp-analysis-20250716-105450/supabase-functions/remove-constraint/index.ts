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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    
    console.log('[Edge] Supabase URL:', supabaseUrl);
    console.log('[Edge] Service Role Key exists:', !!serviceRoleKey);
    
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    })

    console.log('[Edge] Removendo foreign key constraint...');
    
    // Tentar remover a constraint diretamente
    const { error: dropError } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .limit(1); // Apenas para testar a conexão

    if (dropError) {
      console.error('[Edge] Erro ao conectar:', dropError);
      return new Response(
        JSON.stringify({ error: 'Erro de conexão', details: dropError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[Edge] Conexão OK, mas não conseguimos remover constraint via Edge Function');
    console.log('[Edge] Você precisa remover manualmente no painel do Supabase');

    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Remova manualmente a constraint user_profiles_user_id_fkey no painel do Supabase' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[Edge] Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 