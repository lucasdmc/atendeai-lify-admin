import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCalendarRecords() {
  console.log('🔍 Verificando registros de calendários no banco...')
  
  const userId = '5cd566ec-0064-4c9f-946b-182deaf204d4'
  const calendarIds = [
    'fb2b1dfb1e6c600594b05785de5cf04fb38bd0376bd3f5e5d1c08c60d4c894df@group.calendar.google.com',
    'lucaasdmc@gmail.com',
    'pauloroberto.batistajr@gmail.com',
    'fnq3es434s7fe4u9485qhvs9ho@group.calendar.google.com',
    'c_5b38be7f1913691147cc11ac6b9e0426cf5520ec9266c967567a207994599c99@group.calendar.google.com',
    '7063792e6d41a016c329bfeb09927c43225214c2b01ab81d165385bcf6b5e212@group.calendar.google.com'
  ]
  
  try {
    // Buscar todos os calendários do usuário
    const { data: userCalendars, error } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', userId)
    
    if (error) {
      console.error('❌ Erro ao buscar calendários:', error)
      return
    }
    
    console.log(`📊 Total de calendários encontrados para o usuário: ${userCalendars?.length || 0}`)
    
    if (userCalendars && userCalendars.length > 0) {
      userCalendars.forEach((cal, index) => {
        console.log(`📅 Calendário ${index + 1}:`, {
          id: cal.id,
          google_calendar_id: cal.google_calendar_id,
          calendar_name: cal.calendar_name,
          expires_at: cal.expires_at,
          access_token_length: cal.access_token?.length || 0,
          token_expired: cal.expires_at ? new Date(cal.expires_at) <= new Date() : 'N/A'
        })
      })
      
      // Verificar se cada calendarId está presente
      console.log('\n🔍 Verificando se cada calendarId está presente:')
      calendarIds.forEach(calendarId => {
        const found = userCalendars.find(cal => cal.google_calendar_id === calendarId)
        if (found) {
          console.log(`✅ ${calendarId} - ENCONTRADO`)
        } else {
          console.log(`❌ ${calendarId} - NÃO ENCONTRADO`)
        }
      })
    } else {
      console.log('❌ Nenhum calendário encontrado para o usuário')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkCalendarRecords() 