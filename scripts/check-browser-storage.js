import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBrowserStorage() {
  console.log('🧪 Verificando sessão do Supabase...')
  
  try {
    
    // 1. Verificar se há sessão ativa do Supabase
    console.log('\n1️⃣ Verificando sessão do Supabase...')
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Erro ao verificar sessão:', sessionError)
    } else if (session) {
      console.log('⚠️  Sessão ativa encontrada!')
      console.log(`   👤 Usuário: ${session.user.email}`)
      console.log(`   🆔 ID: ${session.user.id}`)
      console.log(`   ⏰ Expira em: ${new Date(session.expires_at * 1000).toLocaleString()}`)
    } else {
      console.log('✅ Nenhuma sessão ativa encontrada')
    }
    
    // 2. Verificar se há usuário autenticado
    console.log('\n2️⃣ Verificando usuário autenticado...')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ Erro ao verificar usuário:', userError)
    } else if (user) {
      console.log('⚠️  Usuário autenticado encontrado!')
      console.log(`   👤 Email: ${user.email}`)
      console.log(`   🆔 ID: ${user.id}`)
    } else {
      console.log('✅ Nenhum usuário autenticado encontrado')
    }
    
    // 3. Recomendações
    console.log('\n3️⃣ Recomendações:')
    
    if (session || user) {
      console.log('❌ Há uma sessão ativa que pode estar causando problemas')
      console.log('💡 Faça logout para limpar a sessão')
    } else {
      console.log('✅ Nenhuma sessão ativa encontrada')
      console.log('💡 O problema pode estar na lógica do frontend')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkBrowserStorage() 