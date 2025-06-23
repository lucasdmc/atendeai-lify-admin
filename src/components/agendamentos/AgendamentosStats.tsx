
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

  // Prepare data for pie chart with Lify brand colors
  const lifyColors = ['#e91e63', '#9c27b0', '#673ab7', '#ff5722', '#ff9800'];
  
  const pieChartData = Object.entries(appointmentLabels)
    .map(([key, config], index) => ({
      name: config.name,
      value: labelCounts[key as AppointmentLabel],
      color: lifyColors[index % lifyColors.length]
    }))
    .filter(item => item.value > 0);

  const statsCards = [
    {
      title: 'Hoje',
      value: todayEvents.length,
      icon: CalendarDays,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-lify-pink via-lify-purple to-lify-deep-purple',
      borderColor: 'border-lify-pink/40',
      shadowColor: 'shadow-lify-pink/20'
    },
    {
      title: 'Esta Semana',
      value: thisWeekEvents.length,
      icon: Clock,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-lify-orange via-lify-amber to-lify-orange',
      borderColor: 'border-lify-orange/40',
      shadowColor: 'shadow-lify-orange/20'
    },
    {
      title: 'Este Mês',
      value: thisMonthEvents.length,
      icon: Users,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-lify-purple via-lify-deep-purple to-lify-purple',
      borderColor: 'border-lify-purple/40',
      shadowColor: 'shadow-lify-purple/20'
    },
    {
      title: 'Total de Eventos',
      value: events.length,
      icon: TrendingUp,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-lify-pink via-lify-orange to-lify-amber',
      borderColor: 'border-lify-pink/40',
      shadowColor: 'shadow-lify-pink/20'
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border-2 border-lify-pink/20 rounded-xl shadow-2xl backdrop-blur-sm">
          <p className="font-bold text-gray-800 text-lg">{`${payload[0].name}: ${payload[0].value}`}</p>
          <p className="text-sm text-gray-600 mt-1">
            {payload[0].value === 1 ? 'agendamento' : 'agendamentos'}
          </p>
          <div 
            className="w-4 h-4 rounded-full mt-2 mx-auto border-2 border-white shadow-md"
            style={{ backgroundColor: payload[0].payload.color }}
          />
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    if (!payload?.length) return null;

    return (
      <div className="flex flex-wrap justify-center gap-4 mt-6">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium text-gray-700">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`hover:shadow-2xl transition-all duration-500 border-2 ${stat.borderColor} ${stat.bgColor} hover:scale-105 ${stat.shadowColor} relative overflow-hidden group`}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8 group-hover:scale-125 transition-transform duration-500"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/90 mb-2">{stat.title}</p>
                    <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                    <p className="text-xs text-white/80">
                      {stat.value === 1 ? 'agendamento' : 'agendamentos'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg border border-white/30 group-hover:bg-white/30 transition-all duration-300">
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
          <Card className="hover:shadow-2xl transition-all duration-300 border-2 border-lify-pink/20 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 overflow-hidden group">
            <CardHeader className="pb-4 bg-gradient-to-r from-lify-pink/5 to-lify-purple/5">
              <CardTitle className="flex items-center gap-3 text-xl text-gray-800">
                <div className="p-3 rounded-xl bg-gradient-to-br from-lify-pink to-lify-purple border border-lify-pink/30 shadow-lg">
                  <ChartPie className="h-6 w-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-lify-pink to-lify-purple bg-clip-text text-transparent font-bold">
                  Tipos de Consulta
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {pieChartData.map((entry, index) => (
                        <filter key={`shadow-${index}`} id={`shadow-${index}`}>
                          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor={entry.color} floodOpacity="0.3"/>
                        </filter>
                      ))}
                    </defs>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={8}
                      dataKey="value"
                      strokeWidth={3}
                      stroke="#ffffff"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          filter={`url(#shadow-${index})`}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="hover:shadow-2xl transition-all duration-300 border-2 border-lify-pink/20 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30">
            <CardHeader className="pb-4 bg-gradient-to-r from-lify-pink/5 to-lify-purple/5">
              <CardTitle className="flex items-center gap-3 text-xl text-gray-800">
                <div className="p-3 rounded-xl bg-gradient-to-br from-lify-pink to-lify-purple border border-lify-pink/30 shadow-lg">
                  <ChartPie className="h-6 w-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-lify-pink to-lify-purple bg-clip-text text-transparent font-bold">
                  Tipos de Consulta
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-600">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-lify-pink/20 to-lify-purple/20 flex items-center justify-center border-2 border-lify-pink/30">
                  <ChartPie className="h-10 w-10 text-lify-pink" />
                </div>
                <p className="text-lg font-medium bg-gradient-to-r from-lify-pink to-lify-purple bg-clip-text text-transparent">Nenhum agendamento encontrado</p>
                <p className="text-sm mt-1 text-gray-500">Crie seu primeiro agendamento para ver as estatísticas</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AgendamentosStats;
