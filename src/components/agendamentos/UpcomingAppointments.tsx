
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Loader2 } from 'lucide-react';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UpcomingAppointmentsProps {
  events: GoogleCalendarEvent[];
  isLoadingEvents: boolean;
}

const UpcomingAppointments = ({ events, isLoadingEvents }: UpcomingAppointmentsProps) => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-orange-500" />
          Próximos Agendamentos
          {isLoadingEvents && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.slice(0, 5).map((event) => (
            <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{event.summary}</p>
                  {event.description && (
                    <p className="text-sm text-gray-600">{event.description}</p>
                  )}
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(event.start.dateTime), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-2">
                  {format(new Date(event.start.dateTime), 'dd/MM', { locale: ptBR })}
                </Badge>
                <p className="text-xs text-gray-500">
                  Status: {event.status}
                </p>
              </div>
            </div>
          ))}
          {events.length === 0 && !isLoadingEvents && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum evento encontrado</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingAppointments;
