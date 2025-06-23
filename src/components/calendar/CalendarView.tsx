
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, Edit } from 'lucide-react';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EditAppointmentModal from '@/components/agendamentos/EditAppointmentModal';

interface CalendarViewProps {
  events: GoogleCalendarEvent[];
  onCreateEvent?: () => void;
  isLoading?: boolean;
  onUpdateEvent?: (eventId: string, eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => Promise<void>;
  onDeleteEvent?: (eventId: string) => Promise<void>;
}

const CalendarView = ({ 
  events, 
  onCreateEvent, 
  isLoading, 
  onUpdateEvent, 
  onDeleteEvent 
}: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<GoogleCalendarEvent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      if (!event.start?.dateTime) return false;
      const eventDate = new Date(event.start.dateTime);
      return isSameDay(eventDate, day);
    });
  };

  const formatEventTime = (dateTimeString: string) => {
    return format(new Date(dateTimeString), 'HH:mm', { locale: ptBR });
  };

  const handleEditEvent = (event: GoogleCalendarEvent) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedEvent(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              {onCreateEvent && (
                <Button 
                  onClick={onCreateEvent}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Evento
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={day.toString()}
                  className={`min-h-[120px] p-2 border rounded-lg ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-orange-500' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday ? 'text-orange-600' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event, index) => (
                      <div
                        key={`${event.id}-${index}`}
                        className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate cursor-pointer hover:bg-blue-200 group relative"
                        title={`${event.summary} - ${formatEventTime(event.start.dateTime)}`}
                        onClick={() => handleEditEvent(event)}
                      >
                        <div className="font-medium truncate">{event.summary}</div>
                        <div className="text-blue-600 flex items-center justify-between">
                          <span>{formatEventTime(event.start.dateTime)}</span>
                          <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
              );
            })}
          </div>
          
          {/* Today's events detail */}
          {events.filter(event => {
            if (!event.start?.dateTime) return false;
            return isSameDay(new Date(event.start.dateTime), new Date());
          }).length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-3">Eventos de Hoje</h3>
              <div className="space-y-3">
                {events
                  .filter(event => {
                    if (!event.start?.dateTime) return false;
                    return isSameDay(new Date(event.start.dateTime), new Date());
                  })
                  .map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{event.summary}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatEventTime(event.start.dateTime)} - {formatEventTime(event.end.dateTime)}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          )}
                          {event.attendees && event.attendees.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {event.attendees.length} participante(s)
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{event.status}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEvent(event)}
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
  );
};

export default CalendarView;
