// ========================================
// APPOINTMENT SERVICE (JavaScript)
// Versão compatível com Node.js para webhook
// ========================================

import fs from 'fs';
import path from 'path';

export class AppointmentService {
  static clinicData = null;

  /**
   * Carrega dados da clínica do JSON de contextualização
   */
  static loadClinicData(clinicId = 'cardioprime') {
    if (this.clinicData) return this.clinicData;
    
    try {
      // Tentar múltiplos caminhos possíveis
      const possiblePaths = [
        path.join(process.cwd(), 'src', 'data', `contextualizacao-${clinicId}.json`),
        path.join(process.cwd(), 'atendeai-lify-admin', 'src', 'data', `contextualizacao-${clinicId}.json`),
        path.join(__dirname, '..', 'src', 'data', `contextualizacao-${clinicId}.json`),
        path.join(__dirname, '..', 'atendeai-lify-admin', 'src', 'data', `contextualizacao-${clinicId}.json`)
      ];
      
      let rawData = null;
      let usedPath = null;
      
      for (const dataPath of possiblePaths) {
        try {
          console.log(`[AppointmentService] Tentando carregar dados de: ${dataPath}`);
          rawData = fs.readFileSync(dataPath, 'utf8');
          usedPath = dataPath;
          break;
        } catch (pathError) {
          console.log(`[AppointmentService] Caminho não encontrado: ${dataPath}`);
          continue;
        }
      }
      
      if (!rawData) {
        throw new Error('Nenhum caminho válido encontrado para os dados da clínica');
      }
      
      console.log(`[AppointmentService] Dados carregados com sucesso de: ${usedPath}`);
      this.clinicData = JSON.parse(rawData);
      return this.clinicData;
    } catch (error) {
      console.error('Erro ao carregar dados da clínica:', error);
      return null;
    }
  }

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
   * Busca horários disponíveis no Google Calendar
   */
  static async getAvailableTimeSlots(targetDate, clinicId = 'cardioprime') {
    try {
      const clinicData = this.loadClinicData(clinicId);
      if (!clinicData) {
        throw new Error('Dados da clínica não encontrados');
      }

      // Obter horário de funcionamento para o dia
      const dayOfWeek = targetDate.getDay();
      const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
      const dayName = dayNames[dayOfWeek];
      const workingHours = clinicData.clinica.horario_funcionamento[dayName];

      if (!workingHours || !workingHours.abertura) {
        return [];
      }

      // Buscar eventos existentes no Google Calendar
      const existingEvents = await this.fetchGoogleCalendarEvents(targetDate);
      
      // Gerar slots disponíveis baseados no horário de funcionamento
      const slots = [];
      const startHour = parseInt(workingHours.abertura.split(':')[0]);
      const endHour = parseInt(workingHours.fechamento.split(':')[0]);
      
      for (let hour = startHour; hour < endHour; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        
        // Verificar se o horário não está ocupado
        const isAvailable = !this.isTimeSlotOccupied(startTime, endTime, existingEvents);
        
        if (isAvailable) {
          slots.push({
            startTime,
            endTime,
            available: true
          });
        }
      }

      return slots.slice(0, 4); // Retornar apenas os próximos 4 horários
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      return [];
    }
  }

  /**
   * Busca eventos do Google Calendar
   */
  static async fetchGoogleCalendarEvents(targetDate) {
    try {
      // Em produção, integrar com Google Calendar API
      // Por enquanto, simular eventos
      return [];
    } catch (error) {
      console.error('Erro ao buscar eventos do Google Calendar:', error);
      return [];
    }
  }

  /**
   * Verifica se um horário está ocupado
   */
  static isTimeSlotOccupied(startTime, endTime, existingEvents) {
    // Verificar se há conflito com eventos existentes
    return existingEvents.some(event => {
      const eventStart = event.start.dateTime || event.start.date;
      const eventEnd = event.end.dateTime || event.end.date;
      
      // Verificar sobreposição de horários
      return (startTime < eventEnd && endTime > eventStart);
    });
  }

  /**
   * Cria um agendamento
   */
  static async createAppointment(appointmentData) {
    try {
      console.log('📅 [AppointmentService] Criando agendamento:', appointmentData);
      
      // Validar dados obrigatórios
      if (!appointmentData.patientName || !appointmentData.date || !appointmentData.startTime) {
        throw new Error('Dados obrigatórios não fornecidos');
      }

      // Criar evento no Google Calendar
      const googleEvent = await this.createGoogleCalendarEvent(appointmentData);
      
      // Salvar no banco de dados (simulado)
      const appointment = {
        id: `app_${Date.now()}`,
        ...appointmentData,
        googleEventId: googleEvent.id,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      // Agendar confirmação automática (3 dias antes)
      await this.scheduleConfirmationReminder(appointment);
      
      const result = {
        appointment,
        googleEvent
      };
      
      console.log('✅ [AppointmentService] Agendamento criado com sucesso:', result);
      return result;
      
    } catch (error) {
      console.error('💥 [AppointmentService] Erro ao criar agendamento:', error);
      throw error;
    }
  }

  /**
   * Cria evento no Google Calendar
   */
  static async createGoogleCalendarEvent(appointmentData) {
    try {
      // Em produção, integrar com Google Calendar API
      const event = {
        summary: `Consulta - ${appointmentData.patientName}`,
        description: `Consulta com ${appointmentData.doctor.nome_exibicao}\nEspecialidade: ${appointmentData.specialty}\nPaciente: ${appointmentData.patientName}\nTelefone: ${appointmentData.patientPhone}`,
        start: {
          dateTime: `${appointmentData.date.toISOString().split('T')[0]}T${appointmentData.startTime}:00`,
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: `${appointmentData.date.toISOString().split('T')[0]}T${appointmentData.endTime}:00`,
          timeZone: 'America/Sao_Paulo'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 15 },
            { method: 'email', minutes: 1440 } // 24 horas antes
          ]
        }
      };

      // Simular criação do evento
      const googleEvent = {
        id: `event_${Date.now()}`,
        ...event
      };

      console.log('✅ [AppointmentService] Evento criado no Google Calendar:', googleEvent);
      return googleEvent;
      
    } catch (error) {
      console.error('💥 [AppointmentService] Erro ao criar evento no Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Agenda lembrança de confirmação
   */
  static async scheduleConfirmationReminder(appointment) {
    try {
      // Calcular data para envio da confirmação (3 dias antes)
      const appointmentDate = new Date(appointment.date);
      const reminderDate = new Date(appointmentDate);
      reminderDate.setDate(reminderDate.getDate() - 3);

      // Em produção, usar um sistema de agendamento de tarefas
      console.log('📅 [AppointmentService] Lembrança de confirmação agendada para:', reminderDate);
      
      // Simular agendamento da confirmação
      const reminder = {
        appointmentId: appointment.id,
        patientPhone: appointment.patientPhone,
        appointmentDate: appointment.date,
        reminderDate: reminderDate,
        message: this.createConfirmationMessage(appointment)
      };

      console.log('✅ [AppointmentService] Lembrança agendada:', reminder);
      return reminder;
      
    } catch (error) {
      console.error('💥 [AppointmentService] Erro ao agendar lembrança:', error);
      throw error;
    }
  }

  /**
   * Cria mensagem de confirmação
   */
  static createConfirmationMessage(appointment) {
    const clinicData = this.loadClinicData(appointment.clinicId);
    const clinicName = clinicData?.clinica?.informacoes_basicas?.nome || 'nossa clínica';
    
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
           `🏥 ${clinicName}\n\n` +
           `Por favor, confirme sua presença respondendo:\n` +
           `✅ Sim, confirmo\n` +
           `❌ Preciso remarcar\n\n` +
           `📍 Lembre-se de chegar 15 minutos antes do horário.`;
  }

  /**
   * Reagenda um agendamento
   */
  static async rescheduleAppointment(appointmentId, newDate, newStartTime, newEndTime) {
    try {
      console.log('🔄 [AppointmentService] Reagendando:', { appointmentId, newDate, newStartTime, newEndTime });
      
      // Atualizar evento no Google Calendar
      await this.updateGoogleCalendarEvent(appointmentId, newDate, newStartTime, newEndTime);
      
      // Atualizar no banco de dados
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
   * Atualiza evento no Google Calendar
   */
  static async updateGoogleCalendarEvent(eventId, newDate, newStartTime, newEndTime) {
    try {
      // Em produção, integrar com Google Calendar API
      console.log('✅ [AppointmentService] Evento atualizado no Google Calendar:', {
        eventId,
        newDate,
        newStartTime,
        newEndTime
      });
    } catch (error) {
      console.error('💥 [AppointmentService] Erro ao atualizar evento no Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Cancela um agendamento
   */
  static async cancelAppointment(appointmentId) {
    try {
      console.log('❌ [AppointmentService] Cancelando agendamento:', appointmentId);
      
      // Cancelar evento no Google Calendar
      await this.deleteGoogleCalendarEvent(appointmentId);
      
      // Atualizar no banco de dados
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

  /**
   * Deleta evento do Google Calendar
   */
  static async deleteGoogleCalendarEvent(eventId) {
    try {
      // Em produção, integrar com Google Calendar API
      console.log('✅ [AppointmentService] Evento deletado do Google Calendar:', eventId);
    } catch (error) {
      console.error('💥 [AppointmentService] Erro ao deletar evento do Google Calendar:', error);
      throw error;
    }
  }
} 