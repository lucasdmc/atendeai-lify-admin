
import { useState, useEffect, useCallback, useMemo } from 'react';
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

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);

      // Otimizar chamadas - fazer em paralelo
      const hoje = new Date().toISOString().split('T')[0];
      
      const [metricsResponse, mensagensResponse] = await Promise.all([
        supabase.functions.invoke('update-dashboard-metrics').catch(err => ({ error: err })),
        supabase
          .from('whatsapp_messages')
          .select('content')
          .eq('message_type', 'received')
          .gte('created_at', hoje)
          .limit(50) // Reduzir limite para melhor performance
      ]);

      if ('data' in metricsResponse && metricsResponse.data?.metrics) {
        setMetrics(metricsResponse.data.metrics);
      }

      if (!mensagensResponse.error && mensagensResponse.data) {
        const topicos = analyzeTopics(mensagensResponse.data.map(m => m.content));
        setTopicsData(topicos);
      }

    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeTopics = useCallback((messages: string[]): TopicData[] => {
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
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return useMemo(() => ({
    metrics,
    topicsData,
    loading,
    refreshMetrics: fetchMetrics
  }), [metrics, topicsData, loading, fetchMetrics]);
};
