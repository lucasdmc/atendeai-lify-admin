const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function testLoginAndTokens() {
  console.log('🔧 Testando login e tokens...')
  
  try {
    // 1. Fazer login
    console.log('\n1️⃣ Fazendo login...')
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: 'teste@lify.com',
      password: 'teste123'
    })
    
    if (signinError) {
      console.error('❌ Erro no login:', signinError)
      return
    }
    
    console.log('✅ Login realizado com sucesso')
    console.log('   Usuário:', signinData.user.email)
    console.log('   User ID:', signinData.user.id)
    
    // 2. Verificar sessão
    console.log('\n2️⃣ Verificando sessão...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Erro ao verificar sessão:', sessionError)
      return
    }
    
    if (session) {
      console.log('✅ Sessão ativa confirmada')
    } else {
      console.log('❌ Sessão não encontrada')
      return
    }
    
    // 3. Verificar tokens antes
    console.log('\n3️⃣ Verificando tokens antes...')
    const { data: tokensBefore, error: tokensError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', session.user.id)
    
    if (tokensError) {
      console.error('❌ Erro ao buscar tokens:', tokensError)
      return
    }
    
    console.log(`📊 Tokens antes: ${tokensBefore?.length || 0}`)
    
    // 4. Simular salvamento de token (para teste)
    console.log('\n4️⃣ Simulando salvamento de token...')
    const testToken = {
      user_id: session.user.id,
      access_token: 'test_access_token_' + Date.now(),
      refresh_token: 'test_refresh_token_' + Date.now(),
      expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hora
      scope: 'https://www.googleapis.com/auth/calendar'
    }
    
    const { data: savedToken, error: saveError } = await supabase
      .from('google_calendar_tokens')
      .insert(testToken)
      .select()
      .single()
    
    if (saveError) {
      console.error('❌ Erro ao salvar token:', saveError)
      return
    }
    
    console.log('✅ Token salvo com sucesso')
    console.log('   Token ID:', savedToken.id)
    
    // 5. Verificar tokens depois
    console.log('\n5️⃣ Verificando tokens depois...')
    const { data: tokensAfter, error: tokensAfterError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', session.user.id)
    
    if (tokensAfterError) {
      console.error('❌ Erro ao buscar tokens depois:', tokensAfterError)
      return
    }
    
    console.log(`📊 Tokens depois: ${tokensAfter?.length || 0}`)
    
    if (tokensAfter && tokensAfter.length > 0) {
      tokensAfter.forEach((token, index) => {
        console.log(`🔑 Token ${index + 1}:`, {
          id: token.id,
          access_token_length: token.access_token?.length || 0,
          refresh_token_length: token.refresh_token?.length || 0,
          expires_at: token.expires_at,
          scope: token.scope
        })
      })
    }
    
    console.log('\n✅ Teste concluído com sucesso!')
    console.log('💡 O sistema está funcionando corretamente')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testLoginAndTokens() 