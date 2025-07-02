import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function restoreLucasUser() {
  console.log('🔧 Restaurando usuário original: lucasdmc@lify.com...')
  
  try {
    // 1. Criar usuário lucasdmc@lify.com
    console.log('\n1️⃣ Criando usuário lucasdmc@lify.com...')
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'lucasdmc@lify.com',
      password: 'lify@1234',
      options: {
        data: {
          role: 'admin_lify'
        }
      }
    })
    
    if (signupError) {
      console.error('❌ Erro ao criar usuário:', signupError)
      
      // Se o usuário já existe, tentar fazer login
      console.log('🔄 Tentando fazer login com usuário existente...')
      const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
        email: 'lucasdmc@lify.com',
        password: 'lify@1234'
      })
      
      if (signinError) {
        console.error('❌ Erro ao fazer login:', signinError)
        return
      } else {
        console.log('✅ Login realizado com sucesso')
        console.log(`   Usuário: ${signinData.user.email} (${signinData.user.id})`)
      }
    } else {
      console.log('✅ Usuário criado com sucesso')
      console.log(`   Usuário: ${signupData.user.email} (${signupData.user.id})`)
      
      // Confirmar email (em desenvolvimento, pode não ser necessário)
      if (signupData.user && !signupData.user.email_confirmed_at) {
        console.log('📧 Usuário criado, mas email precisa ser confirmado')
        console.log('💡 Em desenvolvimento, você pode confirmar manualmente no Supabase Dashboard')
      }
    }
    
    // 2. Verificar se a tabela user_profiles existe
    console.log('\n2️⃣ Verificando tabela user_profiles...')
    
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1)
      
      if (profilesError && profilesError.code === '42P01') {
        console.log('⚠️  Tabela user_profiles não existe')
        console.log('💡 Execute o SQL manual no Supabase Dashboard para criar a tabela')
        console.log('📋 SQL necessário:')
        console.log(`
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

-- Confirmar email do usuário
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmed_at = now()
WHERE email = 'lucasdmc@lify.com';

-- Criar perfil para o usuário
INSERT INTO public.user_profiles (user_id, email, role)
SELECT 
  id as user_id,
  email,
  'admin_lify' as role
FROM auth.users 
WHERE email = 'lucasdmc@lify.com'
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = now();
        `)
        
      } else if (profilesError) {
        console.error('❌ Erro ao verificar user_profiles:', profilesError)
      } else {
        console.log('✅ Tabela user_profiles existe')
        
        // Tentar criar o perfil se a tabela existe
        console.log('👤 Criando perfil para lucasdmc@lify.com...')
        
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
              user_id: user.id,
              email: user.email,
              role: 'admin_lify'
            })
          
          if (profileError) {
            console.error('❌ Erro ao criar perfil:', profileError)
          } else {
            console.log('✅ Perfil criado com sucesso')
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar user_profiles:', error)
    }
    
    // 3. Verificar sessão atual
    console.log('\n3️⃣ Verificando sessão atual...')
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Erro ao buscar sessão:', sessionError)
    } else if (session) {
      console.log('✅ Sessão ativa encontrada')
      console.log(`   Usuário: ${session.user.email} (${session.user.id})`)
      console.log(`   Role: ${session.user.user_metadata?.role || 'não definido'}`)
    } else {
      console.log('❌ Nenhuma sessão ativa')
    }
    
    // 4. Instruções finais
    console.log('\n4️⃣ Próximos passos:')
    console.log('✅ Usuário criado: lucasdmc@lify.com / lify@1234')
    console.log('💡 Para acessar o sistema:')
    console.log('   1. Vá para http://localhost:8080')
    console.log('   2. Faça login com: lucasdmc@lify.com / lify@1234')
    console.log('   3. Se necessário, confirme o email no Supabase Dashboard')
    console.log('   4. Teste a navegação para /agendamentos')
    console.log('')
    console.log('🔧 Se a tabela user_profiles não existir:')
    console.log('   1. Acesse https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi')
    console.log('   2. Vá para SQL Editor')
    console.log('   3. Execute o SQL fornecido acima')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

restoreLucasUser() 