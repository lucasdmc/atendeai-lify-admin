
import { startOfYear, endOfYear, eachMonthOfInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';

interface YearViewProps {
  currentDate: Date;
  events: GoogleCalendarEvent[];
  onEditEvent: (event: GoogleCalendarEvent) => void;
}

const YearView = ({ currentDate, events, onEditEvent }: YearViewProps) => {
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

export default YearView;
