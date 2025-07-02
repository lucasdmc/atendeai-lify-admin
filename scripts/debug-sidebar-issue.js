import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugSidebarIssue() {
  console.log('🔍 Debugando problema do sidebar...')
  
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
    
    // 2. Verificar perfil usando user_id (correto)
    console.log('\n2️⃣ Verificando perfil usando user_id...')
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError)
      
      // Tentar buscar usando id (incorreto, mas para debug)
      console.log('\n🔄 Tentando buscar usando id (incorreto)...')
      const { data: profileWrong, error: profileWrongError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileWrongError) {
        console.error('❌ Também não encontrou usando id:', profileWrongError)
      } else {
        console.log('⚠️  Encontrou usando id (incorreto):', profileWrong)
      }
      
      return
    }
    
    console.log('✅ Perfil encontrado usando user_id!')
    console.log(`   Email: ${profile.email}`)
    console.log(`   Role: ${profile.role}`)
    console.log(`   User ID: ${profile.user_id}`)
    console.log(`   Criado em: ${profile.created_at}`)
    
    // 3. Simular lógica do sidebar
    console.log('\n3️⃣ Simulando lógica do sidebar...')
    
    const isAdminLify = profile.role === 'admin_lify'
    console.log(`   É admin_lify: ${isAdminLify}`)
    
    if (isAdminLify) {
      const allPermissions = [
        'dashboard',
        'conversas',
        'conectar_whatsapp',
        'agentes',
        'agendamentos',
        'clinicas',
        'criar_clinicas',
        'deletar_clinicas',
        'contextualizar',
        'gestao_usuarios',
        'configuracoes'
      ]
      console.log('   Permissões admin_lify:', allPermissions)
      console.log('   Total de itens no menu:', allPermissions.length)
    } else {
      console.log('   Role não é admin_lify - precisa de permissões específicas')
    }
    
    // 4. Verificar estrutura da tabela
    console.log('\n4️⃣ Verificando estrutura da tabela user_profiles...')
    
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('user_profiles')
      .select('*')
    
    if (allProfilesError) {
      console.error('❌ Erro ao buscar todos os perfis:', allProfilesError)
    } else {
      console.log(`   Total de perfis na tabela: ${allProfiles?.length || 0}`)
      if (allProfiles && allProfiles.length > 0) {
        allProfiles.forEach((p, index) => {
          console.log(`   ${index + 1}. ${p.email} - Role: ${p.role} - User ID: ${p.user_id}`)
        })
      }
    }
    
    // 5. Resumo e recomendações
    console.log('\n5️⃣ Resumo do debug:')
    
    if (profile && profile.role === 'admin_lify') {
      console.log('✅ Perfil admin_lify encontrado corretamente')
      console.log('💡 O sidebar deve funcionar após recarregar a página')
      console.log('')
      console.log('🔄 Para aplicar a correção:')
      console.log('   1. Recarregue a página do frontend')
      console.log('   2. Verifique se o menu sidebar aparece')
      console.log('   3. Teste a navegação entre as páginas')
    } else {
      console.log('❌ Perfil não encontrado ou role incorreto')
      console.log('💡 Execute o SQL para criar o perfil admin_lify')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugSidebarIssue() 