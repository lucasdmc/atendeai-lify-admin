
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import EventCard from '../EventCard';

interface DayViewProps {
  currentDate: Date;
  events: GoogleCalendarEvent[];
  onEditEvent: (event: GoogleCalendarEvent) => void;
  getEventsForDay: (day: Date) => GoogleCalendarEvent[];
}

const DayView = ({ currentDate, events, onEditEvent, getEventsForDay }: DayViewProps) => {
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
              onEdit={onEditEvent}
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

export default DayView;
