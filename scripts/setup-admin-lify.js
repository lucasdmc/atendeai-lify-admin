import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupAdminLify() {
  console.log('👑 Configurando perfil admin_lify...')
  
  try {
    // 1. Verificar se o usuário existe
    console.log('\n1️⃣ Verificando usuário...')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ Erro ao verificar usuário:', userError)
      console.log('💡 Faça login no frontend primeiro')
      return
    }
    
    if (!user) {
      console.log('❌ Nenhum usuário logado')
      console.log('💡 Faça login no frontend primeiro')
      return
    }
    
    console.log('✅ Usuário encontrado')
    console.log(`   Email: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    
    // 2. Verificar perfil atual
    console.log('\n2️⃣ Verificando perfil atual...')
    
    const { data: currentProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar perfil:', profileError)
    } else if (currentProfile) {
      console.log('📋 Perfil atual:')
      console.log(`   Email: ${currentProfile.email}`)
      console.log(`   Role: ${currentProfile.role}`)
      console.log(`   Criado em: ${currentProfile.created_at}`)
    } else {
      console.log('❌ Perfil não encontrado - será criado')
    }
    
    // 3. Criar/atualizar perfil como admin_lify
    console.log('\n3️⃣ Configurando perfil admin_lify...')
    
    const { data: newProfile, error: upsertError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        email: user.email,
        role: 'admin_lify',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()
    
    if (upsertError) {
      console.error('❌ Erro ao configurar perfil:', upsertError)
      console.log('💡 Execute o SQL manual no Supabase Dashboard')
      return
    }
    
    console.log('✅ Perfil admin_lify configurado com sucesso!')
    console.log(`   Email: ${newProfile.email}`)
    console.log(`   Role: ${newProfile.role}`)
    console.log(`   Atualizado em: ${newProfile.updated_at}`)
    
    // 4. Verificar permissões
    console.log('\n4️⃣ Verificando permissões...')
    
    const tables = ['clinics', 'users', 'conversations', 'messages', 'appointments', 'user_profiles']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error && error.code === '42501') {
          console.log(`❌ Sem permissão para ${table}`)
        } else if (error && error.code === '42P01') {
          console.log(`⚠️  Tabela ${table} não existe`)
        } else if (error) {
          console.log(`⚠️  Erro ao acessar ${table}:`, error.message)
        } else {
          console.log(`✅ Acesso permitido a ${table}`)
        }
      } catch (err) {
        console.log(`❌ Erro ao verificar ${table}:`, err.message)
      }
    }
    
    // 5. Instruções finais
    console.log('\n5️⃣ Configuração completa!')
    console.log('🎉 Seu perfil agora tem role admin_lify')
    console.log('📋 Permissões incluídas:')
    console.log('   - Acesso total a todas as clínicas')
    console.log('   - Gerenciamento de usuários')
    console.log('   - Visualização de todas as conversas')
    console.log('   - Acesso a todos os agendamentos')
    console.log('   - Configurações do sistema')
    console.log('')
    console.log('💡 Próximos passos:')
    console.log('   1. Recarregue a página do frontend')
    console.log('   2. Verifique se todas as funcionalidades estão disponíveis')
    console.log('   3. Teste a criação de clínicas e usuários')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

setupAdminLify() 