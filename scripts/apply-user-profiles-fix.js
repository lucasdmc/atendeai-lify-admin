import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env')
  console.log('💡 Adicione a chave service_role do Supabase no arquivo .env:')
  console.log('   SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyUserProfilesFix() {
  console.log('🔧 Aplicando correção da tabela user_profiles...')

  try {
    // 1. Criar tabela user_profiles
    console.log('📝 Criando tabela user_profiles...')
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.user_profiles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        UNIQUE(user_id)
      );
      
      -- Índices
      CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
      
      -- RLS
      ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
      
      -- Políticas
      DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
      CREATE POLICY "Users can view own profile" ON public.user_profiles
        FOR SELECT USING (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
      CREATE POLICY "Users can update own profile" ON public.user_profiles
        FOR UPDATE USING (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
      CREATE POLICY "Users can insert own profile" ON public.user_profiles
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    `

    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    })

    if (tableError) {
      console.error('❌ Erro ao criar tabela:', tableError)
      return
    }

    console.log('✅ Tabela user_profiles criada com sucesso')

    // 2. Confirmar email do usuário admin
    console.log('📧 Confirmando email do usuário admin...')
    
    const confirmEmailSQL = `
      UPDATE auth.users 
      SET email_confirmed_at = now(), 
          confirmed_at = now()
      WHERE email = 'admin@teste.com';
    `

    const { error: confirmError } = await supabase.rpc('exec_sql', {
      sql: confirmEmailSQL
    })

    if (confirmError) {
      console.error('❌ Erro ao confirmar email:', confirmError)
    } else {
      console.log('✅ Email confirmado com sucesso')
    }

    // 3. Criar perfil para o usuário admin
    console.log('👤 Criando perfil para o usuário admin...')
    
    const createProfileSQL = `
      INSERT INTO public.user_profiles (user_id, email, role)
      SELECT 
        id as user_id,
        email,
        'admin_lify' as role
      FROM auth.users 
      WHERE email = 'admin@teste.com'
      ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        updated_at = now();
    `

    const { error: profileError } = await supabase.rpc('exec_sql', {
      sql: createProfileSQL
    })

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError)
    } else {
      console.log('✅ Perfil criado com sucesso')
    }

    // 4. Verificar se tudo foi criado corretamente
    console.log('🔍 Verificando configuração...')
    
    const checkSQL = `
      SELECT 
        'user_profiles table created' as status,
        (SELECT COUNT(*) FROM public.user_profiles) as profiles_count,
        (SELECT email FROM auth.users WHERE email = 'admin@teste.com') as admin_email,
        (SELECT email_confirmed_at FROM auth.users WHERE email = 'admin@teste.com') as email_confirmed,
        (SELECT role FROM public.user_profiles WHERE email = 'admin@teste.com') as admin_role;
    `

    const { data: checkData, error: checkError } = await supabase.rpc('exec_sql', {
      sql: checkSQL
    })

    if (checkError) {
      console.error('❌ Erro ao verificar:', checkError)
    } else {
      console.log('✅ Verificação concluída:', checkData)
    }

    console.log('\n🎉 Correção aplicada com sucesso!')
    console.log('📋 Próximos passos:')
    console.log('   1. Vá para http://localhost:8080')
    console.log('   2. Faça login com: admin@teste.com / 123456789')
    console.log('   3. Teste a navegação para /agendamentos')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

applyUserProfilesFix() 