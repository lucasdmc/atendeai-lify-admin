// Tipos para o sistema de múltiplos calendários Google

export interface UserCalendar {
  id: string
  user_id: string
  google_calendar_id: string
  calendar_name: string
  calendar_color: string | null
  is_primary: boolean
  is_active: boolean
  access_token: string
  refresh_token: string | null
  expires_at: string
  created_at: string
  updated_at: string
}

export interface CalendarSyncLog {
  id: string
  user_calendar_id: string
  sync_type: 'create' | 'update' | 'delete' | 'sync'
  event_id: string | null
  status: 'success' | 'error' | 'pending'
  error_message: string | null
  created_at: string
}

export interface GoogleCalendarEvent {
  id: string
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
    responseStatus?: string
  }>
  status: string
  colorId?: string
}

export interface CalendarEventFormData {
  title: string
  description: string
  date: Date
  startTime: string
  endTime: string
  location: string
  attendeeEmail: string
  label: AppointmentLabel
  calendarId?: string
}

export interface AppointmentLabel {
  label: 'consulta' | 'retorno' | 'reagendamento'
  name: string
  color: string
  googleCalendarColorId: string
}

export interface CalendarViewProps {
  events: GoogleCalendarEvent[]
  selectedCalendars: string[]
  userCalendars: UserCalendar[]
  onCreateEvent?: (eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => Promise<GoogleCalendarEvent>
  onUpdateEvent?: (eventId: string, eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => Promise<void>
  onDeleteEvent?: (eventId: string) => Promise<void>
  onCalendarToggle?: (calendarId: string) => void
  isLoading?: boolean
}

export interface GoogleAuthState {
  isAuthenticated: boolean
  userCalendars: UserCalendar[]
  isLoading: boolean
  error: string | null
}

export interface MultiCalendarState {
  selectedCalendars: string[]
  events: GoogleCalendarEvent[]
  isLoading: boolean
  error: string | null
} 