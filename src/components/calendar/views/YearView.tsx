
import { startOfYear, endOfYear, eachMonthOfInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

interface YearViewProps {
  currentDate: Date;
  events: GoogleCalendarEvent[];
  onEditEvent: (event: GoogleCalendarEvent) => void;
}

const YearView = ({ currentDate, events }: YearViewProps) => {
  const yearStart = startOfYear(currentDate);
  const yearEnd = endOfYear(currentDate);
  const monthsInYear = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  // Preparar dados para o gráfico de tendência
  const monthlyData = monthsInYear.map((month) => {
    const monthEvents = events.filter(event => {
      if (!event.start?.dateTime) return false;
      const eventDate = new Date(event.start.dateTime);
      return eventDate.getMonth() === month.getMonth() && eventDate.getFullYear() === month.getFullYear();
    });

    return {
      month: format(month, 'MMM', { locale: ptBR }),
      count: monthEvents.length,
      fullMonth: format(month, 'MMMM', { locale: ptBR })
    };
  });

  const totalEvents = events.filter(event => {
    if (!event.start?.dateTime) return false;
    const eventDate = new Date(event.start.dateTime);
    return eventDate.getFullYear() === currentDate.getFullYear();
  }).length;

  const chartConfig = {
    count: {
      label: "Agendamentos",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="space-y-6">
      {/* Gráfico de tendência anual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Tendência de Agendamentos - {currentDate.getFullYear()}
            <span className="text-sm font-normal text-gray-500">
              ({totalEvents} {totalEvents === 1 ? 'agendamento' : 'agendamentos'} no ano)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    labelFormatter={(value, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.fullMonth || value;
                    }}
                    formatter={(value, name) => [
                      `${value} ${value === 1 ? 'agendamento' : 'agendamentos'}`,
                      'Total'
                    ]}
                  />}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="var(--color-count)" 
                  strokeWidth={2}
                  dot={{ fill: "var(--color-count)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Grid de meses com contadores */}
      <div className="grid grid-cols-3 gap-4">
        {monthsInYear.map((month) => {
          const monthEvents = events.filter(event => {
            if (!event.start?.dateTime) return false;
            const eventDate = new Date(event.start.dateTime);
            return eventDate.getMonth() === month.getMonth() && eventDate.getFullYear() === month.getFullYear();
          });

          return (
            <Card key={month.toString()} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <h4 className="font-semibold text-gray-800">
                    {format(month, 'MMMM', { locale: ptBR })}
                  </h4>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {monthEvents.length}
                  </div>
                  <div className="text-sm text-gray-500">
                    {monthEvents.length === 1 ? 'agendamento' : 'agendamentos'}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default YearView;
