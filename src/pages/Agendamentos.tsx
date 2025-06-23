
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Plus, Settings, Users, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Agendamentos = () => {
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  const handleConnectGoogle = () => {
    // TODO: Implementar integração com Google Calendar API
    console.log('Conectar com Google Calendar');
    setIsGoogleConnected(true);
  };

  const upcomingAppointments = [
    {
      id: 1,
      client: 'João Silva',
      service: 'Consulta',
      date: 'Hoje',
      time: '14:00 - 15:00',
      status: 'confirmado'
    },
    {
      id: 2,
      client: 'Maria Santos',
      service: 'Retorno',
      date: 'Amanhã',
      time: '09:30 - 10:30',
      status: 'pendente'
    },
    {
      id: 3,
      client: 'Pedro Costa',
      service: 'Avaliação',
      date: 'Quinta',
      time: '16:00 - 17:00',
      status: 'confirmado'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agendamentos</h1>
          <p className="text-gray-600 mt-2">Gerencie seus agendamentos e integração com Google Calendar</p>
        </div>
        
        <div className="flex gap-2">
          {!isGoogleConnected && (
            <Button 
              variant="outline"
              onClick={handleConnectGoogle}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Conectar Google Calendar
            </Button>
          )}
          <Button 
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            disabled={!isGoogleConnected}
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
                <h3 className="font-semibold">Google Calendar</h3>
                <p className="text-sm text-gray-600">
                  {isGoogleConnected ? 'Conectado e sincronizado' : 'Não conectado'}
                </p>
              </div>
            </div>
            <Badge variant={isGoogleConnected ? "default" : "secondary"}>
              {isGoogleConnected ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {isGoogleConnected ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <span className="font-bold text-xl">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Esta Semana</span>
                  <span className="font-bold text-xl">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Este Mês</span>
                  <span className="font-bold text-xl">45</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taxa de Ocupação</span>
                  <span className="font-bold text-xl text-green-600">78%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Próximos agendamentos */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Próximos Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{appointment.client}</p>
                        <p className="text-sm text-gray-600">{appointment.service}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {appointment.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-2">
                        {appointment.date}
                      </Badge>
                      <p className="text-xs text-gray-500">
                        Status: {appointment.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                  <Plus className="h-6 w-6" />
                  <span className="text-sm">Novo Agendamento</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                  <Calendar className="h-6 w-6" />
                  <span className="text-sm">Ver Calendário</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Gerenciar Clientes</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                  <Settings className="h-6 w-6" />
                  <span className="text-sm">Configurações</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Google Calendar não configurado</h3>
              <p className="text-gray-600 mb-6">
                Para usar o módulo de agendamentos, você precisa conectar sua conta do Google Calendar.
                Isso permitirá sincronização automática e gerenciamento integrado dos seus compromissos.
              </p>
              <Button 
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                onClick={handleConnectGoogle}
              >
                <Settings className="h-4 w-4 mr-2" />
                Conectar Google Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Agendamentos;
