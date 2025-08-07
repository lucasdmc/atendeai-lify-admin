// ========================================
// SERVIÇO DE SIMULAÇÃO DE ATENDIMENTO
// ========================================

import { supabase } from '../integrations/supabase/client';

export interface SimulationMessage {
  id: string;
  phoneNumber: string;
  originalMessage: string;
  aiResponse: string;
  intent?: string;
  confidence?: number;
  simulationMode: boolean;
  timestamp: string;
  clinicId?: string;
  clinicName?: string;
}

export interface SimulationStats {
  totalMessages: number;
  simulationMessages: number;
  productionMessages: number;
  averageConfidence: number;
  topIntents: Array<{ intent: string; count: number }>;
}

export class SimulationService {
  /**
   * Busca conversas em modo simulação
   */
  static async getSimulationConversations(clinicId?: string): Promise<SimulationMessage[]> {
    try {
      let query = supabase
        .from('clinics')
        .select(`
          id,
          name,
          simulation_mode,
          whatsapp_phone
        `)
        .eq('simulation_mode', true);

      if (clinicId) {
        query = query.eq('id', clinicId);
      }

      const { data: clinics, error } = await query;

      if (error) {
        console.error('Erro ao buscar clínicas em simulação:', error);
        throw new Error('Falha ao buscar conversas de simulação');
      }

      if (!clinics || clinics.length === 0) {
        return [];
      }

      // Buscar mensagens das clínicas em simulação
      const phoneNumbers = clinics.map(clinic => clinic.whatsapp_phone);
      
      // Por enquanto, retornamos dados simulados
      // Em produção, você buscaria da tabela de mensagens
      const simulationMessages: SimulationMessage[] = clinics.flatMap(clinic => [
        {
          id: `sim_${clinic.id}_1`,
          phoneNumber: clinic.whatsapp_phone,
          originalMessage: 'Olá, gostaria de agendar uma consulta',
          aiResponse: `Olá! Sou o assistente virtual da ${clinic.name}. Como posso ajudá-lo com o agendamento?`,
          intent: 'APPOINTMENT_CREATE',
          confidence: 0.95,
          simulationMode: true,
          timestamp: new Date().toISOString(),
          clinicId: clinic.id,
          clinicName: clinic.name
        },
        {
          id: `sim_${clinic.id}_2`,
          phoneNumber: clinic.whatsapp_phone,
          originalMessage: 'Quais são os horários de funcionamento?',
          aiResponse: `Nossos horários de funcionamento são: Segunda a Sexta das 8h às 18h, Sábado das 8h às 12h.`,
          intent: 'INFO_HOURS',
          confidence: 0.92,
          simulationMode: true,
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutos atrás
          clinicId: clinic.id,
          clinicName: clinic.name
        }
      ]);

      return simulationMessages;

    } catch (error) {
      console.error('Erro no serviço de simulação:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas de simulação
   */
  static async getSimulationStats(clinicId?: string): Promise<SimulationStats> {
    try {
      const conversations = await this.getSimulationConversations(clinicId);
      
      const totalMessages = conversations.length;
      const simulationMessages = conversations.filter(msg => msg.simulationMode).length;
      const productionMessages = totalMessages - simulationMessages;
      
      const averageConfidence = conversations.length > 0 
        ? conversations.reduce((sum, msg) => sum + (msg.confidence || 0), 0) / conversations.length
        : 0;

      // Agrupar por intenção
      const intentCounts = conversations.reduce((acc, msg) => {
        const intent = msg.intent || 'unknown';
        acc[intent] = (acc[intent] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topIntents = Object.entries(intentCounts)
        .map(([intent, count]) => ({ intent, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalMessages,
        simulationMessages,
        productionMessages,
        averageConfidence,
        topIntents
      };

    } catch (error) {
      console.error('Erro ao buscar estatísticas de simulação:', error);
      throw error;
    }
  }

  /**
   * Salva uma nova mensagem de simulação
   */
  static async saveSimulationMessage(message: Omit<SimulationMessage, 'id'>): Promise<void> {
    try {
      // Em produção, você salvaria na tabela de mensagens
      console.log('Salvando mensagem de simulação:', message);
      
      // Por enquanto, apenas logamos
      // Implementar salvamento real quando necessário
      
    } catch (error) {
      console.error('Erro ao salvar mensagem de simulação:', error);
      throw error;
    }
  }

  /**
   * Busca clínicas em modo simulação
   */
  static async getClinicsInSimulationMode(): Promise<Array<{ id: string; name: string; whatsapp_phone: string }>> {
    try {
      const { data: clinics, error } = await supabase
        .from('clinics')
        .select('id, name, whatsapp_phone')
        .eq('simulation_mode', true);

      if (error) {
        console.error('Erro ao buscar clínicas em simulação:', error);
        throw new Error('Falha ao buscar clínicas em modo simulação');
      }

      return clinics || [];

    } catch (error) {
      console.error('Erro no serviço de simulação:', error);
      throw error;
    }
  }
} 