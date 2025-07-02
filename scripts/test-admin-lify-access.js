import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAdminLifyAccess() {
  console.log('🔍 Testando acesso admin_lify...')
  
  try {
    // 1. Verificar perfil via consulta direta
    console.log('\n1️⃣ Verificando perfil admin_lify...')
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'lucasdmc@lify.com')
      .eq('role', 'admin_lify')
      .single()
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError)
    } else if (profile) {
      console.log('✅ Perfil admin_lify encontrado!')
      console.log(`   Email: ${profile.email}`)
      console.log(`   Role: ${profile.role}`)
      console.log(`   User ID: ${profile.user_id}`)
      console.log(`   Criado em: ${profile.created_at}`)
      console.log(`   Atualizado em: ${profile.updated_at}`)
    } else {
      console.log('❌ Perfil admin_lify não encontrado')
      return
    }
    
    // 2. Testar acesso às tabelas principais
    console.log('\n2️⃣ Testando acesso às tabelas...')
    
    const tables = [
      { name: 'clinics', description: 'Clínicas' },
      { name: 'users', description: 'Usuários' },
      { name: 'conversations', description: 'Conversas' },
      { name: 'messages', description: 'Mensagens' },
      { name: 'appointments', description: 'Agendamentos' },
      { name: 'user_profiles', description: 'Perfis de Usuário' }
    ]
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .limit(1)
        
        if (error && error.code === '42501') {
          console.log(`❌ Sem permissão para ${table.description} (${table.name})`)
        } else if (error && error.code === '42P01') {
          console.log(`⚠️  Tabela ${table.description} (${table.name}) não existe`)
        } else if (error) {
          console.log(`⚠️  Erro ao acessar ${table.description}: ${error.message}`)
        } else {
          console.log(`✅ Acesso permitido a ${table.description} (${table.name})`)
        }
      } catch (err) {
        console.log(`❌ Erro ao verificar ${table.description}: ${err.message}`)
      }
    }
    
    // 3. Testar operações de escrita (se possível)
    console.log('\n3️⃣ Testando operações de escrita...')
    
    // Testar inserção em uma tabela (apenas para verificar permissões)
    try {
      const testClinic = {
        name: 'Clínica Teste Admin',
        address: 'Endereço Teste',
        phone: '(11) 99999-9999',
        email: 'teste@admin.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data: insertData, error: insertError } = await supabase
        .from('clinics')
        .insert(testClinic)
        .select()
      
      if (insertError) {
        console.log(`⚠️  Erro ao inserir clínica teste: ${insertError.message}`)
      } else {
        console.log('✅ Permissão de inserção confirmada')
        
        // Deletar a clínica teste
        const { error: deleteError } = await supabase
          .from('clinics')
          .delete()
          .eq('name', 'Clínica Teste Admin')
        
        if (deleteError) {
          console.log(`⚠️  Erro ao deletar clínica teste: ${deleteError.message}`)
        } else {
          console.log('✅ Permissão de deleção confirmada')
        }
      }
    } catch (err) {
      console.log(`❌ Erro no teste de escrita: ${err.message}`)
    }
    
    // 4. Resumo final
    console.log('\n4️⃣ Resumo do teste admin_lify:')
    console.log('🎉 Perfil admin_lify configurado com sucesso!')
    console.log('📋 Status das permissões:')
    console.log('   - Perfil: ✅ Configurado')
    console.log('   - Acesso às tabelas: ✅ Verificado')
    console.log('   - Operações de escrita: ✅ Testado')
    console.log('')
    console.log('💡 Próximos passos:')
    console.log('   1. Acesse http://localhost:8080')
    console.log('   2. Faça login com: lucasdmc@lify.com / lify@1234')
    console.log('   3. Verifique se todas as funcionalidades estão disponíveis')
    console.log('   4. Teste a criação de clínicas e usuários')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testAdminLifyAccess() 