import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart as LucidePieChart, TrendingUp, BarChart3 } from 'lucide-react';
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
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border-0 shadow-xl overflow-hidden group h-[320px] w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
        <CardHeader className="pb-3 px-6 pt-4 relative z-10">
          <CardTitle className="flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <LucidePieChart className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold">Distribuição de Eventos</span>
              <p className="text-sm text-gray-600 font-normal">Tipos de agendamentos</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 relative z-10">
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-4 border-blue-200/50 shadow-lg">
              <LucidePieChart className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum evento encontrado</h3>
            <p className="text-sm text-gray-600 mb-3">Crie seu primeiro agendamento para ver as estatísticas</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Aguardando dados</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border-0 shadow-xl overflow-hidden group h-[320px] w-full">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
      
      <CardHeader className="pb-3 px-6 pt-4 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <LucidePieChart className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold">Distribuição de Eventos</span>
              <p className="text-sm text-gray-600 font-normal">
                {totalValue} evento{totalValue !== 1 ? 's' : ''} no total
              </p>
            </div>
          </CardTitle>
          
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-200">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">Ativo</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 relative z-10">
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {data.map((entry, index) => (
                  <filter key={`shadow-${index}`} id={`shadow-${index}`}>
                    <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor={entry.color} floodOpacity="0.4"/>
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                ))}
                
                {/* Gradientes para cada seção */}
                {data.map((entry, index) => (
                  <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={entry.color} stopOpacity="1" />
                    <stop offset="100%" stopColor={entry.color} stopOpacity="0.8" />
                  </linearGradient>
                ))}
              </defs>
              
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={8}
                dataKey="value"
                strokeWidth={3}
                stroke="#ffffff"
                strokeLinejoin="round"
                animationDuration={1500}
                animationBegin={0}
              >
                {data.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#gradient-${index})`}
                    filter={`url(#shadow-${index})`}
                    className="hover:opacity-80 transition-opacity duration-200"
                  />
                ))}
              </Pie>
              
              <Tooltip 
                content={<ChartTooltip />}
                cursor={false}
                animationDuration={200}
              />
              <Legend 
                content={<ChartLegend />}
                verticalAlign="bottom"
                height={36}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Estatísticas rápidas */}
        <div className="mt-4 pt-4 border-t border-gray-200/50">
          <div className="grid grid-cols-2 gap-3">
            {data.slice(0, 2).map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-white/60 rounded-lg border border-gray-200/50">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-600">
                    {Math.round((item.value / totalValue) * 100)}% • {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentsPieChart;
