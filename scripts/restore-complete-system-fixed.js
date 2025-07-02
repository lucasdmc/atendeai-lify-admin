import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function restoreCompleteSystemFixed() {
  console.log('🔧 Restaurando sistema completo (versão corrigida)...')
  
  try {
    // 1. Criar usuário principal
    console.log('\n1️⃣ Criando usuário principal...')
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'lucasdmc@lify.com',
      password: 'lify@1234',
      options: {
        data: {
          role: 'admin_lify'
        }
      }
    })
    
    let userId = null
    
    if (signupError) {
      console.error('❌ Erro ao criar usuário:', signupError)
      
      // Se o usuário já existe, tentar fazer login
      console.log('🔄 Tentando fazer login com usuário existente...')
      const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
        email: 'lucasdmc@lify.com',
        password: 'lify@1234'
      })
      
      if (signinError) {
        console.error('❌ Erro ao fazer login:', signinError)
        return
      } else {
        console.log('✅ Login realizado com sucesso')
        console.log(`   Usuário: ${signinData.user.email} (${signinData.user.id})`)
        userId = signinData.user.id
      }
    } else {
      console.log('✅ Usuário criado com sucesso')
      console.log(`   Usuário: ${signupData.user.email} (${signupData.user.id})`)
      userId = signupData.user.id
    }
    
    if (!userId) {
      console.error('❌ Nenhum usuário ID obtido')
      return
    }
    
    console.log(`👤 Usuário ID: ${userId}`)
    
    // 2. Criar perfil do usuário
    console.log('\n2️⃣ Criando perfil do usuário...')
    
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        email: 'lucasdmc@lify.com',
        role: 'admin_lify'
      })
    
    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError)
    } else {
      console.log('✅ Perfil criado com sucesso')
    }
    
    // 3. Criar dados de exemplo para clínicas
    console.log('\n3️⃣ Criando dados de exemplo para clínicas...')
    
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .insert([
        {
          name: 'Clínica Exemplo 1',
          address: 'Rua das Flores, 123 - São Paulo, SP',
          phone: '(11) 99999-9999',
          email: 'contato@clinicaexemplo1.com',
          created_by: userId
        },
        {
          name: 'Clínica Exemplo 2',
          address: 'Av. Paulista, 456 - São Paulo, SP',
          phone: '(11) 88888-8888',
          email: 'contato@clinicaexemplo2.com',
          created_by: userId
        }
      ])
      .select()
    
    if (clinicsError) {
      console.error('❌ Erro ao criar clínicas:', clinicsError)
    } else {
      console.log(`✅ ${clinics?.length || 0} clínicas criadas com sucesso`)
    }
    
    // 4. Criar dados de exemplo para usuários
    console.log('\n4️⃣ Criando dados de exemplo para usuários...')
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .insert([
        {
          email: 'medico1@exemplo.com',
          name: 'Dr. João Silva',
          role: 'doctor',
          clinic_id: clinics?.[0]?.id,
          created_by: userId
        },
        {
          email: 'medico2@exemplo.com',
          name: 'Dra. Maria Santos',
          role: 'doctor',
          clinic_id: clinics?.[0]?.id,
          created_by: userId
        },
        {
          email: 'admin@exemplo.com',
          name: 'Administrador',
          role: 'admin',
          clinic_id: clinics?.[0]?.id,
          created_by: userId
        }
      ])
      .select()
    
    if (usersError) {
      console.error('❌ Erro ao criar usuários:', usersError)
    } else {
      console.log(`✅ ${users?.length || 0} usuários criados com sucesso`)
    }
    
    // 5. Criar dados de exemplo para conversas
    console.log('\n5️⃣ Criando dados de exemplo para conversas...')
    
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .insert([
        {
          patient_name: 'João da Silva',
          patient_phone: '+5511999999999',
          clinic_id: clinics?.[0]?.id,
          status: 'active',
          created_by: userId
        },
        {
          patient_name: 'Maria Santos',
          patient_phone: '+5511888888888',
          clinic_id: clinics?.[0]?.id,
          status: 'active',
          created_by: userId
        }
      ])
      .select()
    
    if (conversationsError) {
      console.error('❌ Erro ao criar conversas:', conversationsError)
    } else {
      console.log(`✅ ${conversations?.length || 0} conversas criadas com sucesso`)
    }
    
    // 6. Criar dados de exemplo para mensagens
    console.log('\n6️⃣ Criando dados de exemplo para mensagens...')
    
    if (conversations && conversations.length > 0) {
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversations[0].id,
            content: 'Olá, gostaria de agendar uma consulta.',
            sender_type: 'patient',
            created_by: userId
          },
          {
            conversation_id: conversations[0].id,
            content: 'Claro! Qual especialidade você precisa?',
            sender_type: 'system',
            created_by: userId
          },
          {
            conversation_id: conversations[1].id,
            content: 'Bom dia, preciso de informações sobre horários.',
            sender_type: 'patient',
            created_by: userId
          }
        ])
        .select()
      
      if (messagesError) {
        console.error('❌ Erro ao criar mensagens:', messagesError)
      } else {
        console.log(`✅ ${messages?.length || 0} mensagens criadas com sucesso`)
      }
    }
    
    // 7. Criar dados de exemplo para agendamentos
    console.log('\n7️⃣ Criando dados de exemplo para agendamentos...')
    
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .insert([
        {
          patient_name: 'João da Silva',
          patient_phone: '+5511999999999',
          doctor_name: 'Dr. João Silva',
          clinic_id: clinics?.[0]?.id,
          appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Amanhã
          appointment_time: '14:00',
          status: 'scheduled',
          created_by: userId
        },
        {
          patient_name: 'Maria Santos',
          patient_phone: '+5511888888888',
          doctor_name: 'Dra. Maria Santos',
          clinic_id: clinics?.[0]?.id,
          appointment_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Depois de amanhã
          appointment_time: '10:00',
          status: 'scheduled',
          created_by: userId
        }
      ])
      .select()
    
    if (appointmentsError) {
      console.error('❌ Erro ao criar agendamentos:', appointmentsError)
    } else {
      console.log(`✅ ${appointments?.length || 0} agendamentos criados com sucesso`)
    }
    
    // 8. Verificar estado final
    console.log('\n8️⃣ Verificando estado final...')
    
    const { data: { session } } = await supabase.auth.getSession()
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    console.log('🔍 Estado final:')
    console.log(`   - Sessão ativa: ${!!session}`)
    console.log(`   - Perfil criado: ${!!profile}`)
    console.log(`   - Role: ${profile?.role || 'não definido'}`)
    console.log(`   - Clínicas: ${clinics?.length || 0}`)
    console.log(`   - Usuários: ${users?.length || 0}`)
    console.log(`   - Conversas: ${conversations?.length || 0}`)
    console.log(`   - Agendamentos: ${appointments?.length || 0}`)
    
    // 9. Instruções finais
    console.log('\n9️⃣ Sistema restaurado com sucesso!')
    console.log('📋 Próximos passos:')
    console.log('   1. Vá para http://localhost:8080')
    console.log('   2. Faça login com: lucasdmc@lify.com / lify@1234')
    console.log('   3. Teste todas as funcionalidades:')
    console.log('      - Dashboard')
    console.log('      - Conversas')
    console.log('      - Agendamentos')
    console.log('      - Clínicas')
    console.log('      - Gestão de Usuários')
    console.log('   4. Conecte Google Calendar se necessário')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

restoreCompleteSystemFixed() 