import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone?: string
  }
  end: {
    dateTime: string
    timeZone?: string
  }
  location?: string
  attendees?: Array<{
    email: string
    displayName?: string
  }>
  colorId?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { action, calendarId, eventId, eventData, timeMin, timeMax, userId } = await req.json()

    console.log(`Calendar Manager - Action: ${action}`)

    switch (action) {
      case 'create-event':
        return await createEventInCalendar(calendarId, eventData, userId, supabase)
      
      case 'update-event':
        return await updateEventInCalendar(calendarId, eventId, eventData, userId, supabase)
      
      case 'delete-event':
        return await deleteEventFromCalendar(calendarId, eventId, userId, supabase)
      
      case 'list-events':
        return await listCalendarEvents(calendarId, timeMin, timeMax, userId, supabase)
      
      case 'sync-calendar':
        return await syncCalendarEvents(calendarId, userId, supabase)
      
      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error in calendar-manager:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function getValidAccessToken(userId: string, supabase: any): Promise<string> {
  // Buscar calendário do usuário
  const { data: calendar, error } = await supabase
    .from('user_calendars')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (error || !calendar) {
    throw new Error('No active calendar found')
  }

  // Verificar se o token ainda é válido
  const tokenExpiry = new Date(calendar.expires_at)
  if (tokenExpiry <= new Date()) {
    // Token expirado, renovar
    const refreshResponse = await supabase.functions.invoke('google-user-auth', {
      body: { action: 'refresh-token', userId }
    })
    
    if (refreshResponse.error) {
      throw new Error('Failed to refresh token')
    }
    
    // Buscar o token renovado
    const { data: updatedCalendar } = await supabase
      .from('user_calendars')
      .select('access_token')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
      .single()
    
    return updatedCalendar.access_token
  }

  return calendar.access_token
}

async function createEventInCalendar(
  calendarId: string, 
  eventData: CalendarEvent, 
  userId: string, 
  supabase: any
): Promise<Response> {
  try {
    console.log('Creating event in calendar...')
    
    const accessToken = await getValidAccessToken(userId, supabase)
    
    // Criar evento no Google Calendar
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Google Calendar API error:', errorData)
      throw new Error(`Failed to create event: ${response.status}`)
    }

    const createdEvent = await response.json()
    
    // Salvar no banco de dados local
    const { data: dbEvent, error: dbError } = await supabase
      .from('calendar_events')
      .insert({
        user_id: userId,
        user_calendar_id: calendarId,
        google_event_id: createdEvent.id,
        calendar_id: calendarId,
        title: eventData.summary,
        description: eventData.description || '',
        start_time: eventData.start.dateTime,
        end_time: eventData.end.dateTime,
        location: eventData.location || '',
        attendees: eventData.attendees ? JSON.stringify(eventData.attendees) : null,
        status: 'confirmed',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Não falhar se o banco falhar, apenas logar
    }

    // Log de sincronização
    await supabase
      .from('calendar_sync_logs')
      .insert({
        user_calendar_id: calendarId,
        sync_type: 'create',
        event_id: createdEvent.id,
        status: 'success',
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        event: createdEvent,
        dbEvent: dbEvent
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating event:', error)
    
    // Log de erro
    await supabase
      .from('calendar_sync_logs')
      .insert({
        user_calendar_id: calendarId,
        sync_type: 'create',
        event_id: null,
        status: 'error',
        error_message: error.message,
      })
    
    throw error
  }
}

async function updateEventInCalendar(
  calendarId: string, 
  eventId: string, 
  eventData: CalendarEvent, 
  userId: string, 
  supabase: any
): Promise<Response> {
  try {
    console.log('Updating event in calendar...')
    
    const accessToken = await getValidAccessToken(userId, supabase)
    
    // Atualizar evento no Google Calendar
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Google Calendar API error:', errorData)
      throw new Error(`Failed to update event: ${response.status}`)
    }

    const updatedEvent = await response.json()
    
    // Atualizar no banco de dados local
    const { data: dbEvent, error: dbError } = await supabase
      .from('calendar_events')
      .update({
        title: eventData.summary,
        description: eventData.description || '',
        start_time: eventData.start.dateTime,
        end_time: eventData.end.dateTime,
        location: eventData.location || '',
        attendees: eventData.attendees ? JSON.stringify(eventData.attendees) : null,
      })
      .eq('google_event_id', eventId)
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
    }

    // Log de sincronização
    await supabase
      .from('calendar_sync_logs')
      .insert({
        user_calendar_id: calendarId,
        sync_type: 'update',
        event_id: eventId,
        status: 'success',
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        event: updatedEvent,
        dbEvent: dbEvent
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error updating event:', error)
    
    // Log de erro
    await supabase
      .from('calendar_sync_logs')
      .insert({
        user_calendar_id: calendarId,
        sync_type: 'update',
        event_id: eventId,
        status: 'error',
        error_message: error.message,
      })
    
    throw error
  }
}

async function deleteEventFromCalendar(
  calendarId: string, 
  eventId: string, 
  userId: string, 
  supabase: any
): Promise<Response> {
  try {
    console.log('Deleting event from calendar...')
    
    const accessToken = await getValidAccessToken(userId, supabase)
    
    // Deletar evento do Google Calendar
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Google Calendar API error:', errorData)
      throw new Error(`Failed to delete event: ${response.status}`)
    }
    
    // Deletar do banco de dados local
    const { error: dbError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('google_event_id', eventId)

    if (dbError) {
      console.error('Database error:', dbError)
    }

    // Log de sincronização
    await supabase
      .from('calendar_sync_logs')
      .insert({
        user_calendar_id: calendarId,
        sync_type: 'delete',
        event_id: eventId,
        status: 'success',
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Event deleted successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error deleting event:', error)
    
    // Log de erro
    await supabase
      .from('calendar_sync_logs')
      .insert({
        user_calendar_id: calendarId,
        sync_type: 'delete',
        event_id: eventId,
        status: 'error',
        error_message: error.message,
      })
    
    throw error
  }
}

async function listCalendarEvents(
  calendarId: string, 
  timeMin: string, 
  timeMax: string, 
  userId: string, 
  supabase: any
): Promise<Response> {
  try {
    console.log('Listing calendar events...')
    
    const accessToken = await getValidAccessToken(userId, supabase)
    
    const params = new URLSearchParams({
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '100',
    })
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Google Calendar API error:', errorData)
      throw new Error(`Failed to list events: ${response.status}`)
    }

    const data = await response.json()
    const events = data.items || []
    
    // Sincronizar com banco local
    await syncEventsToDatabase(events, userId, calendarId, supabase)

    return new Response(
      JSON.stringify({ 
        success: true, 
        events: events
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error listing events:', error)
    throw error
  }
}

async function syncCalendarEvents(
  calendarId: string, 
  userId: string, 
  supabase: any
): Promise<Response> {
  try {
    console.log('Syncing calendar events...')
    
    // Buscar eventos dos últimos 30 dias
    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const eventsResponse = await listCalendarEvents(calendarId, timeMin, timeMax, userId, supabase)
    const eventsData = await eventsResponse.json()
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Calendar synced successfully',
        eventsCount: eventsData.events.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error syncing calendar:', error)
    throw error
  }
}

async function syncEventsToDatabase(
  events: any[], 
  userId: string, 
  calendarId: string, 
  supabase: any
): Promise<void> {
  try {
    const eventsToUpsert = events.map(event => ({
      user_id: userId,
      user_calendar_id: calendarId,
      google_event_id: event.id,
      calendar_id: calendarId,
      title: event.summary || 'Sem título',
      description: event.description || '',
      start_time: event.start.dateTime || event.start.date,
      end_time: event.end.dateTime || event.end.date,
      location: event.location || '',
      attendees: event.attendees ? JSON.stringify(event.attendees) : null,
      status: event.status || 'confirmed',
    }))

    if (eventsToUpsert.length > 0) {
      await supabase
        .from('calendar_events')
        .upsert(eventsToUpsert, { 
          onConflict: 'user_id,google_event_id' 
        })
      
      console.log(`Synced ${eventsToUpsert.length} events to database`)
    }
  } catch (error) {
    console.error('Error syncing events to database:', error)
  }
} 