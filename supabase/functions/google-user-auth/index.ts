import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Configurações OAuth2 do Google
const GOOGLE_CLIENT_ID = Deno.env.get('VITE_GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('VITE_GOOGLE_CLIENT_SECRET')!
const REDIRECT_URI = `${supabaseUrl}/functions/v1/google-user-auth/callback`

interface GoogleTokens {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
}

interface GoogleCalendar {
  id: string
  summary: string
  description?: string
  primary?: boolean
  backgroundColor?: string
  foregroundColor?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { action, code, state, userId } = await req.json()

    console.log(`Google User Auth - Action: ${action}`)

    switch (action) {
      case 'initiate-auth':
        return await initiateGoogleAuth(state, userId)
      
      case 'handle-callback':
        return await handleGoogleCallback(code, state, supabase)
      
      case 'list-calendars':
        return await listUserCalendars(userId, supabase)
      
      case 'add-calendar':
        const { calendarId, calendarName, calendarColor } = await req.json()
        return await addUserCalendar(userId, calendarId, calendarName, calendarColor, supabase)
      
      case 'refresh-token':
        return await refreshUserToken(userId, supabase)
      
      case 'disconnect-calendar':
        return await disconnectCalendar(userId, supabase)
      
      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error in google-user-auth:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function initiateGoogleAuth(state: string, userId: string): Promise<Response> {
  const authUrl = new URL('https://accounts.google.com/oauth/authorize')
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events')
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('state', `${userId}:${state}`)

  return new Response(
    JSON.stringify({ authUrl: authUrl.toString() }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function handleGoogleCallback(code: string, state: string, supabase: any): Promise<Response> {
  try {
    console.log('Handling Google callback...')
    
    // Extrair userId do state
    const [userId, originalState] = state.split(':')
    
    // Trocar código por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('Token exchange failed:', error)
      throw new Error('Failed to exchange code for tokens')
    }

    const tokens: GoogleTokens = await tokenResponse.json()
    
    // Buscar informações do usuário
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info')
    }

    const userInfo = await userInfoResponse.json()
    
    // Buscar calendários do usuário
    const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    })

    if (!calendarsResponse.ok) {
      throw new Error('Failed to get calendars')
    }

    const calendarsData = await calendarsResponse.json()
    const calendars: GoogleCalendar[] = calendarsData.items || []
    
    // Salvar tokens e calendários no banco
    for (const calendar of calendars) {
      const expiresAt = new Date()
      expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in)
      
      await supabase
        .from('user_calendars')
        .upsert({
          user_id: userId,
          google_calendar_id: calendar.id,
          calendar_name: calendar.summary,
          calendar_color: calendar.backgroundColor || '#4285f4',
          is_primary: calendar.primary || false,
          is_active: true,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt.toISOString(),
        }, {
          onConflict: 'user_id,google_calendar_id'
        })
    }

    console.log(`Saved ${calendars.length} calendars for user ${userId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Calendars connected successfully',
        calendarsCount: calendars.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error handling callback:', error)
    throw error
  }
}

async function listUserCalendars(userId: string, supabase: any): Promise<Response> {
  try {
    const { data: calendars, error } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('calendar_name')

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ calendars: calendars || [] }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error listing calendars:', error)
    throw error
  }
}

async function addUserCalendar(
  userId: string, 
  calendarId: string, 
  calendarName: string, 
  calendarColor: string, 
  supabase: any
): Promise<Response> {
  try {
    // Verificar se o usuário tem tokens válidos
    const { data: existingCalendar } = await supabase
      .from('user_calendars')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!existingCalendar) {
      throw new Error('No active calendars found. Please authenticate with Google first.')
    }

    // Verificar se o token ainda é válido
    const tokenExpiry = new Date(existingCalendar.expires_at)
    if (tokenExpiry <= new Date()) {
      // Token expirado, tentar renovar
      await refreshUserToken(userId, supabase)
    }

    // Buscar informações do calendário específico
    const calendarResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`, {
      headers: {
        'Authorization': `Bearer ${existingCalendar.access_token}`,
      },
    })

    if (!calendarResponse.ok) {
      throw new Error('Failed to get calendar information')
    }

    const calendarInfo = await calendarResponse.json()
    
    // Salvar o novo calendário
    const { data: newCalendar, error } = await supabase
      .from('user_calendars')
      .insert({
        user_id: userId,
        google_calendar_id: calendarId,
        calendar_name: calendarName || calendarInfo.summary,
        calendar_color: calendarColor || calendarInfo.backgroundColor || '#4285f4',
        is_primary: false,
        is_active: true,
        access_token: existingCalendar.access_token,
        refresh_token: existingCalendar.refresh_token,
        expires_at: existingCalendar.expires_at,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        calendar: newCalendar,
        message: 'Calendar added successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error adding calendar:', error)
    throw error
  }
}

async function refreshUserToken(userId: string, supabase: any): Promise<Response> {
  try {
    // Buscar refresh token do usuário
    const { data: calendar, error } = await supabase
      .from('user_calendars')
      .select('refresh_token')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (error || !calendar?.refresh_token) {
      throw new Error('No refresh token found')
    }

    // Renovar token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: calendar.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to refresh token')
    }

    const tokens: GoogleTokens = await tokenResponse.json()
    
    // Atualizar tokens em todos os calendários do usuário
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in)
    
    await supabase
      .from('user_calendars')
      .update({
        access_token: tokens.access_token,
        expires_at: expiresAt.toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_active', true)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Token refreshed successfully',
        expires_at: expiresAt.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error refreshing token:', error)
    throw error
  }
}

async function disconnectCalendar(userId: string, supabase: any): Promise<Response> {
  try {
    // Desativar todos os calendários do usuário
    await supabase
      .from('user_calendars')
      .update({ is_active: false })
      .eq('user_id', userId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Calendars disconnected successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error disconnecting calendars:', error)
    throw error
  }
} 