
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, format } from 'date-fns';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import EventCard from '../EventCard';

interface MonthViewProps {
  currentDate: Date;
  events: GoogleCalendarEvent[];
  onEditEvent: (event: GoogleCalendarEvent) => void;
  getEventsForDay: (day: Date) => GoogleCalendarEvent[];
}

const MonthView = ({ currentDate, onEditEvent, getEventsForDay }: MonthViewProps) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div>
      {/* Header dos dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50 rounded-md">
            {day}
          </div>
        ))}
      </div>
      
      {/* Grid do calendário */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={day.toString()}
              className={`min-h-[140px] p-2 border rounded-lg transition-colors ${
                isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
              } ${isToday ? 'ring-2 ring-orange-500 bg-orange-50' : ''}`}
            >
              {/* Número do dia */}
              <div className={`text-sm font-semibold mb-2 text-center ${
                isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              } ${isToday ? 'text-orange-600 bg-orange-100 rounded-full w-6 h-6 flex items-center justify-center mx-auto' : ''}`}>
                {format(day, 'd')}
              </div>
              
              {/* Lista de eventos */}
              <div className="space-y-1 overflow-hidden">
                {dayEvents.slice(0, 2).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={onEditEvent}
                    size="sm"
                  />
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500 text-center py-1 bg-gray-100 rounded-sm font-medium">
                    +{dayEvents.length - 2} mais
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

export default MonthView;
