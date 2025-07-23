const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUserAuth() {
  console.log('🔍 Verificando autenticação de usuários...')
  
  try {
    // Verificar se há sessão ativa
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Erro ao verificar sessão:', sessionError)
      return
    }
    
    if (session) {
      console.log('✅ Sessão ativa encontrada:')
      console.log('👤 User ID:', session.user.id)
      console.log('📧 Email:', session.user.email)
      console.log('🕐 Último acesso:', session.user.last_sign_in_at)
    } else {
      console.log('❌ Nenhuma sessão ativa encontrada')
    }
    
    // Verificar usuários na tabela auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.log('⚠️ Não é possível listar usuários (sem permissão admin)')
    } else {
      console.log(`📊 Total de usuários no sistema: ${users?.length || 0}`)
      if (users && users.length > 0) {
        users.slice(0, 3).forEach((user, index) => {
          console.log(`👤 Usuário ${index + 1}:`, {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            last_sign_in: user.last_sign_in_at
          })
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkUserAuth() 