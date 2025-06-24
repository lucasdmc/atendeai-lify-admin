
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LoopAnalytics {
  totalLoopsDetected: number;
  conversationsEscalated: number;
  averageLoopsBeforeEscalation: number;
  loopEventsByDay: Array<{
    date: string;
    loops: number;
    escalations: number;
  }>;
}

export const useLoopAnalytics = () => {
  const [analytics, setAnalytics] = useState<LoopAnalytics>({
    totalLoopsDetected: 0,
    conversationsEscalated: 0,
    averageLoopsBeforeEscalation: 0,
    loopEventsByDay: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Buscar eventos de loop
      const { data: loopEvents, error: loopError } = await supabase
        .from('whatsapp_loop_events')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Últimos 30 dias

      if (loopError) throw loopError;

      // Buscar conversas escaladas
      const { data: escalatedConversations, error: escalatedError } = await supabase
        .from('whatsapp_conversations')
        .select('loop_counter')
        .eq('escalated_to_human', true)
        .not('escalated_at', 'is', null);

      if (escalatedError) throw escalatedError;

      // Calcular métricas
      const totalLoops = loopEvents?.filter(e => e.event_type === 'loop_detected').length || 0;
      const totalEscalations = loopEvents?.filter(e => e.event_type === 'escalated_to_human').length || 0;
      
      const averageLoops = escalatedConversations?.length > 0 
        ? escalatedConversations.reduce((sum, conv) => sum + (conv.loop_counter || 0), 0) / escalatedConversations.length
        : 0;

      // Agrupar eventos por dia
      const eventsByDay = loopEvents?.reduce((acc: any, event) => {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { loops: 0, escalations: 0 };
        }
        if (event.event_type === 'loop_detected') acc[date].loops++;
        if (event.event_type === 'escalated_to_human') acc[date].escalations++;
        return acc;
      }, {}) || {};

      const loopEventsByDay = Object.entries(eventsByDay).map(([date, data]: [string, any]) => ({
        date,
        loops: data.loops,
        escalations: data.escalations
      }));

      setAnalytics({
        totalLoopsDetected: totalLoops,
        conversationsEscalated: totalEscalations,
        averageLoopsBeforeEscalation: Math.round(averageLoops * 10) / 10,
        loopEventsByDay
      });
    } catch (error) {
      console.error('Erro ao buscar analytics de loop:', error);
    } finally {
      setLoading(false);
    }
  };

  return { analytics, loading, refetch: fetchAnalytics };
};
