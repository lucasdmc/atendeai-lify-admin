
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CalendarDays, Clock, Users, TrendingUp, ChartPie } from 'lucide-react';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import { getLabelFromString, AppointmentLabel, appointmentLabels } from '@/utils/appointmentLabels';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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

  // Prepare data for pie chart
  const pieChartData = Object.entries(appointmentLabels)
    .map(([key, config]) => ({
      name: config.name,
      value: labelCounts[key as AppointmentLabel],
      color: config.color.includes('green') ? '#10b981' : 
             config.color.includes('blue') ? '#3b82f6' : '#f59e0b'
    }))
    .filter(item => item.value > 0);

  const statsCards = [
    {
      title: 'Hoje',
      value: todayEvents.length,
      icon: CalendarDays,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200',
      borderColor: 'border-blue-300',
      shadowColor: 'shadow-blue-100'
    },
    {
      title: 'Esta Semana',
      value: thisWeekEvents.length,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200',
      borderColor: 'border-purple-300',
      shadowColor: 'shadow-purple-100'
    },
    {
      title: 'Este Mês',
      value: thisMonthEvents.length,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200',
      borderColor: 'border-orange-300',
      shadowColor: 'shadow-orange-100'
    },
    {
      title: 'Total de Eventos',
      value: events.length,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 via-green-100 to-green-200',
      borderColor: 'border-green-300',
      shadowColor: 'shadow-green-100'
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{`${payload[0].name}: ${payload[0].value}`}</p>
          <p className="text-sm text-gray-500">
            {payload[0].value === 1 ? 'agendamento' : 'agendamentos'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`hover:shadow-xl transition-all duration-500 border-2 ${stat.borderColor} ${stat.bgColor} hover:scale-105 ${stat.shadowColor} relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-xs text-gray-500">
                      {stat.value === 1 ? 'agendamento' : 'agendamentos'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg`}>
                    <Icon className={`h-7 w-7 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* Gráfico de Pizza */}
        {pieChartData.length > 0 ? (
          <Card className="hover:shadow-xl transition-all duration-300 border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-xl bg-emerald-100">
                  <ChartPie className="h-6 w-6 text-emerald-600" />
                </div>
                Tipos de Consulta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => (
                        <span style={{ color: entry.color, fontWeight: 'medium' }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="hover:shadow-xl transition-all duration-300 border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-xl bg-emerald-100">
                  <ChartPie className="h-6 w-6 text-emerald-600" />
                </div>
                Tipos de Consulta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <ChartPie className="h-10 w-10 text-gray-300" />
                </div>
                <p className="text-lg font-medium">Nenhum agendamento encontrado</p>
                <p className="text-sm mt-1">Crie seu primeiro agendamento para ver as estatísticas</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AgendamentosStats;
