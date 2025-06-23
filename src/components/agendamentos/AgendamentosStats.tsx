
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Tag, TrendingUp, Users, Clock } from 'lucide-react';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import { getLabelConfig, getLabelFromString, AppointmentLabel, appointmentLabels } from '@/utils/appointmentLabels';

interface AgendamentosStatsProps {
  events: GoogleCalendarEvent[];
}

const AgendamentosStats = ({ events }: AgendamentosStatsProps) => {
  const today = new Date();
  
  const todayEvents = events.filter(event => {
    if (!event.start?.dateTime) return false;
    const eventDate = new Date(event.start.dateTime);
    return (
      eventDate.getDate() === today.getDate() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  });

  const thisWeekEvents = events.filter(event => {
    if (!event.start?.dateTime) return false;
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const eventDate = new Date(event.start.dateTime);
    return eventDate >= today && eventDate <= weekFromNow;
  });

  const thisMonthEvents = events.filter(event => {
    if (!event.start?.dateTime) return false;
    const eventDate = new Date(event.start.dateTime);
    return (
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  });

  const getEventLabel = (event: GoogleCalendarEvent): AppointmentLabel => {
    if (event.description) {
      const labelMatch = event.description.match(/\[LABEL:(\w+)\]/);
      if (labelMatch) {
        return getLabelFromString(labelMatch[1]);
      }
    }
    return 'consulta';
  };

  const labelCounts = Object.keys(appointmentLabels).reduce((acc, label) => {
    acc[label as AppointmentLabel] = events.filter(event => 
      getEventLabel(event) === label
    ).length;
    return acc;
  }, {} as Record<AppointmentLabel, number>);

  const statsCards = [
    {
      title: 'Hoje',
      value: todayEvents.length,
      icon: CalendarDays,
      color: 'text-blue-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Esta Semana',
      value: thisWeekEvents.length,
      icon: Clock,
      color: 'text-purple-500',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Este Mês',
      value: thisMonthEvents.length,
      icon: Users,
      color: 'text-orange-500',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Total de Eventos',
      value: events.length,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`hover:shadow-lg transition-all duration-300 border-2 ${stat.borderColor} ${stat.bgColor} hover:scale-105`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Estatísticas por Tipo */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-indigo-500" />
            Por Tipo de Consulta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(appointmentLabels).map(([key, config]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={config.color}>
                    <Tag className="h-3 w-3 mr-1" />
                    {config.name}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {labelCounts[key as AppointmentLabel]}
                  </span>
                  <span className="text-sm text-gray-500">
                    {labelCounts[key as AppointmentLabel] === 1 ? 'agendamento' : 'agendamentos'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {events.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum agendamento encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendamentosStats;
