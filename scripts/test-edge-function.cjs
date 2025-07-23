const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEdgeFunction() {
  console.log('🔧 Testando Edge Function do Google OAuth...')
  
  try {
    // 1. Fazer login primeiro
    console.log('\n1️⃣ Fazendo login...')
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: 'demo@lify.com',
      password: 'demo123'
    })
    
    if (signinError) {
      console.error('❌ Erro no login:', signinError)
      return
    }
    
    console.log('✅ Login realizado')
    
    // 2. Testar Edge Function com dados simulados
    console.log('\n2️⃣ Testando Edge Function...')
    
    const testData = {
      code: 'test_code_123',
      redirectUri: 'http://localhost:8080/agendamentos'
    }
    
    const { data: edgeResult, error: edgeError } = await supabase.functions.invoke('google-user-auth', {
      body: testData
    })
    
    if (edgeError) {
      console.error('❌ Erro na Edge Function:', edgeError)
      
      // Verificar se é erro de configuração
      if (edgeError.message.includes('credentials not configured')) {
        console.log('💡 Problema: Credenciais do Google OAuth não configuradas')
        console.log('🔧 Solução: Configure as variáveis de ambiente no Supabase')
        console.log('   - GOOGLE_CLIENT_ID')
        console.log('   - GOOGLE_CLIENT_SECRET')
      }
      
      return
    }
    
    console.log('✅ Edge Function funcionando')
    console.log('Resultado:', edgeResult)
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testEdgeFunction() 