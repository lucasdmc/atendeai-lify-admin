const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestUser() {
  console.log('🔧 Criando usuário de teste...')
  
  try {
    // Criar usuário de teste
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'teste@lify.com',
      password: 'teste123',
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
        email: 'teste@lify.com',
        password: 'teste123'
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
    }
    
    console.log('\n📋 Credenciais de teste:')
    console.log('   Email: teste@lify.com')
    console.log('   Senha: teste123')
    console.log('\n🌐 Acesse: http://localhost:8080/auth')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

createTestUser() 