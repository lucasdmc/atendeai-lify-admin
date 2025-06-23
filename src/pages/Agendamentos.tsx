
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Settings, Users, CalendarDays, Loader2, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGoogleServiceAccount } from '@/hooks/useGoogleServiceAccount';
import CalendarView from '@/components/calendar/CalendarView';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Agendamentos = () => {
  const {
    isConnected,
    isLoading,
    events,
    isLoadingEvents,
    calendarId,
    refetch,
  } = useGoogleServiceAccount();

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agendamentos</h1>
            <p className="text-gray-600 mt-2">Gerencie seus agendamentos integrados ao Google Calendar</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agendamentos</h1>
          <p className="text-gray-600 mt-2">Gerencie seus agendamentos integrados ao Google Calendar</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={refetch}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Atualizar
          </Button>
          <Button 
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            disabled
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Status da integração */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="font-semibold">Google Calendar - Service Account</h3>
                <p className="text-sm text-gray-600">
                  {isConnected ? `Conectado ao calendário: ${calendarId}` : 'Não conectado'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected && <CheckCircle className="h-5 w-5 text-green-500" />}
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {isConnected ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Estatísticas */}
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

          {/* Próximos agendamentos */}
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

          {/* Visualização do Calendário */}
          <div className="lg:col-span-3">
            <CalendarView 
              events={events} 
              isLoading={isLoadingEvents}
            />
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Service Account não configurada</h3>
              <p className="text-gray-600 mb-6">
                A integração com Google Calendar via Service Account não está funcionando.
                Verifique se as credenciais estão corretas e se o calendário está acessível.
              </p>
              <p className="text-sm text-gray-500">
                Calendário configurado: {calendarId}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Agendamentos;
