import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCalendarManagement() {
  console.log('🧪 Testando gerenciamento de calendários...')
  
  try {
    // 1. Verificar usuário
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
    
    console.log('✅ Usuário encontrado:', user.email)
    
    // 2. Verificar calendários atuais
    console.log('\n2️⃣ Verificando calendários atuais...')
    
    const { data: userCalendars, error: calendarsError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', user.id)
    
    if (calendarsError) {
      console.error('❌ Erro ao buscar calendários:', calendarsError)
    } else {
      console.log(`📊 Calendários conectados: ${userCalendars?.length || 0}`)
      if (userCalendars && userCalendars.length > 0) {
        userCalendars.forEach((cal, index) => {
          console.log(`   ${index + 1}. ${cal.calendar_name} (${cal.google_calendar_id}) - Ativo: ${cal.is_active}`)
        })
      }
    }
    
    // 3. Verificar tokens
    console.log('\n3️⃣ Verificando tokens...')
    
    const { data: tokens, error: tokensError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', user.id)
    
    if (tokensError) {
      console.error('❌ Erro ao buscar tokens:', tokensError)
    } else {
      console.log(`🔑 Tokens encontrados: ${tokens?.length || 0}`)
      if (tokens && tokens.length > 0) {
        tokens.forEach((token, index) => {
          const expiresAt = new Date(token.expires_at)
          const isExpired = expiresAt < new Date()
          console.log(`   ${index + 1}. Criado em: ${token.created_at} - Expira em: ${expiresAt.toLocaleString()} - Expirado: ${isExpired}`)
        })
      }
    }
    
    // 4. Simular desconexão seletiva
    console.log('\n4️⃣ Simulando desconexão seletiva...')
    
    if (userCalendars && userCalendars.length > 0) {
      const firstCalendar = userCalendars[0]
      console.log(`🔄 Simulando desconexão do calendário: ${firstCalendar.calendar_name}`)
      
      // Simular a lógica de desconexão seletiva
      const calendarIdsToDisconnect = [firstCalendar.google_calendar_id]
      
      console.log('   - Buscando calendários para desconectar...')
      const { data: calendarsToDelete, error: fetchError } = await supabase
        .from('user_calendars')
        .select('id, google_calendar_id, calendar_name')
        .eq('user_id', user.id)
        .in('google_calendar_id', calendarIdsToDisconnect)
      
      if (fetchError) {
        console.error('   ❌ Erro ao buscar calendários:', fetchError)
      } else {
        console.log(`   ✅ Encontrados ${calendarsToDelete?.length || 0} calendários para desconectar`)
        
        if (calendarsToDelete && calendarsToDelete.length > 0) {
          const calendarIdsToDelete = calendarsToDelete.map(cal => cal.id)
          console.log('   - IDs dos calendários para deletar:', calendarIdsToDelete)
          
          // Verificar se há logs de sincronização
          const { data: syncLogs, error: syncLogsError } = await supabase
            .from('calendar_sync_logs')
            .select('*')
            .in('user_calendar_id', calendarIdsToDelete)
          
          if (syncLogsError) {
            console.log('   ⚠️  Erro ao verificar logs de sincronização:', syncLogsError.message)
          } else {
            console.log(`   📝 Logs de sincronização encontrados: ${syncLogs?.length || 0}`)
          }
          
          // Verificar se há eventos de calendário
          try {
            const { data: calendarEvents, error: eventsError } = await supabase
              .from('calendar_events')
              .select('*')
              .in('user_calendar_id', calendarIdsToDelete)
            
            if (eventsError) {
              console.log('   ⚠️  Erro ao verificar eventos:', eventsError.message)
            } else {
              console.log(`   📅 Eventos de calendário encontrados: ${calendarEvents?.length || 0}`)
            }
          } catch (eventsError) {
            console.log('   ℹ️  Tabela calendar_events não existe')
          }
        }
      }
    } else {
      console.log('ℹ️  Nenhum calendário para testar desconexão')
    }
    
    // 5. Resumo das funcionalidades
    console.log('\n5️⃣ Resumo das funcionalidades implementadas:')
    console.log('✅ Desconexão seletiva de calendários')
    console.log('   - Selecionar calendários específicos para desconectar')
    console.log('   - Manter outros calendários conectados')
    console.log('   - Deletar logs e eventos relacionados')
    console.log('')
    console.log('✅ Conexão de novos calendários')
    console.log('   - Botão "Adicionar" sempre disponível')
    console.log('   - Pode conectar calendários a qualquer momento')
    console.log('   - Mantém calendários existentes')
    console.log('')
    console.log('✅ Interface melhorada')
    console.log('   - Duas seções separadas: visualização e desconexão')
    console.log('   - Checkboxes independentes para cada ação')
    console.log('   - Contador de calendários selecionados')
    console.log('   - Feedback visual com cores diferentes')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testCalendarManagement() 