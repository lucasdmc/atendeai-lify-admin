
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';

interface AgendamentosStatsProps {
  events: GoogleCalendarEvent[];
}

const AgendamentosStats = ({ events }: AgendamentosStatsProps) => {
  const todayEvents = events.filter(event => {
    if (!event.start?.dateTime) return false;
    const today = new Date();
    const eventDate = new Date(event.start.dateTime);
    return (
      eventDate.getDate() === today.getDate() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  });

  const thisWeekEvents = events.filter(event => {
    if (!event.start?.dateTime) return false;
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const eventDate = new Date(event.start.dateTime);
    return eventDate >= today && eventDate <= weekFromNow;
  });

  const thisMonthEvents = events.filter(event => {
    if (!event.start?.dateTime) return false;
    const today = new Date();
    const eventDate = new Date(event.start.dateTime);
    return (
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-500" />
          Estatísticas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Hoje</span>
            <span className="font-bold text-xl">{todayEvents.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Esta Semana</span>
            <span className="font-bold text-xl">{thisWeekEvents.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Este Mês</span>
            <span className="font-bold text-xl">{thisMonthEvents.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total de Eventos</span>
            <span className="font-bold text-xl text-green-600">{events.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgendamentosStats;
