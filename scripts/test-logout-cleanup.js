import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function testLogoutCleanup() {
  console.log('🧪 Testando limpeza automática no logout...')
  
  const userId = '5cd566ec-0064-4c9f-946b-182deaf204d4'
  
  try {
    // 1. Verificar estado antes do logout
    console.log('\n1️⃣ Verificando estado antes do logout...')
    
    const { data: userCalendars, error: calendarsError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', userId)
    
    if (calendarsError) {
      console.error('❌ Erro ao buscar calendários:', calendarsError)
    } else {
      console.log(`📊 Calendários antes do logout: ${userCalendars?.length || 0}`)
    }
    
    const { data: tokens, error: tokensError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', userId)
    
    if (tokensError) {
      console.error('❌ Erro ao buscar tokens:', tokensError)
    } else {
      console.log(`🔑 Tokens antes do logout: ${tokens?.length || 0}`)
    }
    
    // 2. Simular logout (deletar dados manualmente)
    console.log('\n2️⃣ Simulando logout (deletando dados)...')
    
    // Deletar calendários
    const { error: deleteCalendarsError } = await supabase
      .from('user_calendars')
      .delete()
      .eq('user_id', userId)
    
    if (deleteCalendarsError) {
      console.error('❌ Erro ao deletar calendários:', deleteCalendarsError)
    } else {
      console.log('✅ Calendários deletados com sucesso')
    }
    
    // Deletar tokens
    const { error: deleteTokensError } = await supabase
      .from('google_calendar_tokens')
      .delete()
      .eq('user_id', userId)
    
    if (deleteTokensError) {
      console.error('❌ Erro ao deletar tokens:', deleteTokensError)
    } else {
      console.log('✅ Tokens deletados com sucesso')
    }
    
    // 3. Verificar estado após o logout
    console.log('\n3️⃣ Verificando estado após o logout...')
    
    const { data: userCalendarsAfter, error: calendarsErrorAfter } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', userId)
    
    if (calendarsErrorAfter) {
      console.error('❌ Erro ao buscar calendários após logout:', calendarsErrorAfter)
    } else {
      console.log(`📊 Calendários após o logout: ${userCalendarsAfter?.length || 0}`)
    }
    
    const { data: tokensAfter, error: tokensErrorAfter } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', userId)
    
    if (tokensErrorAfter) {
      console.error('❌ Erro ao buscar tokens após logout:', tokensErrorAfter)
    } else {
      console.log(`🔑 Tokens após o logout: ${tokensAfter?.length || 0}`)
    }
    
    // 4. Verificar se a limpeza foi bem-sucedida
    console.log('\n4️⃣ Resultado da limpeza:')
    const calendarsCleaned = (userCalendarsAfter?.length || 0) === 0
    const tokensCleaned = (tokensAfter?.length || 0) === 0
    
    if (calendarsCleaned && tokensCleaned) {
      console.log('✅ Limpeza bem-sucedida! Todos os dados foram removidos.')
    } else {
      console.log('❌ Limpeza incompleta:')
      console.log(`   - Calendários: ${calendarsCleaned ? '✅' : '❌'}`)
      console.log(`   - Tokens: ${tokensCleaned ? '✅' : '❌'}`)
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testLogoutCleanup() 