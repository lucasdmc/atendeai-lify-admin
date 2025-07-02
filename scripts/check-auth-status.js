import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAuthStatus() {
  console.log('🔍 Verificando status da autenticação após reset do banco...')
  
  try {
    // 1. Verificar se há usuários na tabela auth.users
    console.log('\n1️⃣ Verificando usuários na tabela auth.users...')
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError)
    } else {
      console.log(`👥 Usuários encontrados: ${users?.users?.length || 0}`)
      if (users?.users && users.users.length > 0) {
        users.users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.id}) - Criado em: ${user.created_at}`)
        })
      }
    }
    
    // 2. Verificar se há usuários na tabela user_profiles
    console.log('\n2️⃣ Verificando perfis de usuário...')
    
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5)
    
    if (profilesError) {
      console.error('❌ Erro ao buscar perfis:', profilesError)
    } else {
      console.log(`👤 Perfis encontrados: ${profiles?.length || 0}`)
      if (profiles && profiles.length > 0) {
        profiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.email} (${profile.user_id}) - Role: ${profile.role}`)
        })
      }
    }
    
    // 3. Verificar se há tokens de autenticação
    console.log('\n3️⃣ Verificando tokens de autenticação...')
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Erro ao buscar sessão:', sessionError)
    } else {
      if (session) {
        console.log('✅ Sessão ativa encontrada')
        console.log(`   Usuário: ${session.user.email} (${session.user.id})`)
        console.log(`   Expira em: ${new Date(session.expires_at * 1000).toLocaleString()}`)
      } else {
        console.log('❌ Nenhuma sessão ativa encontrada')
      }
    }
    
    // 4. Verificar se há tokens do Google
    console.log('\n4️⃣ Verificando tokens do Google...')
    
    const { data: googleTokens, error: tokensError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .limit(5)
    
    if (tokensError) {
      console.error('❌ Erro ao buscar tokens do Google:', tokensError)
    } else {
      console.log(`🔑 Tokens do Google encontrados: ${googleTokens?.length || 0}`)
    }
    
    // 5. Recomendações
    console.log('\n5️⃣ Recomendações:')
    
    if ((users?.users?.length || 0) === 0) {
      console.log('⚠️  Nenhum usuário encontrado no banco')
      console.log('💡 Você precisa criar um novo usuário ou restaurar dados de backup')
      console.log('🔧 Opções:')
      console.log('   1. Fazer signup no frontend')
      console.log('   2. Restaurar backup do banco')
      console.log('   3. Criar usuário manualmente via SQL')
    } else if ((profiles?.length || 0) === 0) {
      console.log('⚠️  Usuários existem mas não há perfis')
      console.log('💡 Os perfis de usuário foram perdidos no reset')
      console.log('🔧 Opção: Restaurar backup ou recriar perfis')
    } else {
      console.log('✅ Usuários e perfis encontrados')
      console.log('💡 O problema pode ser com a sessão atual')
      console.log('🔧 Opção: Fazer logout e login novamente')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkAuthStatus() 