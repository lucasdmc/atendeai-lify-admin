const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function createConfirmedUser() {
  console.log('🔧 Criando usuário confirmado...')
  
  try {
    // Tentar diferentes emails
    const testEmails = [
      'admin@lify.com',
      'test@lify.com', 
      'user@lify.com',
      'demo@lify.com'
    ]
    
    let successUser = null
    
    for (const email of testEmails) {
      console.log(`🔄 Tentando login com: ${email}`)
      
      try {
        const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
          email: email,
          password: 'lify@1234'
        })
        
        if (!signinError && signinData.user) {
          console.log(`✅ Login bem-sucedido com: ${email}`)
          successUser = signinData.user
          break
        }
      } catch (error) {
        console.log(`❌ Falha com ${email}: ${error.message}`)
      }
    }
    
    if (!successUser) {
      console.log('\n🔄 Tentando criar novo usuário...')
      
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: 'demo@lify.com',
        password: 'demo123',
        options: {
          data: {
            role: 'admin_lify'
          }
        }
      })
      
      if (signupError) {
        console.error('❌ Erro ao criar usuário:', signupError)
        
        // Tentar login com credenciais simples
        console.log('\n🔄 Tentando login com credenciais simples...')
        const { data: simpleSignin, error: simpleError } = await supabase.auth.signInWithPassword({
          email: 'demo@lify.com',
          password: 'demo123'
        })
        
        if (simpleError) {
          console.error('❌ Erro no login simples:', simpleError)
          return
        } else {
          successUser = simpleSignin.user
        }
      } else {
        successUser = signupData.user
      }
    }
    
    if (successUser) {
      console.log('\n✅ Usuário logado com sucesso!')
      console.log('📋 Credenciais para usar:')
      console.log(`   Email: ${successUser.email}`)
      console.log(`   User ID: ${successUser.id}`)
      console.log('   Senha: demo123 (ou lify@1234)')
      console.log('\n🌐 Acesse: http://localhost:8080/auth')
      
      // Verificar sessão
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log('✅ Sessão ativa confirmada')
      }
    } else {
      console.log('❌ Não foi possível criar ou logar usuário')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

createConfirmedUser() 