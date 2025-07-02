import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUserCalendars() {
  console.log('🔍 Verificando calendários do usuário...')
  
  const userId = '5cd566ec-0064-4c9f-946b-182deaf204d4'
  
  try {
    // Buscar calendários do usuário
    const { data: userCalendars, error } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
    
    if (error) {
      console.error('❌ Erro ao buscar calendários:', error)
      return
    }
    
    console.log(`📊 Total de calendários ativos do usuário: ${userCalendars?.length || 0}`)
    
    if (userCalendars && userCalendars.length > 0) {
      userCalendars.forEach((cal, index) => {
        console.log(`📅 Calendário ${index + 1}:`, {
          id: cal.id,
          google_calendar_id: cal.google_calendar_id,
          calendar_name: cal.calendar_name,
          is_primary: cal.is_primary,
          is_active: cal.is_active,
          access_token_length: cal.access_token?.length || 0,
          expires_at: cal.expires_at,
          token_expired: cal.expires_at ? new Date(cal.expires_at) <= new Date() : 'N/A'
        })
      })
    } else {
      console.log('❌ Nenhum calendário ativo encontrado para o usuário')
      console.log('💡 O usuário precisa selecionar quais calendários quer conectar')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkUserCalendars() 