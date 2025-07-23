const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugGoogleAuth() {
  console.log('🔍 Debugando autenticação Google...')
  
  try {
    // 1. Verificar se há usuário logado
    console.log('\n1️⃣ Verificando usuário logado...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Erro ao verificar sessão:', sessionError)
      return
    }
    
    if (session) {
      console.log('✅ Usuário logado:', session.user.email)
      console.log('   User ID:', session.user.id)
    } else {
      console.log('❌ Nenhum usuário logado')
      console.log('💡 Faça login primeiro em: http://localhost:8080/auth')
      return
    }
    
    // 2. Verificar tokens existentes
    console.log('\n2️⃣ Verificando tokens existentes...')
    const { data: tokens, error: tokensError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', session.user.id)
    
    if (tokensError) {
      console.error('❌ Erro ao buscar tokens:', tokensError)
      return
    }
    
    console.log(`📊 Tokens encontrados: ${tokens?.length || 0}`)
    
    if (tokens && tokens.length > 0) {
      tokens.forEach((token, index) => {
        console.log(`🔑 Token ${index + 1}:`, {
          id: token.id,
          access_token_length: token.access_token?.length || 0,
          refresh_token_length: token.refresh_token?.length || 0,
          expires_at: token.expires_at,
          token_expired: token.expires_at ? new Date(token.expires_at) <= new Date() : 'N/A',
          scope: token.scope,
          created_at: token.created_at
        })
      })
    } else {
      console.log('❌ Nenhum token encontrado para este usuário')
    }
    
    // 3. Verificar calendários do usuário
    console.log('\n3️⃣ Verificando calendários do usuário...')
    const { data: calendars, error: calendarsError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', session.user.id)
    
    if (calendarsError) {
      console.error('❌ Erro ao buscar calendários:', calendarsError)
      return
    }
    
    console.log(`📅 Calendários encontrados: ${calendars?.length || 0}`)
    
    if (calendars && calendars.length > 0) {
      calendars.forEach((cal, index) => {
        console.log(`📅 Calendário ${index + 1}:`, {
          id: cal.id,
          google_calendar_id: cal.google_calendar_id,
          calendar_name: cal.calendar_name,
          is_primary: cal.is_primary,
          is_active: cal.is_active,
          access_token_length: cal.access_token?.length || 0
        })
      })
    } else {
      console.log('❌ Nenhum calendário conectado')
    }
    
    // 4. Verificar perfil do usuário
    console.log('\n4️⃣ Verificando perfil do usuário...')
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError)
    } else if (profile) {
      console.log('✅ Perfil encontrado:', {
        id: profile.id,
        name: profile.name,
        role: profile.role,
        status: profile.status
      })
    } else {
      console.log('❌ Perfil não encontrado')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugGoogleAuth() 