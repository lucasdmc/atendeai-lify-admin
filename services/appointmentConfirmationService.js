// ========================================
// APPOINTMENT CONFIRMATION SERVICE (JavaScript)
// Versão compatível com Node.js para webhook
// ========================================

import { AppointmentService } from './appointmentService.js';

export class AppointmentConfirmationService {
  static pendingConfirmations = new Map();

  /**
   * Agenda uma confirmação de consulta
   */
  static async scheduleConfirmation(appointment) {
    try {
      console.log('📅 [AppointmentConfirmationService] Agendando confirmação para:', appointment.id);
      
      // Calcular data para envio da confirmação (3 dias antes)
      const appointmentDate = new Date(appointment.date);
      const confirmationDate = new Date(appointmentDate);
      confirmationDate.setDate(confirmationDate.getDate() - 3);

      // Verificar se a confirmação deve ser enviada hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const confirmationDay = new Date(confirmationDate);
      confirmationDay.setHours(0, 0, 0, 0);

      if (confirmationDay.getTime() === today.getTime()) {
        // Enviar confirmação imediatamente
        await this.sendConfirmationMessage(appointment);
      } else {
        // Agendar para o futuro
        this.pendingConfirmations.set(appointment.id, {
          appointment,
          confirmationDate,
          sent: false
        });
      }

      console.log('✅ [AppointmentConfirmationService] Confirmação agendada com sucesso');
      
    } catch (error) {
      console.error('💥 [AppointmentConfirmationService] Erro ao agendar confirmação:', error);
      throw error;
    }
  }

  /**
   * Processa confirmações pendentes
   */
  static async processPendingConfirmations() {
    try {
      console.log('🔄 [AppointmentConfirmationService] Processando confirmações pendentes...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const [appointmentId, confirmation] of this.pendingConfirmations.entries()) {
        const confirmationDay = new Date(confirmation.confirmationDate);
        confirmationDay.setHours(0, 0, 0, 0);

        if (confirmationDay.getTime() === today.getTime() && !confirmation.sent) {
          console.log(`📤 [AppointmentConfirmationService] Enviando confirmação para agendamento: ${appointmentId}`);
          
          await this.sendConfirmationMessage(confirmation.appointment);
          
          // Marcar como enviada
          confirmation.sent = true;
          this.pendingConfirmations.set(appointmentId, confirmation);
        }
      }

      console.log('✅ [AppointmentConfirmationService] Confirmações processadas');
      
    } catch (error) {
      console.error('💥 [AppointmentConfirmationService] Erro ao processar confirmações:', error);
    }
  }

  /**
   * Envia mensagem de confirmação
   */
  static async sendConfirmationMessage(appointment) {
    try {
      console.log('📤 [AppointmentConfirmationService] Enviando confirmação para:', appointment.patientPhone);
      
      const message = this.createConfirmationMessage(appointment);
      
      // Em produção, integrar com WhatsApp API
      console.log('📱 [AppointmentConfirmationService] Mensagem de confirmação:', message);
      
      // Simular envio
      const result = {
        appointmentId: appointment.id,
        patientPhone: appointment.patientPhone,
        message,
        sentAt: new Date().toISOString(),
        status: 'sent'
      };

      console.log('✅ [AppointmentConfirmationService] Confirmação enviada:', result);
      return result;
      
    } catch (error) {
      console.error('💥 [AppointmentConfirmationService] Erro ao enviar confirmação:', error);
      throw error;
    }
  }

  /**
   * Cria mensagem de confirmação
   */
  static createConfirmationMessage(appointment) {
    const appointmentDate = new Date(appointment.date);
    const formattedDate = appointmentDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `🔔 Confirmação de Consulta\n\n` +
           `Olá ${appointment.patientName}!\n\n` +
           `Sua consulta está marcada para:\n` +
           `📅 ${formattedDate}\n` +
           `⏰ ${appointment.startTime} - ${appointment.endTime}\n` +
           `👨‍⚕️ ${appointment.doctor.nome_exibicao}\n` +
           `🏥 ${appointment.clinicName || 'nossa clínica'}\n\n` +
           `Por favor, confirme sua presença respondendo:\n` +
           `✅ Sim, confirmo\n` +
           `❌ Preciso remarcar\n\n` +
           `📍 Lembre-se de chegar 15 minutos antes do horário.`;
  }

  /**
   * Processa resposta de confirmação
   */
  static async processConfirmationResponse(message, patientPhone) {
    try {
      console.log('📥 [AppointmentConfirmationService] Processando resposta de confirmação:', message);
      
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('sim') || lowerMessage.includes('confirmo') || lowerMessage.includes('✅')) {
        return this.handleConfirmationAccepted(patientPhone);
      } else if (lowerMessage.includes('não') || lowerMessage.includes('remarcar') || lowerMessage.includes('❌')) {
        return this.handleConfirmationRejected(patientPhone);
      } else {
        return this.createResponse(
          'Por favor, responda com:\n' +
          '✅ Sim, confirmo\n' +
          '❌ Preciso remarcar',
          'waiting_confirmation',
          { patientPhone }
        );
      }
      
    } catch (error) {
      console.error('💥 [AppointmentConfirmationService] Erro ao processar resposta:', error);
      return this.createResponse(
        'Desculpe, ocorreu um erro. Tente novamente.',
        'error',
        { patientPhone }
      );
    }
  }

  /**
   * Processa confirmação aceita
   */
  static async handleConfirmationAccepted(patientPhone) {
    try {
      console.log('✅ [AppointmentConfirmationService] Confirmação aceita por:', patientPhone);
      
      // Em produção, atualizar status no banco de dados
      
      return this.createResponse(
        '✅ Perfeito! Sua consulta está confirmada.\n\n' +
        '📍 Lembre-se de:\n' +
        '• Chegar 15 minutos antes do horário\n' +
        '• Trazer documentos de identificação\n' +
        '• Trazer carteirinha do convênio (se aplicável)\n\n' +
        'Até lá! 😊',
        'confirmed',
        { patientPhone }
      );
      
    } catch (error) {
      console.error('💥 [AppointmentConfirmationService] Erro ao processar confirmação aceita:', error);
      throw error;
    }
  }

  /**
   * Processa confirmação rejeitada
   */
  static async handleConfirmationRejected(patientPhone) {
    try {
      console.log('❌ [AppointmentConfirmationService] Confirmação rejeitada por:', patientPhone);
      
      return this.createResponse(
        'Entendi que você precisa remarcar sua consulta.\n\n' +
        'Para reagendar, entre em contato conosco:\n' +
        '📞 (47) 3333-4444\n' +
        '📧 agendamento@cardioprime.com.br\n\n' +
        'Ou responda "agendar" para iniciar um novo agendamento.',
        'rejected',
        { patientPhone }
      );
      
    } catch (error) {
      console.error('💥 [AppointmentConfirmationService] Erro ao processar confirmação rejeitada:', error);
      throw error;
    }
  }

  /**
   * Cria resposta padronizada
   */
  static createResponse(message, status, data) {
    return {
      message,
      status,
      data
    };
  }

  /**
   * Obtém confirmações pendentes
   */
  static getPendingConfirmations() {
    return Array.from(this.pendingConfirmations.values());
  }

  /**
   * Remove confirmação pendente
   */
  static removePendingConfirmation(appointmentId) {
    this.pendingConfirmations.delete(appointmentId);
  }
} 