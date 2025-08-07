// ========================================
// APPOINTMENT SERVICE (JavaScript)
// Versão compatível com Node.js para webhook
// ========================================

export class AppointmentService {
  /**
   * Reconhece intenção de agendamento na mensagem
   */
  static async recognizeAppointmentIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    const appointmentKeywords = [
      'agendar', 'marcar', 'consulta', 'agendamento', 'marcação',
      'quero agendar', 'preciso marcar', 'agendar consulta'
    ];
    
    const rescheduleKeywords = [
      'remarcar', 'alterar', 'mudar', 'reagendar', 'trocar horário'
    ];
    
    const cancelKeywords = [
      'cancelar', 'desmarcar', 'cancelamento', 'desmarcação'
    ];
    
    // Verificar intenção de agendamento
    if (appointmentKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return {
        intent: 'APPOINTMENT_CREATE',
        confidence: 0.9,
        entities: this.extractEntities(message)
      };
    }
    
    // Verificar intenção de reagendamento
    if (rescheduleKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return {
        intent: 'APPOINTMENT_RESCHEDULE',
        confidence: 0.8,
        entities: this.extractEntities(message)
      };
    }
    
    // Verificar intenção de cancelamento
    if (cancelKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return {
        intent: 'APPOINTMENT_CANCEL',
        confidence: 0.8,
        entities: this.extractEntities(message)
      };
    }
    
    return null;
  }

  /**
   * Extrai entidades da mensagem
   */
  static extractEntities(message) {
    const entities = {};
    const lowerMessage = message.toLowerCase();
    
    // Extrair tipo de serviço
    if (lowerMessage.includes('consulta') || lowerMessage.includes('médico')) {
      entities.serviceType = 'consulta médica';
    } else if (lowerMessage.includes('exame')) {
      entities.serviceType = 'exame';
    } else if (lowerMessage.includes('retorno')) {
      entities.serviceType = 'retorno';
    }
    
    // Extrair urgência
    if (lowerMessage.includes('urgente') || lowerMessage.includes('emergência')) {
      entities.urgency = 'urgente';
    }
    
    return entities;
  }

  /**
   * Cria um agendamento
   */
  static async createAppointment(appointmentData) {
    try {
      console.log('📅 [AppointmentService] Criando agendamento:', appointmentData);
      
      // Por enquanto, simular criação
      // Em produção, integrar com Google Calendar e banco de dados
      
      const result = {
        appointment: {
          id: `app_${Date.now()}`,
          ...appointmentData,
          status: 'confirmed',
          createdAt: new Date().toISOString()
        },
        googleEvent: {
          id: `event_${Date.now()}`,
          summary: `Consulta - ${appointmentData.patientName}`,
          start: {
            dateTime: `${appointmentData.date}T${appointmentData.startTime}:00`,
            timeZone: 'America/Sao_Paulo'
          },
          end: {
            dateTime: `${appointmentData.date}T${appointmentData.endTime}:00`,
            timeZone: 'America/Sao_Paulo'
          }
        }
      };
      
      console.log('✅ [AppointmentService] Agendamento criado com sucesso:', result);
      return result;
      
    } catch (error) {
      console.error('💥 [AppointmentService] Erro ao criar agendamento:', error);
      throw error;
    }
  }

  /**
   * Reagenda um agendamento
   */
  static async rescheduleAppointment(appointmentId, newDate, newStartTime, newEndTime) {
    try {
      console.log('🔄 [AppointmentService] Reagendando:', { appointmentId, newDate, newStartTime, newEndTime });
      
      // Por enquanto, simular reagendamento
      const result = {
        appointment: {
          id: appointmentId,
          date: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
          status: 'confirmed',
          updatedAt: new Date().toISOString()
        }
      };
      
      console.log('✅ [AppointmentService] Agendamento reagendado com sucesso:', result);
      return result;
      
    } catch (error) {
      console.error('💥 [AppointmentService] Erro ao reagendar:', error);
      throw error;
    }
  }

  /**
   * Cancela um agendamento
   */
  static async cancelAppointment(appointmentId) {
    try {
      console.log('❌ [AppointmentService] Cancelando agendamento:', appointmentId);
      
      // Por enquanto, simular cancelamento
      const result = {
        appointment: {
          id: appointmentId,
          status: 'cancelled',
          cancelledAt: new Date().toISOString()
        }
      };
      
      console.log('✅ [AppointmentService] Agendamento cancelado com sucesso:', result);
      return result;
      
    } catch (error) {
      console.error('💥 [AppointmentService] Erro ao cancelar:', error);
      throw error;
    }
  }
} 