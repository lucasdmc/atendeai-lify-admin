
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
      <Card className="hover:shadow-2xl transition-all duration-300 border-2 border-lify-pink/20 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 h-[280px]">
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
    );
  }

  return (
    <Card className="hover:shadow-2xl transition-all duration-300 border-2 border-lify-pink/20 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 overflow-hidden group h-[280px]">
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
      <CardContent className="p-3">
        <div className="h-48">
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
                innerRadius={50}
                outerRadius={90}
                paddingAngle={8}
                dataKey="value"
                strokeWidth={3}
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
