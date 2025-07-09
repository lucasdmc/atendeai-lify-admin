import { Intent } from './intentRecognitionService';
import { AppointmentService } from '../appointmentService';
// import { supabase } from '@/integrations/supabase/client';

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message: string;
}

export interface ToolCallResponse {
  response: string;
  toolsUsed: string[];
  results: ToolResult[];
}

export class ToolCallingService {
  private static tools: Map<string, Tool> = new Map([
    ['create_appointment', {
      name: 'create_appointment',
      description: 'Criar um novo agendamento de consulta',
      parameters: {
        title: 'string',
        date: 'string (DD/MM/YYYY)',
        startTime: 'string (HH:MM)',
        endTime: 'string (HH:MM)',
        patientEmail: 'string?',
        location: 'string?',
        notes: 'string?'
      },
      execute: async (params) => {
        try {
          // Validar parâmetros
          if (!params.title || !params.date || !params.startTime) {
            return {
              success: false,
              error: 'Parâmetros obrigatórios faltando',
              message: 'Preciso de mais informações para criar o agendamento.'
            };
          }

          // Converter data brasileira para formato ISO
          const [day, month, year] = params.date.split('/');
          const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

          const result = await AppointmentService.createAppointment({
            title: params.title,
            date: isoDate,
            startTime: params.startTime,
            endTime: params.endTime || this.calculateEndTime(params.startTime),
            patientEmail: params.patientEmail,
            location: params.location || 'Clínica',
            description: params.notes
          });

          return {
            success: result.success,
            data: { eventId: result.eventId },
            message: result.message
          };
        } catch (error: any) {
          console.error('Error in create_appointment:', error);
          return {
            success: false,
            error: error?.message || 'Erro desconhecido',
            message: 'Erro ao criar agendamento. Tente novamente.'
          };
        }
      }
    }],
    
    ['list_appointments', {
      name: 'list_appointments',
      description: 'Listar agendamentos do paciente',
      parameters: {
        date: 'string? (DD/MM/YYYY)',
        phoneNumber: 'string'
      },
      execute: async (params) => {
        try {
          let isoDate: string | undefined;
          if (params.date) {
            const [day, month, year] = params.date.split('/');
            isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }

          const result = await AppointmentService.listAppointments(isoDate);
          
          if (!result.success) {
            return {
              success: false,
              message: result.message
            };
          }

          // Filtrar apenas agendamentos do paciente (por telefone)
          const patientAppointments = result.appointments?.filter(apt => 
            apt.metadata?.phoneNumber === params.phoneNumber
          ) || [];

          return {
            success: true,
            data: { appointments: patientAppointments },
            message: patientAppointments.length > 0 
              ? `Encontrei ${patientAppointments.length} agendamento(s).`
              : 'Você não possui agendamentos marcados.'
          };
        } catch (error: any) {
          return {
            success: false,
            error: error?.message || 'Erro desconhecido',
            message: 'Erro ao buscar agendamentos.'
          };
        }
      }
    }],
    
    ['cancel_appointment', {
      name: 'cancel_appointment',
      description: 'Cancelar um agendamento existente',
      parameters: {
        eventId: 'string',
        reason: 'string?'
      },
      execute: async (params) => {
        try {
          if (!params.eventId) {
            return {
              success: false,
              error: 'ID do agendamento não fornecido',
              message: 'Preciso do código do agendamento para cancelar.'
            };
          }

          const result = await AppointmentService.deleteAppointment(params.eventId);
          
          // Registrar motivo do cancelamento se fornecido
          if (params.reason) {
            console.log('Cancelamento registrado:', {
              event_id: params.eventId,
              reason: params.reason,
              cancelled_at: new Date().toISOString()
            });
          }

          return {
            success: result.success,
            message: result.message
          };
        } catch (error: any) {
          return {
            success: false,
            error: error?.message || 'Erro desconhecido',
            message: 'Erro ao cancelar agendamento.'
          };
        }
      }
    }],
    
    ['check_availability', {
      name: 'check_availability',
      description: 'Verificar disponibilidade de horários',
      parameters: {
        date: 'string (DD/MM/YYYY)',
        specialty: 'string?',
        doctorName: 'string?'
      },
      execute: async (params) => {
        try {
          const [day, month, year] = params.date.split('/');
          const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          
          // Buscar agendamentos do dia
          const result = await AppointmentService.listAppointments(isoDate);
          
          if (!result.success) {
            return {
              success: false,
              message: 'Erro ao verificar disponibilidade.'
            };
          }

          // Usar horário padrão de funcionamento
          const availableSlots = this.calculateAvailableSlots(
            result.appointments || [],
            '08:00-18:00'
          );

          return {
            success: true,
            data: { availableSlots },
            message: availableSlots.length > 0 
              ? `Horários disponíveis: ${availableSlots.join(', ')}`
              : 'Não há horários disponíveis nesta data.'
          };
        } catch (error: any) {
          return {
            success: false,
            error: error?.message || 'Erro desconhecido',
            message: 'Erro ao verificar disponibilidade.'
          };
        }
      }
    }]
  ]);

  /**
   * Executa ferramentas baseadas na intenção
   */
  static async executeTools(intent: Intent, request: any): Promise<ToolCallResponse> {
    const toolsUsed: string[] = [];
    const results: ToolResult[] = [];
    let response = '';

    try {
      // Mapear intenção para ferramenta
      const toolName = this.mapIntentToTool(intent.name);
      
      if (toolName && this.tools.has(toolName)) {
        const tool = this.tools.get(toolName)!;
        
        // Preparar parâmetros
        const params = this.prepareToolParameters(toolName, intent.entities, request);
        
        // Executar ferramenta
        const result = await tool.execute(params);
        
        toolsUsed.push(toolName);
        results.push(result);
        
        // Formatar resposta
        if (result.success) {
          response = this.formatSuccessResponse(toolName, result);
        } else {
          response = this.formatErrorResponse(toolName, result);
        }
      } else {
        response = 'Desculpe, não consegui entender o que você precisa. Pode reformular sua solicitação?';
      }

      return {
        response,
        toolsUsed,
        results
      };
    } catch (error) {
      console.error('Error executing tools:', error);
      return {
        response: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
        toolsUsed,
        results
      };
    }
  }

  /**
   * Mapeia intenção para ferramenta
   */
  private static mapIntentToTool(intentName: string): string | null {
    const mapping: Record<string, string> = {
      'APPOINTMENT_CREATE': 'create_appointment',
      'APPOINTMENT_LIST': 'list_appointments',
      'APPOINTMENT_CANCEL': 'cancel_appointment',
      'APPOINTMENT_RESCHEDULE': 'check_availability'
    };
    
    return mapping[intentName] || null;
  }

  /**
   * Prepara parâmetros para a ferramenta
   */
  private static prepareToolParameters(toolName: string, entities: Record<string, any>, request: any): any {
    const baseParams = {
      phoneNumber: request.phoneNumber
    };

    switch (toolName) {
      case 'create_appointment':
        return {
          ...baseParams,
          title: entities.service || 'Consulta',
          date: entities.date,
          startTime: entities.time,
          patientEmail: entities.email
        };
      
      case 'list_appointments':
        return {
          ...baseParams,
          date: entities.date
        };
      
      case 'cancel_appointment':
        return {
          ...baseParams,
          eventId: entities.appointmentId,
          reason: entities.reason
        };
      
      case 'check_availability':
        return {
          ...baseParams,
          date: entities.date,
          specialty: entities.specialty,
          doctorName: entities.doctor
        };
      
      default:
        return baseParams;
    }
  }

  /**
   * Formata resposta de sucesso
   */
  private static formatSuccessResponse(_toolName: string, result: ToolResult): string {
    return result.message;
  }

  /**
   * Formata resposta de erro
   */
  private static formatErrorResponse(_toolName: string, result: ToolResult): string {
    return `❌ ${result.message}`;
  }

  /**
   * Calcula horário de fim baseado no início
   */
  private static calculateEndTime(startTime: string): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + 60; // 1 hora de duração
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  }

  /**
   * Calcula slots disponíveis
   */
  private static calculateAvailableSlots(appointments: any[], clinicHours: string): string[] {
    const slots: string[] = [];
    const [start, end] = clinicHours.split('-');
    
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);
    
    // Gerar slots de 1 hora
    for (let time = startMinutes; time < endMinutes; time += 60) {
      const timeStr = this.minutesToTime(time);
      
      // Verificar se o horário está ocupado
      const isOccupied = appointments.some(apt => {
        const aptStart = this.timeToMinutes(apt.start_time);
        return aptStart === time;
      });
      
      if (!isOccupied) {
        slots.push(timeStr);
      }
    }
    
    return slots;
  }

  /**
   * Converte tempo para minutos
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Converte minutos para tempo
   */
  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
} 