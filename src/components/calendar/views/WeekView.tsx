
import { addDays, startOfWeek, format, isSameDay } from 'date-fns';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import EventCard from '../EventCard';

interface WeekViewProps {
  currentDate: Date;
  events: GoogleCalendarEvent[];
  onEditEvent: (event: GoogleCalendarEvent) => void;
  getEventsForDay: (day: Date) => GoogleCalendarEvent[];
}

const WeekView = ({ currentDate, events, onEditEvent, getEventsForDay }: WeekViewProps) => {
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
                  onEdit={onEditEvent}
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

export default WeekView;
