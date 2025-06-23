
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, format } from 'date-fns';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import EventCard from '../EventCard';

interface MonthViewProps {
  currentDate: Date;
  events: GoogleCalendarEvent[];
  onEditEvent: (event: GoogleCalendarEvent) => void;
  getEventsForDay: (day: Date) => GoogleCalendarEvent[];
}

const MonthView = ({ currentDate, events, onEditEvent, getEventsForDay }: MonthViewProps) => {
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
                    onEdit={onEditEvent}
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

export default MonthView;
