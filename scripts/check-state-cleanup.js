import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStateCleanup() {
  console.log('🧪 Verificando limpeza de estado...')
  
  const userId = '5cd566ec-0064-4c9f-946b-182deaf204d4'
  
  try {
    // 1. Verificar se há dados persistentes
    console.log('\n1️⃣ Verificando dados persistentes...')
    
    // Verificar user_calendars
    const { data: userCalendars, error: calendarsError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', userId)
    
    if (calendarsError) {
      console.error('❌ Erro ao buscar calendários:', calendarsError)
    } else {
      console.log(`📊 Calendários na tabela user_calendars: ${userCalendars?.length || 0}`)
      if (userCalendars && userCalendars.length > 0) {
        userCalendars.forEach((cal, index) => {
          console.log(`   ${index + 1}. ${cal.calendar_name} (${cal.google_calendar_id})`)
        })
      }
    }
    
    // Verificar google_calendar_tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', userId)
    
    if (tokensError) {
      console.error('❌ Erro ao buscar tokens:', tokensError)
    } else {
      console.log(`🔑 Tokens na tabela google_calendar_tokens: ${tokens?.length || 0}`)
      if (tokens && tokens.length > 0) {
        tokens.forEach((token, index) => {
          console.log(`   ${index + 1}. Criado em: ${token.created_at}`)
        })
      }
    }
    
    // 2. Verificar se há sessões ativas
    console.log('\n2️⃣ Verificando sessões ativas...')
    
    // Como não podemos verificar sessões diretamente via SQL, vamos verificar se há dados recentes
    if (userCalendars && userCalendars.length > 0) {
      const mostRecentCalendar = userCalendars.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]
      
      const timeSinceCreation = Date.now() - new Date(mostRecentCalendar.created_at).getTime()
      const hoursSinceCreation = timeSinceCreation / (1000 * 60 * 60)
      
      console.log(`⏰ Calendário mais recente criado há ${hoursSinceCreation.toFixed(1)} horas`)
      
      if (hoursSinceCreation < 1) {
        console.log('⚠️  Dados muito recentes - possível cache ou estado persistente')
      } else {
        console.log('✅ Dados não são muito recentes')
      }
    }
    
    // 3. Recomendações
    console.log('\n3️⃣ Recomendações:')
    
    if ((userCalendars?.length || 0) > 0 || (tokens?.length || 0) > 0) {
      console.log('❌ Há dados persistentes que podem estar causando problemas')
      console.log('💡 Execute o script de limpeza: node scripts/test-logout-cleanup.js')
    } else {
      console.log('✅ Nenhum dado persistente encontrado')
      console.log('💡 O problema pode estar no estado do frontend')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkStateCleanup() 