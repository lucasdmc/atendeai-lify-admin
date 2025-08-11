import { useState } from 'react'
import { Button } from '@/components/ui/button'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Plus, 
  ChevronDown,
  ChevronUp,
  Trash2,
  Clock,
  MapPin
} from 'lucide-react'
import { UserCalendar } from '@/types/calendar'
import { GoogleCalendarEvent } from '@/types/calendar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'


interface CalendarSidebarProps {
  isOpen: boolean
  userCalendars: UserCalendar[]
  selectedCalendars: string[]
  onCalendarToggle: (calendarId: string) => void
  onAddCalendar: () => void
  onDisconnectCalendars: (calendarIds?: string[]) => void
  events: GoogleCalendarEvent[]
  isLoading: boolean
  clinicName?: string // Nome da clínica selecionada
}

const CalendarSidebar = ({
  isOpen,
  userCalendars,
  selectedCalendars,
  onCalendarToggle,
  onAddCalendar,
  onDisconnectCalendars,
  events,
  clinicName
}: CalendarSidebarProps) => {
  const [showUpcoming, setShowUpcoming] = useState(true)
  const [showCalendars, setShowCalendars] = useState(true)

  const getCalendarColor = (color: string | null) => {
    return color || '#4285f4'
  }

  const upcomingEvents = events
    .filter(event => new Date(event.start.dateTime) > new Date())
    .sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime())
    .slice(0, 5)

  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.start.dateTime)
    const today = new Date()
    return eventDate.toDateString() === today.toDateString()
  })

  if (!isOpen) return null

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Clinic info */}
      {clinicName && (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <h2 className="text-sm font-medium text-blue-900">Clínica Ativa</h2>
          <p className="text-sm text-blue-700">{clinicName}</p>
        </div>
      )}
      
      {/* Upcoming events */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Próximos eventos</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUpcoming(!showUpcoming)}
            className="p-1"
          >
            {showUpcoming ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        {showUpcoming && (
          <div className="space-y-2">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum evento próximo</p>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event.id} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <div className="flex items-start gap-2">
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: getCalendarColor(null) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.summary}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {format(new Date(event.start.dateTime), 'HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500 truncate">
                            {event.location}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Today's events */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Hoje</h3>
        <div className="space-y-2">
          {todayEvents.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum evento hoje</p>
          ) : (
            todayEvents.map((event) => (
              <div key={event.id} className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-2">
                  <div
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: getCalendarColor(null) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {event.summary}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">
                        {format(new Date(event.start.dateTime), 'HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Calendars section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Meus calendários</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCalendars(!showCalendars)}
              className="p-1"
            >
              {showCalendars ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {showCalendars && (
            <div className="space-y-2">
              {userCalendars.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">Nenhum calendário conectado</p>
                  <Button onClick={onAddCalendar} size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Conectar calendário
                  </Button>
                </div>
              ) : (
                <>
                  {userCalendars.map((calendar) => (
                    <div key={calendar.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={calendar.id}
                        checked={selectedCalendars.includes(calendar.google_calendar_id)}
                        onCheckedChange={() => onCalendarToggle(calendar.google_calendar_id)}
                      />
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getCalendarColor(calendar.calendar_color) }}
                      />
                      <label
                        htmlFor={calendar.id}
                        className="flex-1 text-sm font-medium text-gray-900 cursor-pointer truncate"
                      >
                        {calendar.calendar_name}
                      </label>
                      {calendar.is_primary && (
                        <Badge variant="secondary" className="text-xs">
                          Principal
                        </Badge>
                      )}
                    </div>
                  ))}
                  
                  <Separator className="my-4" />
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onAddCalendar}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDisconnectCalendars(selectedCalendars)}
                      className="flex-1"
                      disabled={selectedCalendars.length === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{events.length} eventos</span>
          <span>{selectedCalendars.length} ativos</span>
        </div>
      </div>
    </div>
  )
}

export default CalendarSidebar