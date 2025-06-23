
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartPie } from 'lucide-react';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import { getLabelFromString, AppointmentLabel, appointmentLabels } from '@/utils/appointmentLabels';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AgendamentosStatsProps {
  events: GoogleCalendarEvent[];
}

const AgendamentosStats = ({ events }: AgendamentosStatsProps) => {
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
  const pieChartData = Object.entries(appointmentLabels)
    .map(([key, config], index) => {
      const lifyColors = ['#e91e63', '#9c27b0', '#673ab7', '#ff5722', '#ff9800'];
      return {
        name: config.name,
        value: labelCounts[key as AppointmentLabel],
        color: lifyColors[index % lifyColors.length]
      };
    })
    .filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-xl backdrop-blur-sm">
          <p className="font-semibold text-gray-800 text-base">{`${payload[0].name}: ${payload[0].value}`}</p>
          <p className="text-sm text-gray-600 mt-1">
            {payload[0].value === 1 ? 'agendamento' : 'agendamentos'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* Gráfico de Pizza */}
        {pieChartData.length > 0 ? (
          <Card className="hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-4 text-2xl font-bold">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-lify-pink/20 to-lify-purple/20 border border-lify-pink/30">
                  <ChartPie className="h-8 w-8 text-lify-purple" />
                </div>
                <span className="bg-gradient-to-r from-lify-pink to-lify-purple bg-clip-text text-transparent">
                  Tipos de Consulta
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={140}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          style={{
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={60}
                      formatter={(value, entry) => (
                        <span 
                          style={{ 
                            color: entry.color, 
                            fontWeight: '600',
                            fontSize: '14px'
                          }}
                        >
                          {value}
                        </span>
                      )}
                      wrapperStyle={{
                        paddingTop: '20px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-4 text-2xl font-bold">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-lify-pink/20 to-lify-purple/20 border border-lify-pink/30">
                  <ChartPie className="h-8 w-8 text-lify-purple" />
                </div>
                <span className="bg-gradient-to-r from-lify-pink to-lify-purple bg-clip-text text-transparent">
                  Tipos de Consulta
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-lify-pink/10 to-lify-purple/10 flex items-center justify-center border border-lify-pink/20">
                  <ChartPie className="h-12 w-12 text-lify-purple/60" />
                </div>
                <p className="text-xl font-semibold text-gray-700 mb-2">Nenhum agendamento encontrado</p>
                <p className="text-gray-500">Crie seu primeiro agendamento para ver as estatísticas</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AgendamentosStats;
