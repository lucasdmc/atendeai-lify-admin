import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, ...params } = await req.json()

    switch (action) {
      case 'list-events':
        return await handleListEvents(supabaseClient, user, params)
      
      case 'create-event':
        return await handleCreateEvent(supabaseClient, user, params)
      
      case 'update-event':
        return await handleUpdateEvent(supabaseClient, user, params)
      
      case 'delete-event':
        return await handleDeleteEvent(supabaseClient, user, params)
      
      case 'sync-calendar':
        return await handleSyncCalendar(supabaseClient, user, params)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('Calendar manager error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

async function handleListEvents(supabaseClient: any, user: any, params: any) {
  console.log('[DEBUG] 🎯 Edge Function - handleListEvents - params:', params)
  console.log('[DEBUG] 🎯 Edge Function - handleListEvents - user:', user.id)
  
  const { calendarId, timeMin, timeMax } = params
  
  console.log('[DEBUG] 🎯 Edge Function - handleListEvents - calendarId:', calendarId)
  console.log('[DEBUG] 🎯 Edge Function - handleListEvents - timeMin:', timeMin)
  console.log('[DEBUG] 🎯 Edge Function - handleListEvents - timeMax:', timeMax)
  
  // Get user calendar tokens
  const { data: userCalendar, error: calendarError } = await supabaseClient
    .from('user_calendars')
    .select('*')
    .eq('user_id', user.id)
    .eq('google_calendar_id', calendarId)
    .single()

  console.log('[DEBUG] 🎯 Edge Function - handleListEvents - userCalendar:', userCalendar)
  console.log('[DEBUG] 🎯 Edge Function - handleListEvents - calendarError:', calendarError)

  if (calendarError || !userCalendar) {
    throw new Error('Calendar not found or not authorized')
  }

  // Check if token is expired
  if (new Date(userCalendar.expires_at) <= new Date()) {
    // Refresh token logic would go here
    throw new Error('Token expired - please reconnect your calendar')
  }

  // Fetch events from Google Calendar API
  const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?` + 
    new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      timeMin: timeMin || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Buscar eventos dos últimos 7 dias
      timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults: '100', // Aumentar o limite de resultados
    })

  console.log('[DEBUG] 🎯 Edge Function - handleListEvents - URL:', url)

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${userCalendar.access_token}`,
  }

  // Adicionar headers de cache-busting se forceRefresh for true
  if (params.forceRefresh) {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    headers['Pragma'] = 'no-cache'
    headers['Expires'] = '0'
  }

  const response = await fetch(url, {
    headers,
  })

  console.log('[DEBUG] 🎯 Edge Function - handleListEvents - Response status:', response.status)
  console.log('[DEBUG] 🎯 Edge Function - handleListEvents - Response ok:', response.ok)

  if (!response.ok) {
    const errorData = await response.text()
    console.error('[DEBUG] 🎯 Edge Function - handleListEvents - Google API error:', errorData)
    throw new Error('Failed to fetch events from Google Calendar')
  }

  const data = await response.json()
  console.log('[DEBUG] 🎯 Edge Function - handleListEvents - Events count:', data.items?.length || 0)
  
  return new Response(
    JSON.stringify({
      success: true,
      events: data.items || []
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  )
}

async function handleCreateEvent(supabaseClient: any, user: any, params: any) {
  console.log('[DEBUG] 🎯 Edge Function - handleCreateEvent - params:', params)
  console.log('[DEBUG] 🎯 Edge Function - handleCreateEvent - user:', user.id)
  
  const { calendarId, eventData } = params
  
  console.log('[DEBUG] 🎯 Edge Function - handleCreateEvent - calendarId:', calendarId)
  console.log('[DEBUG] 🎯 Edge Function - handleCreateEvent - eventData:', eventData)
  
  // Get user calendar tokens
  const { data: userCalendar, error: calendarError } = await supabaseClient
    .from('user_calendars')
    .select('*')
    .eq('user_id', user.id)
    .eq('google_calendar_id', calendarId)
    .single()

  console.log('[DEBUG] 🎯 Edge Function - handleCreateEvent - userCalendar:', userCalendar)
  console.log('[DEBUG] 🎯 Edge Function - handleCreateEvent - calendarError:', calendarError)

  if (calendarError || !userCalendar) {
    throw new Error('Calendar not found or not authorized')
  }

  // Create event in Google Calendar
  console.log('[DEBUG] 🎯 Edge Function - handleCreateEvent - Making request to Google Calendar API...')
  console.log('[DEBUG] 🎯 Edge Function - handleCreateEvent - URL:', `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`)
  console.log('[DEBUG] 🎯 Edge Function - handleCreateEvent - Request body:', JSON.stringify(eventData))
  
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userCalendar.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    }
  )

  console.log('[DEBUG] 🎯 Edge Function - handleCreateEvent - Response status:', response.status)
  console.log('[DEBUG] 🎯 Edge Function - handleCreateEvent - Response ok:', response.ok)

  if (!response.ok) {
    const errorData = await response.text()
    console.error('[DEBUG] 🎯 Edge Function - handleCreateEvent - Google API error:', errorData)
    throw new Error(`Failed to create event: ${errorData}`)
  }

  const createdEvent = await response.json()
  console.log('[DEBUG] 🎯 Edge Function - handleCreateEvent - Created event:', createdEvent)

  // Log the sync operation
  await supabaseClient
    .from('calendar_sync_logs')
    .insert({
      user_calendar_id: userCalendar.id,
      sync_type: 'create',
      event_id: createdEvent.id,
      status: 'success'
    })

  return new Response(
    JSON.stringify({
      success: true,
      event: createdEvent
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  )
}

async function handleUpdateEvent(supabaseClient: any, user: any, params: any) {
  const { calendarId, eventId, eventData } = params
  
  // Get user calendar tokens
  const { data: userCalendar, error: calendarError } = await supabaseClient
    .from('user_calendars')
    .select('*')
    .eq('user_id', user.id)
    .eq('google_calendar_id', calendarId)
    .single()

  if (calendarError || !userCalendar) {
    throw new Error('Calendar not found or not authorized')
  }

  // Update event in Google Calendar
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userCalendar.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    }
  )

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Failed to update event: ${errorData}`)
  }

  const updatedEvent = await response.json()

  // Log the sync operation
  await supabaseClient
    .from('calendar_sync_logs')
    .insert({
      user_calendar_id: userCalendar.id,
      sync_type: 'update',
      event_id: eventId,
      status: 'success'
    })

  return new Response(
    JSON.stringify({
      success: true,
      event: updatedEvent
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  )
}

async function handleDeleteEvent(supabaseClient: any, user: any, params: any) {
  const { calendarId, eventId } = params
  
  // Get user calendar tokens
  const { data: userCalendar, error: calendarError } = await supabaseClient
    .from('user_calendars')
    .select('*')
    .eq('user_id', user.id)
    .eq('google_calendar_id', calendarId)
    .single()

  if (calendarError || !userCalendar) {
    throw new Error('Calendar not found or not authorized')
  }

  // Delete event from Google Calendar
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userCalendar.access_token}`,
      },
    }
  )

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Failed to delete event: ${errorData}`)
  }

  // Log the sync operation
  await supabaseClient
    .from('calendar_sync_logs')
    .insert({
      user_calendar_id: userCalendar.id,
      sync_type: 'delete',
      event_id: eventId,
      status: 'success'
    })

  return new Response(
    JSON.stringify({
      success: true
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  )
}

async function handleSyncCalendar(supabaseClient: any, user: any, params: any) {
  const { calendarId } = params
  
  // Get user calendar tokens
  const { data: userCalendar, error: calendarError } = await supabaseClient
    .from('user_calendars')
    .select('*')
    .eq('user_id', user.id)
    .eq('google_calendar_id', calendarId)
    .single()

  if (calendarError || !userCalendar) {
    throw new Error('Calendar not found or not authorized')
  }

  // Fetch all events from the last 30 days to next 30 days
  const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?` + 
    new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      timeMin,
      timeMax,
    })

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${userCalendar.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to sync calendar')
  }

  const data = await response.json()
  const events = data.items || []

  // Sync events to local database
  for (const event of events) {
    await supabaseClient
      .from('calendar_events')
      .upsert({
        user_id: user.id,
        user_calendar_id: userCalendar.id,
        google_event_id: event.id,
        calendar_id: calendarId,
        title: event.summary,
        description: event.description,
        start_time: event.start.dateTime || event.start.date,
        end_time: event.end.dateTime || event.end.date,
        location: event.location,
        attendees: event.attendees ? JSON.stringify(event.attendees) : null,
        status: event.status,
      }, { onConflict: 'user_id,google_event_id' })
  }

  // Log the sync operation
  await supabaseClient
    .from('calendar_sync_logs')
    .insert({
      user_calendar_id: userCalendar.id,
      sync_type: 'sync',
      event_id: null,
      status: 'success'
    })

  return new Response(
    JSON.stringify({
      success: true,
      eventsCount: events.length
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  )
} 