import { useState } from 'react'
import { GoogleCalendarEvent } from '@/types/calendar'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Clock, MapPin } from 'lucide-react'
import EditAppointmentModal from './EditAppointmentModal'

interface CalendarMainViewProps {
  events: GoogleCalendarEvent[]
  currentDate: Date
  viewType: 'day' | 'week' | 'month'
  isLoading: boolean
  onCreateEvent: (eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => Promise<GoogleCalendarEvent>
  onUpdateEvent: (eventId: string, eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => Promise<void>
  onDeleteEvent: (eventId: string) => Promise<void>
  onDateClick: (date: Date) => void
}

const CalendarMainView = ({
  events,
  currentDate,
  viewType,
  isLoading,
  onUpdateEvent,
  onDeleteEvent,
  onDateClick
}: CalendarMainViewProps) => {
  const [selectedEvent, setSelectedEvent] = useState<GoogleCalendarEvent | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const handleEditEvent = (event: GoogleCalendarEvent) => {
    setSelectedEvent(event)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSelectedEvent(null)
  }

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start.dateTime)
      return isSameDay(eventDate, day)
    })
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    
    const days = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd
    })

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    return (
      <div className="h-full flex flex-col">
        {/* Header dos dias da semana */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {weekDays.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Grid do calendário */}
        <div className="flex-1 grid grid-cols-7 gap-0 overflow-hidden">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isDayToday = isToday(day)
            
            return (
              <div
                key={day.toString()}
                className={cn(
                  'border-r border-b border-gray-200 p-2 bg-white hover:bg-gray-50 transition-colors cursor-pointer min-h-[120px]',
                  !isCurrentMonth && 'bg-gray-50/50 text-gray-400'
                )}
                onClick={() => onDateClick(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-sm font-medium',
                    isDayToday && 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs'
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {dayEvents.length}
                    </span>
                  )}
                </div>
                
                {/* Eventos do dia */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="p-1 rounded text-xs bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors cursor-pointer truncate"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditEvent(event)
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="font-medium truncate">
                          {format(new Date(event.start.dateTime), 'HH:mm')}
                        </span>
                      </div>
                      <div className="truncate font-medium">
                        {event.summary}
                      </div>
                    </div>
                  ))}
                  
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayEvents.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="h-full flex flex-col">
        {/* Header dos dias */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <div className="w-20 p-3 text-sm font-medium text-gray-700">
            Hora
          </div>
          {weekDays.map((day) => (
            <div key={day.toString()} className="flex-1 p-3 text-center border-l border-gray-200">
              <div className="text-sm font-medium text-gray-700">
                {format(day, 'EEE', { locale: ptBR })}
              </div>
              <div className={cn(
                'text-lg font-semibold',
                isToday(day) && 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto'
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Grid de horas */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex">
            {/* Coluna de horas */}
            <div className="w-20">
              {hours.map((hour) => (
                <div key={hour} className="h-16 border-b border-gray-200 p-2 text-xs text-gray-500">
                  {hour === 0 ? '00:00' : `${hour.toString().padStart(2, '0')}:00`}
                </div>
              ))}
            </div>

            {/* Colunas dos dias */}
            {weekDays.map((day) => (
              <div key={day.toString()} className="flex-1 border-l border-gray-200 relative">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-16 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() => onDateClick(day)}
                  />
                ))}
                
                {/* Eventos do dia */}
                {getEventsForDay(day).map((event) => {
                  const startTime = new Date(event.start.dateTime)
                  const endTime = new Date(event.end.dateTime)
                  const startHour = startTime.getHours()
                  const startMinute = startTime.getMinutes()
                  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
                  
                  return (
                    <div
                      key={event.id}
                      className="absolute left-1 right-1 bg-blue-100 border border-blue-200 rounded p-1 text-xs cursor-pointer hover:bg-blue-200 transition-colors"
                      style={{
                        top: `${(startHour + startMinute / 60) * 64}px`,
                        height: `${Math.max(duration * 64, 32)}px`
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditEvent(event)
                      }}
                    >
                      <div className="font-medium text-blue-800 truncate">
                        {event.summary}
                      </div>
                      <div className="text-blue-600">
                        {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayEvents = getEventsForDay(currentDate)

    return (
      <div className="h-full flex flex-col">
        {/* Header do dia */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <div className="w-20 p-3 text-sm font-medium text-gray-700">
            Hora
          </div>
          <div className="flex-1 p-3 text-center">
            <div className="text-sm font-medium text-gray-700">
              {format(currentDate, 'EEEE', { locale: ptBR })}
            </div>
            <div className={cn(
              'text-lg font-semibold',
              isToday(currentDate) && 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto'
            )}>
              {format(currentDate, 'd')}
            </div>
          </div>
        </div>

        {/* Grid de horas */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex">
            {/* Coluna de horas */}
            <div className="w-20">
              {hours.map((hour) => (
                <div key={hour} className="h-16 border-b border-gray-200 p-2 text-xs text-gray-500">
                  {hour === 0 ? '00:00' : `${hour.toString().padStart(2, '0')}:00`}
                </div>
              ))}
            </div>

            {/* Coluna do dia */}
            <div className="flex-1 border-l border-gray-200 relative">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-16 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onDateClick(currentDate)}
                />
              ))}
              
              {/* Eventos do dia */}
              {dayEvents.map((event) => {
                const startTime = new Date(event.start.dateTime)
                const endTime = new Date(event.end.dateTime)
                const startHour = startTime.getHours()
                const startMinute = startTime.getMinutes()
                const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
                
                return (
                  <div
                    key={event.id}
                    className="absolute left-1 right-1 bg-blue-100 border border-blue-200 rounded p-2 text-sm cursor-pointer hover:bg-blue-200 transition-colors"
                    style={{
                      top: `${(startHour + startMinute / 60) * 64}px`,
                      height: `${Math.max(duration * 64, 48)}px`
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditEvent(event)
                    }}
                  >
                    <div className="font-medium text-blue-800 truncate">
                      {event.summary}
                    </div>
                    <div className="text-blue-600 text-xs">
                      {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCurrentView = () => {
    switch (viewType) {
      case 'day':
        return renderDayView()
      case 'week':
        return renderWeekView()
      case 'month':
        return renderMonthView()
      default:
        return renderMonthView()
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 bg-white overflow-hidden">
        {renderCurrentView()}
      </div>

      {/* Edit Event Modal */}
      {onUpdateEvent && onDeleteEvent && (
        <EditAppointmentModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          event={selectedEvent}
          onUpdateEvent={onUpdateEvent}
          onDeleteEvent={onDeleteEvent}
        />
      )}
    </>
  )
}

export default CalendarMainView