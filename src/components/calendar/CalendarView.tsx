
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EditAppointmentModal from '@/components/agendamentos/EditAppointmentModal';
import CalendarViewSwitcher, { CalendarViewType } from './CalendarViewSwitcher';
import EventCard from './EventCard';

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
  const [viewType, setViewType] = useState<CalendarViewType>('month');

  const goToPrevious = () => {
    switch (viewType) {
      case 'day':
        setCurrentDate(addDays(currentDate, -1));
        break;
      case 'week':
        setCurrentDate(addDays(currentDate, -7));
        break;
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'year':
        setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate()));
        break;
    }
  };

  const goToNext = () => {
    switch (viewType) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addDays(currentDate, 7));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'year':
        setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate()));
        break;
    }
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      if (!event.start?.dateTime) return false;
      const eventDate = new Date(event.start.dateTime);
      return isSameDay(eventDate, day);
    });
  };

  const handleEditEvent = (event: GoogleCalendarEvent) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedEvent(null);
  };

  const getViewTitle = () => {
    switch (viewType) {
      case 'day':
        return format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
      case 'week':
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return `${format(weekStart, 'd MMM', { locale: ptBR })} - ${format(weekEnd, 'd MMM yyyy', { locale: ptBR })}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: ptBR });
      case 'year':
        return format(currentDate, 'yyyy', { locale: ptBR });
    }
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDay(currentDate);
    
    return (
      <div className="space-y-4">
        <div className="text-center py-4 bg-orange-50 rounded-lg">
          <h3 className="text-lg font-semibold text-orange-800">
            {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
        </div>
        
        <div className="space-y-3">
          {dayEvents.length > 0 ? (
            dayEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={handleEditEvent}
                size="md"
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum evento para este dia</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded-t-lg">
            {day}
          </div>
        ))}
        
        {weekDays.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={day.toString()}
              className={`min-h-[200px] p-2 border rounded-b-lg ${
                isToday ? 'bg-orange-50 border-orange-200' : 'bg-white'
              }`}
            >
              <div className={`text-sm font-medium mb-2 ${
                isToday ? 'text-orange-600' : 'text-gray-900'
              }`}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEditEvent}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
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
                  {dayEvents.slice(0, 3).map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEdit={handleEditEvent}
                      size="sm"
                    />
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
      </div>
    );
  };

  const renderYearView = () => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    const monthsInYear = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    return (
      <div className="grid grid-cols-3 gap-4">
        {monthsInYear.map((month) => {
          const monthEvents = events.filter(event => {
            if (!event.start?.dateTime) return false;
            const eventDate = new Date(event.start.dateTime);
            return eventDate.getMonth() === month.getMonth() && eventDate.getFullYear() === month.getFullYear();
          });

          return (
            <div key={month.toString()} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-center mb-2 text-gray-800">
                {format(month, 'MMMM', { locale: ptBR })}
              </h4>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {monthEvents.length}
                </div>
                <div className="text-xs text-gray-500">
                  {monthEvents.length === 1 ? 'evento' : 'eventos'}
                </div>
              </div>
              
              {monthEvents.length > 0 && (
                <div className="mt-2 space-y-1">
                  {monthEvents.slice(0, 2).map((event) => (
                    <div key={event.id} className="text-xs p-1 bg-blue-50 rounded truncate">
                      {event.summary}
                    </div>
                  ))}
                  {monthEvents.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{monthEvents.length - 2} mais
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
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
              {getViewTitle()}
            </CardTitle>
            <div className="flex items-center gap-4">
              <CalendarViewSwitcher 
                currentView={viewType} 
                onViewChange={setViewType} 
              />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goToPrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNext}>
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
          </div>
        </CardHeader>
        <CardContent>
          {viewType === 'day' && renderDayView()}
          {viewType === 'week' && renderWeekView()}
          {viewType === 'month' && renderMonthView()}
          {viewType === 'year' && renderYearView()}
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
