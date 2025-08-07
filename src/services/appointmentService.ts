
import { supabase } from '@/integrations/supabase/client';
import { googleCalendarService } from '@/services/googleCalendarService';
import { contextualizacaoService } from '@/services/contextualizacaoService';

export interface AppointmentData {
  patientName: string;
  patientPhone: string;
  patientBirthDate: string;
  serviceType: string;
  doctorId?: string;
  date: string;
  startTime: string;
  endTime: string;
  observations?: string;
  isFirstTime?: boolean;
  insurance?: string;
}

export interface AvailableSlot {
  date: string;
  startTime: string;
  endTime: string;
  doctorId?: string;
  doctorName?: string;
  serviceType: string;
}

export interface AppointmentIntent {
  intent: 'APPOINTMENT_CREATE' | 'APPOINTMENT_RESCHEDULE' | 'APPOINTMENT_CANCEL';
  confidence: number;
  entities: {
    serviceType?: string;
    date?: string;
    time?: string;
    doctorName?: string;
    patientName?: string;
  };
}

export class AppointmentService {
  /**
   * Reconhece intenção de agendamento na mensagem
   */
  static async recognizeAppointmentIntent(message: string): Promise<AppointmentIntent | null> {
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
  private static extractEntities(message: string) {
    const entities: any = {};
    
    // Extrair tipo de serviço
    const serviceTypes = ['consulta', 'exame', 'cardiologia', 'gastroenterologia'];
    for (const service of serviceTypes) {
      if (message.toLowerCase().includes(service)) {
        entities.serviceType = service;
        break;
      }
    }
    
    // Extrair data (formato simples)
    const dateRegex = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
    const dateMatch = message.match(dateRegex);
    if (dateMatch) {
      entities.date = `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
    }
    
    // Extrair horário
    const timeRegex = /(\d{1,2}):(\d{2})/;
    const timeMatch = message.match(timeRegex);
    if (timeMatch) {
      entities.time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    }
    
    return entities;
  }

  /**
   * Obtém horários disponíveis para uma clínica
   */
  static async getAvailableSlots(clinicId: string, date: string, serviceType?: string): Promise<AvailableSlot[]> {
    try {
      // 1. Obter dados de contextualização da clínica
      const clinicData = await contextualizacaoService.getClinicContext(clinicId);
      if (!clinicData) {
        throw new Error('Clínica não encontrada');
      }

      // 2. Verificar se a data está dentro do horário de funcionamento
      const dayOfWeek = this.getDayOfWeek(date);
      const workingHours = clinicData.clinica.horario_funcionamento[dayOfWeek];
      
      if (!workingHours || !workingHours.abertura || !workingHours.fechamento) {
        return [];
      }

      // 3. Obter eventos existentes no Google Calendar
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const existingEvents = await googleCalendarService.fetchCalendarEvents(
        startOfDay.toISOString(),
        endOfDay.toISOString()
      );

      // 4. Gerar slots disponíveis
      const availableSlots: AvailableSlot[] = [];
      const slotDuration = 30; // minutos (pode vir do JSON de contextualização)
      
      const startHour = parseInt(workingHours.abertura.split(':')[0]);
      const startMinute = parseInt(workingHours.abertura.split(':')[1]);
      const endHour = parseInt(workingHours.fechamento.split(':')[0]);
      const endMinute = parseInt(workingHours.fechamento.split(':')[1]);
      
      let currentTime = new Date(date);
      currentTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(date);
      endTime.setHours(endHour, endMinute, 0, 0);
      
      while (currentTime < endTime) {
        const slotStart = new Date(currentTime);
        const slotEnd = new Date(currentTime);
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);
        
        // Verificar se o slot está livre
        const isSlotAvailable = !existingEvents.some(event => {
          const eventStart = new Date(event.start.dateTime);
          const eventEnd = new Date(event.end.dateTime);
          
          return (
            (slotStart >= eventStart && slotStart < eventEnd) ||
            (slotEnd > eventStart && slotEnd <= eventEnd) ||
            (slotStart <= eventStart && slotEnd >= eventEnd)
          );
        });
        
        if (isSlotAvailable) {
          availableSlots.push({
            date: date,
            startTime: slotStart.toTimeString().slice(0, 5),
            endTime: slotEnd.toTimeString().slice(0, 5),
            serviceType: serviceType || 'consulta'
          });
        }
        
        currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
      }
      
      return availableSlots;
    } catch (error) {
      console.error('Erro ao obter horários disponíveis:', error);
      throw error;
    }
  }

  /**
   * Cria um agendamento
   */
  static async createAppointment(appointmentData: AppointmentData): Promise<any> {
    try {
      // 1. Criar evento no Google Calendar
      const startDateTime = new Date(`${appointmentData.date}T${appointmentData.startTime}:00`);
      const endDateTime = new Date(`${appointmentData.date}T${appointmentData.endTime}:00`);
      
      const googleEvent = {
        summary: `Consulta - ${appointmentData.patientName}`,
        description: `
Paciente: ${appointmentData.patientName}
Telefone: ${appointmentData.patientPhone}
Tipo: ${appointmentData.serviceType}
Observações: ${appointmentData.observations || ''}
Primeira consulta: ${appointmentData.isFirstTime ? 'Sim' : 'Não'}
Convênio: ${appointmentData.insurance || 'Particular'}
        `.trim(),
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        attendees: [
          {
            email: `${appointmentData.patientPhone}@whatsapp.com`,
            displayName: appointmentData.patientName,
            responseStatus: 'needsAction'
          }
        ]
      };
      
      const createdGoogleEvent = await googleCalendarService.createCalendarEvent(googleEvent);
      
      // 2. Salvar no banco de dados local
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          google_event_id: createdGoogleEvent.id,
          patient_name: appointmentData.patientName,
          patient_phone: appointmentData.patientPhone,
          patient_birth_date: appointmentData.patientBirthDate,
          service_type: appointmentData.serviceType,
          doctor_id: appointmentData.doctorId,
          date: appointmentData.date,
          start_time: appointmentData.startTime,
          end_time: appointmentData.endTime,
          observations: appointmentData.observations,
          is_first_time: appointmentData.isFirstTime,
          insurance: appointmentData.insurance,
          status: 'confirmed'
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return {
        appointment,
        googleEvent: createdGoogleEvent
      };
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      throw error;
    }
  }

  /**
   * Reagenda um agendamento
   */
  static async rescheduleAppointment(
    appointmentId: string, 
    newDate: string, 
    newStartTime: string, 
    newEndTime: string
  ): Promise<any> {
    try {
      // 1. Buscar agendamento atual
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();
      
      if (fetchError || !appointment) {
        throw new Error('Agendamento não encontrado');
      }
      
      // 2. Cancelar evento no Google Calendar
      if (appointment.google_event_id) {
        await googleCalendarService.deleteCalendarEvent(appointment.google_event_id);
      }
      
      // 3. Criar novo evento no Google Calendar
      const startDateTime = new Date(`${newDate}T${newStartTime}:00`);
      const endDateTime = new Date(`${newDate}T${newEndTime}:00`);
      
      const newGoogleEvent = {
        summary: `Consulta - ${appointment.patient_name}`,
        description: appointment.observations || '',
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        attendees: [
          {
            email: `${appointment.patient_phone}@whatsapp.com`,
            displayName: appointment.patient_name,
            responseStatus: 'needsAction'
          }
        ]
      };
      
      const createdGoogleEvent = await googleCalendarService.createCalendarEvent(newGoogleEvent);
      
      // 4. Atualizar no banco de dados
      const { data: updatedAppointment, error: updateError } = await supabase
        .from('appointments')
        .update({
          google_event_id: createdGoogleEvent.id,
          date: newDate,
          start_time: newStartTime,
          end_time: newEndTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select()
        .single();
      
      if (updateError) {
        throw updateError;
      }
      
      return {
        appointment: updatedAppointment,
        googleEvent: createdGoogleEvent
      };
    } catch (error) {
      console.error('Erro ao reagendar:', error);
      throw error;
    }
  }

  /**
   * Cancela um agendamento
   */
  static async cancelAppointment(appointmentId: string): Promise<void> {
    try {
      // 1. Buscar agendamento
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();
      
      if (fetchError || !appointment) {
        throw new Error('Agendamento não encontrado');
      }
      
      // 2. Cancelar no Google Calendar
      if (appointment.google_event_id) {
        await googleCalendarService.deleteCalendarEvent(appointment.google_event_id);
      }
      
      // 3. Atualizar status no banco de dados
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);
      
      if (updateError) {
        throw updateError;
      }
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      throw error;
    }
  }

  /**
   * Obtém agendamentos de um paciente
   */
  static async getPatientAppointments(patientPhone: string): Promise<any[]> {
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_phone', patientPhone)
        .eq('status', 'confirmed')
        .order('date', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      return appointments || [];
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      throw error;
    }
  }

  /**
   * Converte data para dia da semana
   */
  private static getDayOfWeek(dateString: string): string {
    const date = new Date(dateString);
    const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    return days[date.getDay()];
  }
}
