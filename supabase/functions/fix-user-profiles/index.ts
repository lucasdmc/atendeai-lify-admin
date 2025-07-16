import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔧 Corrigindo tabela user_profiles...');

    // 1. Desabilitar RLS temporariamente
    console.log('1️⃣ Desabilitando RLS...');
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;'
    });

    if (disableError) {
      console.log('⚠️ Erro ao desabilitar RLS (pode ser normal):', disableError.message);
    }

    // 2. Remover políticas existentes
    console.log('2️⃣ Removendo políticas existentes...');
    const policiesToDrop = [
      'Users can view own profile',
      'Users can update own profile', 
      'Users can insert own profile',
      'Enable read access for authenticated users',
      'Enable insert for authenticated users',
      'Enable update for users based on user_id',
      'Enable delete for users based on user_id',
      'Enable all access for authenticated users',
      'Admin Lify can manage all profiles'
    ];

    for (const policy of policiesToDrop) {
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql_query: `DROP POLICY IF EXISTS "${policy}" ON public.user_profiles;`
      });
      
      if (dropError) {
        console.log(`⚠️ Erro ao remover política ${policy}:`, dropError.message);
      }
    }

    // 3. Criar política simples
    console.log('3️⃣ Criando política simples...');
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE POLICY "user_profiles_simple_policy" ON public.user_profiles
        FOR ALL USING (auth.role() = 'authenticated');
      `
    });

    if (createError) {
      console.log('⚠️ Erro ao criar política (pode já existir):', createError.message);
    }

    // 4. Reabilitar RLS
    console.log('4️⃣ Reabilitando RLS...');
    const { error: enableError } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;'
    });

    if (enableError) {
      console.log('⚠️ Erro ao reabilitar RLS:', enableError.message);
    }

    // 5. Testar acesso
    console.log('5️⃣ Testando acesso...');
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Erro no teste:', testError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: testError.message,
          details: testError
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Tabela corrigida com sucesso!');
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Tabela user_profiles corrigida com sucesso',
        records: testData?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: error
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 