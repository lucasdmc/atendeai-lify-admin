import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeUserProfilesFix() {
  console.log('🔧 Executando correção da tabela user_profiles...');
  
  try {
    // Chamar a Edge Function de correção
    const { data, error } = await supabase.functions.invoke('fix-user-profiles');
    
    if (error) {
      console.error('❌ Erro ao executar correção:', error);
      
      // Tentar correção manual via SQL
      console.log('🔄 Tentando correção manual...');
      
      const sqlCommands = [
        'ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;',
        'DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;',
        'DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;',
        'DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;',
        'DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.user_profiles;',
        'DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_profiles;',
        'DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.user_profiles;',
        'DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.user_profiles;',
        'DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.user_profiles;',
        'DROP POLICY IF EXISTS "Admin Lify can manage all profiles" ON public.user_profiles;',
        'DROP POLICY IF EXISTS "user_profiles_simple_policy" ON public.user_profiles;',
        'DROP POLICY IF EXISTS "user_profiles_policy" ON public.user_profiles;',
        `CREATE POLICY "user_profiles_read_policy" ON public.user_profiles
           FOR SELECT USING (auth.role() = 'authenticated');`,
        `CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
           FOR INSERT WITH CHECK (auth.role() = 'authenticated');`,
        `CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
           FOR UPDATE USING (auth.uid() = user_id);`,
        `CREATE POLICY "user_profiles_delete_policy" ON public.user_profiles
           FOR DELETE USING (auth.uid() = user_id);`,
        'ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;'
      ];
      
      for (const sql of sqlCommands) {
        const { error: sqlError } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (sqlError) {
          console.log(`⚠️ Erro ao executar: ${sql.substring(0, 50)}...`);
        }
      }
      
    } else {
      console.log('✅ Correção executada com sucesso:', data);
    }
    
    // Testar se a correção funcionou
    console.log('🧪 Testando acesso à tabela...');
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.error('❌ Erro no teste:', testError);
      return false;
    } else {
      console.log('✅ Tabela user_profiles acessível!');
      console.log(`📊 Registros encontrados: ${testData?.length || 0}`);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

// Executar a correção
executeUserProfilesFix().then(success => {
  if (success) {
    console.log('🎉 Correção da tabela user_profiles concluída com sucesso!');
    console.log('✅ Agora você pode testar o QR Code sem erros 500.');
  } else {
    console.log('❌ Falha na correção. Execute manualmente no Supabase Dashboard.');
  }
}); 