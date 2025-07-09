
import { addDays, startOfWeek, format, isSameDay } from 'date-fns';

import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import EventCard from '../EventCard';

interface WeekViewProps {
  currentDate: Date;
  events: GoogleCalendarEvent[];
  onEditEvent: (event: GoogleCalendarEvent) => void;
  getEventsForDay: (day: Date) => GoogleCalendarEvent[];
}

const WeekView = ({ currentDate, onEditEvent, getEventsForDay }: WeekViewProps) => {
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Header dos dias */}
      {weekDays.map((day, index) => {
        const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][index];
        const isToday = isSameDay(day, new Date());
        
        return (
          <div key={day.toString()} className={`p-3 text-center rounded-t-lg border-b-2 ${
            isToday ? 'bg-orange-100 border-orange-500' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="text-sm font-medium text-gray-500 mb-1">{dayName}</div>
            <div className={`text-lg font-bold ${
              isToday ? 'text-orange-600' : 'text-gray-900'
            }`}>
              {format(day, 'd')}
            </div>
          </div>
        );
      })}
      
      {/* Conteúdo dos dias */}
      {weekDays.map((day) => {
        const dayEvents = getEventsForDay(day);
        const isToday = isSameDay(day, new Date());
        
        return (
          <div
            key={`content-${day.toString()}`}
            className={`min-h-[300px] p-3 border rounded-b-lg ${
              isToday ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'
            }`}
          >
            <div className="space-y-2">
              {dayEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEdit={onEditEvent}
                  size="md"
                />
              ))}
              {dayEvents.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-sm">Nenhum evento</div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeekView;
