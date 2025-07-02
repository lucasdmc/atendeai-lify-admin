import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAgendamentosFix() {
  console.log('🧪 Testando correção do loop infinito...')
  
  const userId = '5cd566ec-0064-4c9f-946b-182deaf204d4'
  
  try {
    // 1. Verificar se há dados que podem causar problemas
    console.log('\n1️⃣ Verificando dados do usuário...')
    
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
          console.log(`   ${index + 1}. ${cal.calendar_name} (${cal.google_calendar_id}) - Ativo: ${cal.is_active}`)
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
          const expiresAt = new Date(token.expires_at)
          const isExpired = expiresAt < new Date()
          console.log(`   ${index + 1}. Criado em: ${token.created_at} - Expira em: ${expiresAt.toLocaleString()} - Expirado: ${isExpired}`)
        })
      }
    }
    
    // 2. Verificar se há problemas de estado
    console.log('\n2️⃣ Verificando problemas de estado...')
    
    if ((userCalendars?.length || 0) > 0) {
      const hasValidTokens = tokens && tokens.length > 0 && tokens.some(token => new Date(token.expires_at) > new Date())
      const hasActiveCalendars = userCalendars.some(cal => cal.is_active)
      
      console.log(`🔍 Estado esperado:`)
      console.log(`   - Tem tokens válidos: ${hasValidTokens}`)
      console.log(`   - Tem calendários ativos: ${hasActiveCalendars}`)
      console.log(`   - Deveria estar autenticado: ${hasValidTokens && hasActiveCalendars}`)
      
      if (!hasValidTokens) {
        console.log('⚠️  Tokens expirados ou ausentes - pode causar problemas de autenticação')
      }
      
      if (!hasActiveCalendars) {
        console.log('⚠️  Nenhum calendário ativo - pode causar problemas de seleção')
      }
    }
    
    // 3. Recomendações
    console.log('\n3️⃣ Recomendações:')
    
    if ((userCalendars?.length || 0) === 0 && (tokens?.length || 0) === 0) {
      console.log('✅ Estado limpo - usuário precisa conectar Google Calendar')
      console.log('💡 O loop infinito foi corrigido, agora é seguro acessar a tela de Agendamentos')
    } else if ((userCalendars?.length || 0) > 0) {
      const hasValidTokens = tokens && tokens.length > 0 && tokens.some(token => new Date(token.expires_at) > new Date())
      
      if (hasValidTokens) {
        console.log('✅ Usuário tem dados válidos - deve funcionar normalmente')
        console.log('💡 O loop infinito foi corrigido, agora é seguro acessar a tela de Agendamentos')
      } else {
        console.log('⚠️  Usuário tem calendários mas tokens expirados')
        console.log('💡 Recomenda-se fazer logout e login novamente para renovar tokens')
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testAgendamentosFix() 