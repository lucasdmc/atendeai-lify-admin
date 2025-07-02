import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupMinimalSystem() {
  console.log('🔧 Configurando sistema mínimo...')
  
  try {
    // 1. Verificar se o usuário existe
    console.log('\n1️⃣ Verificando usuário principal...')
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Erro ao verificar sessão:', sessionError)
    } else if (session) {
      console.log('✅ Sessão ativa encontrada')
      console.log(`   Usuário: ${session.user.email} (${session.user.id})`)
    } else {
      console.log('❌ Nenhuma sessão ativa')
      console.log('💡 Faça login no frontend primeiro')
      return
    }
    
    // 2. Verificar perfil do usuário
    console.log('\n2️⃣ Verificando perfil do usuário...')
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError)
      console.log('💡 Execute o SQL manual no Supabase Dashboard para criar o perfil')
    } else if (profile) {
      console.log('✅ Perfil encontrado')
      console.log(`   Email: ${profile.email}`)
      console.log(`   Role: ${profile.role}`)
    } else {
      console.log('❌ Perfil não encontrado')
      console.log('💡 Execute o SQL manual no Supabase Dashboard para criar o perfil')
    }
    
    // 3. Verificar estrutura do banco
    console.log('\n3️⃣ Verificando estrutura do banco...')
    
    const tables = ['clinics', 'users', 'conversations', 'messages', 'appointments', 'calendar_sync_logs', 'calendar_events']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error && error.code === '42P01') {
          console.log(`❌ Tabela ${table} não existe`)
        } else if (error) {
          console.log(`⚠️  Erro ao verificar ${table}:`, error.message)
        } else {
          console.log(`✅ Tabela ${table} existe`)
        }
      } catch (err) {
        console.log(`❌ Erro ao verificar ${table}:`, err.message)
      }
    }
    
    // 4. Instruções finais
    console.log('\n4️⃣ Sistema mínimo configurado!')
    console.log('📋 Status atual:')
    console.log(`   - Usuário: ${session?.user?.email || 'não encontrado'}`)
    console.log(`   - Perfil: ${profile ? 'criado' : 'não encontrado'}`)
    console.log(`   - Tabelas: ${tables.length} verificadas`)
    console.log('')
    console.log('💡 Para completar a configuração:')
    console.log('   1. Execute o SQL no Supabase Dashboard se necessário')
    console.log('   2. Vá para http://localhost:8080')
    console.log('   3. Faça login com: lucasdmc@lify.com / lify@1234')
    console.log('   4. Teste as funcionalidades básicas')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

setupMinimalSystem() 