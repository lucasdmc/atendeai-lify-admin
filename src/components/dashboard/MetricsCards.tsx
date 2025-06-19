
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageSquare, 
  Clock, 
  Bot,
  TrendingUp
} from 'lucide-react';

interface DashboardMetrics {
  novas_conversas: number;
  aguardando_resposta: number;
  tempo_medio_chatbot: number;
}

interface MetricsCardsProps {
  metrics: DashboardMetrics;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics }) => {
  const metricCards = [
    {
      title: 'Novas Conversas',
      value: metrics.novas_conversas,
      description: 'Conversas iniciadas hoje',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Aguardando Resposta',
      value: metrics.aguardando_resposta,
      description: 'Conversas pendentes',
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100',
      borderColor: 'border-amber-200'
    },
    {
      title: 'Tempo Médio do Bot',
      value: `${metrics.tempo_medio_chatbot}s`,
      description: 'Tempo de resposta automática',
      icon: Bot,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className={`hover:shadow-lg transition-all duration-300 border-2 ${metric.borderColor} ${metric.bgColor} hover:scale-105`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-sm font-medium text-gray-700 mb-1">
                  {metric.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                    <Icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                </div>
              </div>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</div>
              <p className="text-sm text-gray-600">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
