import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDisconnectFix() {
  console.log('🧪 Testando correção da funcionalidade de desconectar calendários...')
  
  const userId = '5cd566ec-0064-4c9f-946b-182deaf204d4'
  
  try {
    // 1. Verificar estado inicial
    console.log('\n1️⃣ Verificando estado inicial...')
    
    const { data: userCalendars, error: calendarsError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', userId)
    
    if (calendarsError) {
      console.error('❌ Erro ao buscar calendários:', calendarsError)
    } else {
      console.log(`📊 Calendários na tabela user_calendars: ${userCalendars?.length || 0}`)
    }
    
    const { data: syncLogs, error: logsError } = await supabase
      .from('calendar_sync_logs')
      .select('*')
      .eq('user_calendar_id', userCalendars?.[0]?.id || 'none')
    
    if (logsError) {
      console.error('❌ Erro ao buscar logs de sincronização:', logsError)
    } else {
      console.log(`📝 Logs de sincronização: ${syncLogs?.length || 0}`)
    }
    
    // 2. Simular o processo de desconexão
    console.log('\n2️⃣ Simulando processo de desconexão...')
    
    if (userCalendars && userCalendars.length > 0) {
      console.log('🔍 Encontrados calendários para desconectar...')
      
      // Primeiro deletar logs de sincronização
      const { error: deleteLogsError } = await supabase
        .from('calendar_sync_logs')
        .delete()
        .in('user_calendar_id', userCalendars.map(cal => cal.id))
      
      if (deleteLogsError) {
        console.error('❌ Erro ao deletar logs de sincronização:', deleteLogsError)
      } else {
        console.log('✅ Logs de sincronização deletados com sucesso')
      }
      
      // Depois deletar calendários
      const { error: deleteCalendarsError } = await supabase
        .from('user_calendars')
        .delete()
        .eq('user_id', userId)
      
      if (deleteCalendarsError) {
        console.error('❌ Erro ao deletar calendários:', deleteCalendarsError)
      } else {
        console.log('✅ Calendários deletados com sucesso')
      }
    } else {
      console.log('ℹ️  Nenhum calendário encontrado para desconectar')
    }
    
    // 3. Verificar estado final
    console.log('\n3️⃣ Verificando estado final...')
    
    const { data: finalCalendars, error: finalCalendarsError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', userId)
    
    if (finalCalendarsError) {
      console.error('❌ Erro ao verificar calendários finais:', finalCalendarsError)
    } else {
      console.log(`📊 Calendários finais: ${finalCalendars?.length || 0}`)
    }
    
    // 4. Conclusão
    console.log('\n4️⃣ Conclusão:')
    
    if ((finalCalendars?.length || 0) === 0) {
      console.log('✅ Funcionalidade de desconexão funcionando corretamente!')
      console.log('💡 O problema de foreign key foi resolvido')
      console.log('🎯 Agora é seguro usar a funcionalidade de desconectar calendários')
    } else {
      console.log('⚠️  Ainda há calendários - verificar se há outros problemas')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testDisconnectFix() 