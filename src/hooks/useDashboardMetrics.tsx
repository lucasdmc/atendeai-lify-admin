
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

type BackendMetricsRow = {
  clinicId: string;
  started: number;
  completed: number;
  escalated: number;
  errors: number;
  lastUpdated: string;
};

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

      // Buscar métricas do backend local (P01)
      const apiUrl = `${window.location.origin.replace(/\/$/, '')}/api/metrics/appointments`;
      const metricsResp = await fetch(apiUrl).then(r => r.json()).catch(err => ({ error: err }));

      if (metricsResp && metricsResp.success && Array.isArray(metricsResp.data)) {
        const agg: BackendMetricsRow[] = metricsResp.data;
        // Converter para o formato atual de cards (simplificado)
        const totalStarted = agg.reduce((sum, r) => sum + (r.started || 0), 0);
        const totalCompleted = agg.reduce((sum, r) => sum + (r.completed || 0), 0);
        const totalErrors = agg.reduce((sum, r) => sum + (r.errors || 0), 0);
        const conversasAndamento = Math.max(totalStarted - totalCompleted, 0);
        const aguardandoResposta = Math.max(conversasAndamento - totalErrors, 0);
        const tempoMedio = 0; // placeholder até termos tempos por request
        setMetrics({
          novas_conversas: totalStarted,
          conversas_andamento: conversasAndamento,
          aguardando_resposta: aguardandoResposta,
          tempo_medio_chatbot: tempoMedio
        });
      }

      // Buscar últimas mensagens para tópicos (mantido com limite baixo)
      const hoje = new Date().toISOString().split('T')[0];
      const mensagensResponse = await supabase
        .from('whatsapp_messages')
        .select('content')
        .eq('message_type', 'received')
        .gte('created_at', hoje)
        .limit(50);
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
