import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function restoreBasicAuth() {
  console.log('🔧 Restaurando estrutura básica de autenticação...')
  
  try {
    // 1. Criar usuário de teste via signup
    console.log('\n1️⃣ Criando usuário de teste...')
    
    const testEmail = 'admin@teste.com'
    const testPassword = '123456789'
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
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
        email: testEmail,
        password: testPassword
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
    
    // 2. Verificar se a tabela user_profiles existe, se não, criar
    console.log('\n2️⃣ Verificando tabela user_profiles...')
    
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1)
      
      if (profilesError && profilesError.code === '42P01') {
        console.log('⚠️  Tabela user_profiles não existe, criando...')
        
        // Criar a tabela via SQL
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
        
        // Como não temos acesso direto ao SQL, vamos criar via Edge Function ou manualmente
        console.log('💡 Tabela user_profiles precisa ser criada manualmente')
        console.log('🔧 Opções:')
        console.log('   1. Executar SQL manualmente no Supabase Dashboard')
        console.log('   2. Usar Edge Function para criar a tabela')
        console.log('   3. Fazer signup no frontend (criará automaticamente)')
        
      } else if (profilesError) {
        console.error('❌ Erro ao verificar user_profiles:', profilesError)
      } else {
        console.log('✅ Tabela user_profiles existe')
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
    console.log('✅ Usuário de teste criado: admin@teste.com / 123456789')
    console.log('💡 Para acessar o sistema:')
    console.log('   1. Vá para http://localhost:8080')
    console.log('   2. Faça login com: admin@teste.com / 123456789')
    console.log('   3. Se necessário, confirme o email no Supabase Dashboard')
    console.log('   4. Teste a navegação para /agendamentos')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

restoreBasicAuth() 