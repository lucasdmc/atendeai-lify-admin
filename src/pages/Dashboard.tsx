
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  MessageSquare, 
  Clock, 
  Bot, 
  TrendingUp
} from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

const Dashboard = () => {
  const { metrics, topicsData, loading, refreshMetrics } = useDashboardMetrics();

  const metricCards = [
    {
      title: 'Novas Conversas',
      value: metrics.novas_conversas,
      description: 'Hoje',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Aguardando Resposta',
      value: metrics.aguardando_resposta,
      description: 'Pendentes',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Tempo Médio (Chatbot)',
      value: `${metrics.tempo_medio_chatbot}s`,
      description: 'Resposta automática',
      icon: Bot,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <button 
          onClick={refreshMetrics}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
        >
          Atualizar Métricas
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-md ${metric.bgColor}`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Principais Tópicos de Conversas</CardTitle>
          <CardDescription>
            Tópicos mais discutidos hoje baseados nas conversas do WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topicsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topicsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="value" 
                  fill="url(#gradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum tópico encontrado para hoje</p>
                <p className="text-sm">Conversas do WhatsApp aparecerão aqui</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
