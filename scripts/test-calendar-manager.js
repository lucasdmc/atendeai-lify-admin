import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCalendarManager() {
  console.log('🧪 Testando Edge Function calendar-manager...')
  
  try {
    // Usar o userId diretamente (sem fazer login)
    const userId = '5cd566ec-0064-4c9f-946b-182deaf204d4'
    console.log('👤 Usando userId:', userId)
    
    // Testar a Edge Function
    console.log('📅 Testando calendar-manager...')
    
    const { data, error } = await supabase.functions.invoke('calendar-manager', {
      body: { 
        action: 'list-events',
        userId: userId,
        calendarId: 'lucaasdmc@gmail.com',
        timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias atrás
        timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias à frente
        forceRefresh: true
      }
    })
    
    if (error) {
      console.error('❌ Erro na Edge Function:', error)
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        status: error.status,
        name: error.name
      })
      return
    }
    
    console.log('✅ Edge Function executada com sucesso')
    console.log('📊 Dados retornados:', data)
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testCalendarManager() 