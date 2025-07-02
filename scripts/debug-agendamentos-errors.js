import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugAgendamentosErrors() {
  console.log('🔍 Debugando erros de agendamento...')
  
  const userId = '27caa452-cb0a-432d-b0c5-28bae589ba8c' // ID do lucasdmc@lify.com
  
  try {
    // 1. Verificar estado da autenticação
    console.log('\n1️⃣ Verificando autenticação...')
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Erro na sessão:', sessionError)
    } else if (session) {
      console.log('✅ Sessão ativa:', session.user.email)
    } else {
      console.log('❌ Nenhuma sessão ativa')
    }
    
    // 2. Verificar perfil do usuário
    console.log('\n2️⃣ Verificando perfil do usuário...')
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError)
    } else if (profile) {
      console.log('✅ Perfil encontrado:', {
        email: profile.email,
        role: profile.role,
        created_at: profile.created_at
      })
    } else {
      console.log('❌ Perfil não encontrado')
    }
    
    // 3. Verificar calendários do usuário
    console.log('\n3️⃣ Verificando calendários...')
    
    const { data: calendars, error: calendarsError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', userId)
    
    if (calendarsError) {
      console.error('❌ Erro ao buscar calendários:', calendarsError)
    } else {
      console.log(`📅 Calendários encontrados: ${calendars?.length || 0}`)
      if (calendars && calendars.length > 0) {
        calendars.forEach((cal, index) => {
          console.log(`   ${index + 1}. ${cal.calendar_name} (${cal.google_calendar_id}) - Ativo: ${cal.is_active}`)
        })
      }
    }
    
    // 4. Verificar tokens do Google
    console.log('\n4️⃣ Verificando tokens do Google...')
    
    const { data: tokens, error: tokensError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', userId)
    
    if (tokensError) {
      console.error('❌ Erro ao buscar tokens:', tokensError)
    } else {
      console.log(`🔑 Tokens encontrados: ${tokens?.length || 0}`)
      if (tokens && tokens.length > 0) {
        tokens.forEach((token, index) => {
          const expiresAt = new Date(token.expires_at)
          const isExpired = expiresAt < new Date()
          console.log(`   ${index + 1}. Criado: ${token.created_at} - Expira: ${expiresAt.toLocaleString()} - Expirado: ${isExpired}`)
        })
      }
    }
    
    // 5. Verificar logs de sincronização
    console.log('\n5️⃣ Verificando logs de sincronização...')
    
    const { data: syncLogs, error: logsError } = await supabase
      .from('calendar_sync_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (logsError) {
      console.error('❌ Erro ao buscar logs:', logsError)
    } else {
      console.log(`📋 Logs encontrados: ${syncLogs?.length || 0}`)
      if (syncLogs && syncLogs.length > 0) {
        syncLogs.forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.status} - ${log.message} - ${log.created_at}`)
        })
      }
    }
    
    // 6. Verificar eventos salvos
    console.log('\n6️⃣ Verificando eventos salvos...')
    
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(5)
    
    if (eventsError) {
      console.error('❌ Erro ao buscar eventos:', eventsError)
    } else {
      console.log(`📅 Eventos encontrados: ${events?.length || 0}`)
      if (events && events.length > 0) {
        events.forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.summary} - ${event.start_time}`)
        })
      }
    }
    
    // 7. Análise de problemas
    console.log('\n7️⃣ Análise de problemas...')
    
    const hasValidTokens = tokens && tokens.length > 0 && tokens.some(token => new Date(token.expires_at) > new Date())
    const hasActiveCalendars = calendars && calendars.length > 0 && calendars.some(cal => cal.is_active)
    const hasProfile = !!profile
    const hasSession = !!session
    
    console.log('🔍 Estado atual:')
    console.log(`   - Tem sessão ativa: ${hasSession}`)
    console.log(`   - Tem perfil: ${hasProfile}`)
    console.log(`   - Tem tokens válidos: ${hasValidTokens}`)
    console.log(`   - Tem calendários ativos: ${hasActiveCalendars}`)
    
    // 8. Recomendações
    console.log('\n8️⃣ Recomendações:')
    
    if (!hasSession) {
      console.log('⚠️  Problema: Nenhuma sessão ativa')
      console.log('💡 Solução: Fazer login novamente')
    }
    
    if (!hasProfile) {
      console.log('⚠️  Problema: Perfil não encontrado')
      console.log('💡 Solução: Criar perfil manualmente')
    }
    
    if (!hasValidTokens) {
      console.log('⚠️  Problema: Tokens expirados ou ausentes')
      console.log('💡 Solução: Reconectar Google Calendar')
    }
    
    if (!hasActiveCalendars) {
      console.log('⚠️  Problema: Nenhum calendário ativo')
      console.log('💡 Solução: Ativar calendários ou conectar novos')
    }
    
    if (hasSession && hasProfile && hasValidTokens && hasActiveCalendars) {
      console.log('✅ Estado aparentemente correto')
      console.log('💡 Verificar logs do frontend para erros específicos')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugAgendamentosErrors() 