
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageSquare, 
  Clock, 
  Bot
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

  return (
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
  );
};
