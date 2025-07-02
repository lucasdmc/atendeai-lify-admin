import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co"
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTokens() {
  console.log('🔍 Verificando tokens na tabela google_calendar_tokens...')
  
  const userId = '5cd566ec-0064-4c9f-946b-182deaf204d4'
  
  try {
    // Buscar tokens do usuário
    const { data: tokens, error } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erro ao buscar tokens:', error)
      return
    }
    
    console.log(`📊 Total de tokens encontrados para o usuário: ${tokens?.length || 0}`)
    
    if (tokens && tokens.length > 0) {
      tokens.forEach((token, index) => {
        console.log(`🔑 Token ${index + 1}:`, {
          id: token.id,
          user_id: token.user_id,
          access_token_length: token.access_token?.length || 0,
          refresh_token_length: token.refresh_token?.length || 0,
          expires_at: token.expires_at,
          token_expired: token.expires_at ? new Date(token.expires_at) <= new Date() : 'N/A',
          created_at: token.created_at
        })
      })
    } else {
      console.log('❌ Nenhum token encontrado para o usuário')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkTokens() 