
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardMetrics {
  novas_conversas: number;
  conversas_andamento: number;
  aguardando_resposta: number;
  tempo_medio_chatbot: number;
}

interface TopicData {
  name: string;
  value: number;
}

export const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    novas_conversas: 0,
    conversas_andamento: 0,
    aguardando_resposta: 0,
    tempo_medio_chatbot: 0
  });
  const [topicsData, setTopicsData] = useState<TopicData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Chamar a edge function para atualizar métricas
      const { data: metricsResponse, error: metricsError } = await supabase.functions
        .invoke('update-dashboard-metrics');

      if (metricsError) {
        console.error('Erro ao atualizar métricas:', metricsError);
      } else if (metricsResponse?.metrics) {
        setMetrics(metricsResponse.metrics);
      }

      // Buscar tópicos principais das conversas de hoje
      const hoje = new Date().toISOString().split('T')[0];
      const { data: mensagensHoje, error: mensagensError } = await supabase
        .from('whatsapp_messages')
        .select('content')
        .eq('message_type', 'received')
        .gte('created_at', hoje)
        .limit(100);

      if (!mensagensError && mensagensHoje) {
        const topicos = analyzeTopics(mensagensHoje.map(m => m.content));
        setTopicsData(topicos);
      }

    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeTopics = (messages: string[]): TopicData[] => {
    const keywords = {
      'Agendamento': ['consulta', 'agendamento', 'agendar', 'marcar', 'horario', 'disponivel'],
      'Resultados': ['exame', 'resultado', 'laboratorio', 'sangue', 'urina'],
      'Cancelamento': ['cancelar', 'remarcar', 'transferir', 'mudar'],
      'Informações': ['convenio', 'plano', 'particular', 'valor', 'preco', 'custo', 'info'],
      'Sintomas': ['sintomas', 'dor', 'febre', 'tosse', 'gripe', 'resfriado', 'medicamento']
    };

    const counts: { [key: string]: number } = {};
    
    messages.forEach(message => {
      const messageLower = message.toLowerCase();
      Object.entries(keywords).forEach(([topic, words]) => {
        words.forEach(word => {
          if (messageLower.includes(word)) {
            counts[topic] = (counts[topic] || 0) + 1;
          }
        });
      });
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    metrics,
    topicsData,
    loading,
    refreshMetrics: fetchMetrics
  };
};
