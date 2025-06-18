
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  MessageSquare, 
  Clock, 
  Bot, 
  Users,
  TrendingUp,
  TrendingDown,
  Zap,
  DollarSign
} from 'lucide-react';

interface Metric {
  metric_name: string;
  metric_value: number;
}

const Dashboard = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_metrics')
        .select('metric_name, metric_value')
        .eq('metric_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricValue = (name: string) => {
    const metric = metrics.find(m => m.metric_name === name);
    return metric ? metric.metric_value : 0;
  };

  const metricCards = [
    {
      title: 'Novas Conversas',
      value: getMetricValue('novas_conversas'),
      description: 'Hoje',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Aguardando Resposta',
      value: getMetricValue('aguardando_resposta'),
      description: 'Pendentes',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Tempo Médio (Chatbot)',
      value: `${getMetricValue('tempo_medio_chatbot')}s`,
      description: 'Resposta automática',
      icon: Bot,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Tempo Médio (Atendente)',
      value: `${getMetricValue('tempo_medio_atendente')}min`,
      description: 'Resposta humana',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Taxa de Resolução',
      value: `${getMetricValue('taxa_resolucao')}%`,
      description: 'Self-service',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      title: 'Taxa de Transferência',
      value: `${getMetricValue('taxa_transferencia')}%`,
      description: 'Para agente humano',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Satisfação do Usuário',
      value: `${getMetricValue('satisfacao_usuario')}/5`,
      description: 'Avaliação média',
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Custo por Interação',
      value: `R$ ${getMetricValue('custo_por_interacao').toFixed(2)}`,
      description: 'Economia gerada',
      icon: DollarSign,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    }
  ];

  const chartData = [
    { name: 'Agendamento', value: 45 },
    { name: 'Informações', value: 30 },
    { name: 'Cancelamento', value: 15 },
    { name: 'Resultados', value: 10 },
    { name: 'Outros', value: 8 }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            Top 5 assuntos mais discutidos hoje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
