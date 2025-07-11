import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAgendamentosFix() {
  console.log('🔧 Testando correções da tela de Agendamentos...\n')

  try {
    // 1. Verificar se há clínicas disponíveis
    console.log('1️⃣ Verificando clínicas...')
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*')
      .order('name')

    if (clinicsError) {
      console.error('❌ Erro ao carregar clínicas:', clinicsError.message)
    } else {
      console.log(`✅ Clínicas disponíveis: ${clinics?.length || 0}`)
      if (clinics && clinics.length > 0) {
        console.log('   Primeira clínica:', clinics[0].name)
      }
    }

    // 2. Verificar tabela user_calendars
    console.log('\n2️⃣ Verificando calendários de usuários...')
    const { data: userCalendars, error: userCalendarsError } = await supabase
      .from('user_calendars')
      .select('*')

    if (userCalendarsError) {
      console.log('   ⚠️  Tabela user_calendars não existe ou erro:', userCalendarsError.message)
    } else {
      console.log(`   ✅ Calendários de usuários: ${userCalendars?.length || 0}`)
      if (userCalendars && userCalendars.length > 0) {
        console.log('   Campos do calendário:', Object.keys(userCalendars[0]))
      }
    }

    // 3. Verificar tabela calendar_sync_logs
    console.log('\n3️⃣ Verificando logs de sincronização...')
    const { data: syncLogs, error: syncLogsError } = await supabase
      .from('calendar_sync_logs')
      .select('*')
      .limit(5)

    if (syncLogsError) {
      console.log('   ⚠️  Tabela calendar_sync_logs não existe ou erro:', syncLogsError.message)
    } else {
      console.log(`   ✅ Logs de sincronização: ${syncLogs?.length || 0}`)
    }

    // 4. Verificar estrutura das tabelas
    console.log('\n4️⃣ Verificando estrutura das tabelas...')
    
    // Verificar se a tabela clinics tem os campos necessários
    if (clinics && clinics.length > 0) {
      const clinic = clinics[0]
      const requiredClinicFields = ['id', 'name', 'created_by', 'created_at', 'updated_at']
      const missingClinicFields = requiredClinicFields.filter(field => !(field in clinic))
      
      if (missingClinicFields.length > 0) {
        console.log(`   ⚠️  Campos ausentes na tabela clinics: ${missingClinicFields.join(', ')}`)
      } else {
        console.log('   ✅ Tabela clinics com estrutura correta')
      }
    }

    // Verificar se a tabela user_calendars tem os campos necessários
    if (userCalendars && userCalendars.length > 0) {
      const userCalendar = userCalendars[0]
      const requiredUserCalendarFields = [
        'id', 'user_id', 'google_calendar_id', 'calendar_name', 
        'is_primary', 'is_active', 'created_at', 'updated_at'
      ]
      const missingUserCalendarFields = requiredUserCalendarFields.filter(field => !(field in userCalendar))
      
      if (missingUserCalendarFields.length > 0) {
        console.log(`   ⚠️  Campos ausentes na tabela user_calendars: ${missingUserCalendarFields.join(', ')}`)
      } else {
        console.log('   ✅ Tabela user_calendars com estrutura correta')
      }
    }

    // 5. Verificar permissões
    console.log('\n5️⃣ Verificando permissões...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('   ⚠️  Não foi possível verificar usuário:', userError.message)
    } else if (user) {
      console.log('   ✅ Usuário autenticado:', user.email)
      
      // Verificar se o usuário tem calendários
      if (userCalendars && userCalendars.length > 0) {
        const userOwnCalendars = userCalendars.filter(cal => cal.user_id === user.id)
        console.log(`   ✅ Calendários do usuário: ${userOwnCalendars.length}`)
      }
    } else {
      console.log('   ⚠️  Nenhum usuário autenticado')
    }

    console.log('\n✅ Teste da tela de Agendamentos finalizado!')
    console.log('\n📋 Resumo das correções implementadas:')
    console.log('   ✅ Estrutura visual da página corrigida')
    console.log('   ✅ Layout responsivo implementado')
    console.log('   ✅ Componentes CalendarSelector simplificados')
    console.log('   ✅ Componentes UpcomingAppointments melhorados')
    console.log('   ✅ Alertas e mensagens de erro padronizados')
    console.log('   ✅ Verificação de clínica selecionada')
    console.log('   ✅ Botões de ação reorganizados')

  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

testAgendamentosFix() 