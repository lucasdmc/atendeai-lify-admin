
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartPie } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ChartTooltip from './ChartTooltip';
import ChartLegend from './ChartLegend';

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface AppointmentsPieChartProps {
  data: PieChartData[];
}

const AppointmentsPieChart = ({ data }: AppointmentsPieChartProps) => {
  if (data.length === 0) {
    return (
      <Card className="hover:shadow-2xl transition-all duration-300 border-2 border-lify-pink/20 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 h-[280px] w-full">
        <CardHeader className="pb-2 px-4 pt-3 bg-gradient-to-r from-lify-pink/5 to-lify-purple/5">
          <CardTitle className="flex items-center gap-2 text-sm text-gray-800">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-lify-pink to-lify-purple border border-lify-pink/30 shadow-sm">
              <ChartPie className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-lify-pink to-lify-purple bg-clip-text text-transparent font-bold text-sm">
              Tipos de Consulta
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-center py-6 text-gray-600">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-lify-pink/20 to-lify-purple/20 flex items-center justify-center border-2 border-lify-pink/30">
              <ChartPie className="h-6 w-6 text-lify-pink" />
            </div>
            <p className="text-sm font-medium bg-gradient-to-r from-lify-pink to-lify-purple bg-clip-text text-transparent">Nenhum agendamento encontrado</p>
            <p className="text-xs mt-1 text-gray-500">Crie seu primeiro agendamento para ver as estatísticas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-2xl transition-all duration-300 border-2 border-lify-pink/20 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 overflow-hidden group h-[280px] w-full">
      <CardHeader className="pb-2 px-4 pt-3 bg-gradient-to-r from-lify-pink/5 to-lify-purple/5">
        <CardTitle className="flex items-center gap-2 text-sm text-gray-800">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-lify-pink to-lify-purple border border-lify-pink/30 shadow-sm">
            <ChartPie className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-lify-pink to-lify-purple bg-clip-text text-transparent font-bold text-sm">
            Tipos de Consulta
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {data.map((entry, index) => (
                  <filter key={`shadow-${index}`} id={`shadow-${index}`}>
                    <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor={entry.color} floodOpacity="0.3"/>
                  </filter>
                ))}
              </defs>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={35}
                outerRadius={70}
                paddingAngle={6}
                dataKey="value"
                strokeWidth={2}
                stroke="#ffffff"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    filter={`url(#shadow-${index})`}
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend content={<ChartLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentsPieChart;
