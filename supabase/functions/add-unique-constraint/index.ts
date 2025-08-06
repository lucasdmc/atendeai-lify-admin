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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    
    console.log('[Edge] Supabase URL:', supabaseUrl);
    console.log('[Edge] Service Role Key exists:', !!serviceRoleKey);
    
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey)

    console.log('[Edge] Executando operações na tabela google_calendar_tokens...');

    // 1. Verificar se há registros duplicados
    console.log('[Edge] Verificando duplicatas...');
    
    const { data: allTokens, error: tokensError } = await supabaseClient
      .from('google_calendar_tokens')
      .select('*');

    if (tokensError) {
      console.error('[Edge] Erro ao buscar tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar tokens', details: tokensError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('[Edge] Total de registros encontrados:', allTokens?.length || 0);

    let duplicates = [];
    let finalUserCounts = {};

    if (!allTokens || allTokens.length === 0) {
      console.log('[Edge] Nenhum registro encontrado');
    } else {
      // Agrupar por user_id e identificar duplicatas
      const userCounts = {};
      allTokens.forEach(token => {
        userCounts[token.user_id] = (userCounts[token.user_id] || 0) + 1;
      });

      duplicates = Object.entries(userCounts)
        .filter(([userId, count]) => (count as number) > 1)
        .map(([userId, count]) => ({ userId, count: count as number }));

      console.log('[Edge] Duplicatas encontradas:', duplicates);

      // 2. Corrigir duplicatas se existirem
      if (duplicates.length > 0) {
        console.log('[Edge] Corrigindo duplicatas...');
        
        for (const { userId } of duplicates) {
          // Buscar todos os registros do usuário
          const { data: userTokens } = await supabaseClient
            .from('google_calendar_tokens')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

          if (userTokens && userTokens.length > 1) {
            // Manter apenas o mais recente
            const tokenToKeep = userTokens[0];
            const tokensToDelete = userTokens.slice(1);

            console.log(`[Edge] Mantendo token ${tokenToKeep.id} para usuário ${userId}`);
            console.log(`[Edge] Removendo ${tokensToDelete.length} token(s) duplicado(s)`);

            // Deletar registros duplicados
            for (const token of tokensToDelete) {
              const { error: deleteError } = await supabaseClient
                .from('google_calendar_tokens')
                .delete()
                .eq('id', token.id);

              if (deleteError) {
                console.error(`[Edge] Erro ao deletar token ${token.id}:`, deleteError);
              } else {
                console.log(`[Edge] Token ${token.id} removido`);
              }
            }
          }
        }
      }
    }

    // 3. Tentar adicionar constraint único
    console.log('[Edge] Tentando adicionar constraint único...');
    
    // Como não podemos executar DDL diretamente via Supabase client,
    // vamos verificar se a constraint já existe e informar o usuário
    console.log('[Edge] Para adicionar constraint único, execute este SQL no Supabase Dashboard:');
    console.log('[Edge] ALTER TABLE google_calendar_tokens ADD CONSTRAINT google_calendar_tokens_user_id_unique UNIQUE (user_id);');

    // 4. Verificar resultado final
    const { data: finalTokens, error: finalError } = await supabaseClient
      .from('google_calendar_tokens')
      .select('*');

    if (finalError) {
      console.error('[Edge] Erro ao verificar resultado final:', finalError);
    } else {
      finalUserCounts = {};
      finalTokens.forEach(token => {
        finalUserCounts[token.user_id] = (finalUserCounts[token.user_id] || 0) + 1;
      });

      console.log('[Edge] Resultado final por usuário:', finalUserCounts);
    }

    console.log('[Edge] Operação concluída!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Operação concluída com sucesso',
        total_records: finalTokens?.length || 0,
        duplicates_fixed: duplicates?.length || 0,
        final_user_counts: finalUserCounts,
        next_step: 'Execute este SQL no Supabase Dashboard: ALTER TABLE google_calendar_tokens ADD CONSTRAINT google_calendar_tokens_user_id_unique UNIQUE (user_id);'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('[Edge] Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 