// src/services/ai/toolCallingService.ts

import { Intent } from './intentRecognitionService';
import { AppointmentService } from '../appointmentService';
import { supabase } from '@/integrations/supabase/client';

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
        } catch (error) {
          console.error('Error in create_appointment:', error);
          return {
            success: false,
            error: error.message,
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
        } catch (error) {
          return {
            success: false,
            error: error.message,
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
            await supabase
              .from('appointment_cancellations')
              .insert({
                event_id: params.eventId,
                reason: params.reason,
                cancelled_at: new Date().toISOString()
              });
          }

          return {
            success: result.success,
            message: result.message
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
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

          // Buscar horários de funcionamento
          const { data: clinicHours } = await supabase
            .from('contextualization_data')
            .select('answer')
            .eq('question', 'horário de funcionamento')
            .single();

          // Calcular slots disponíveis
          const availableSlots = this.calculateAvailableSlots(
            result.appointments || [],
            clinicHours?.answer || '08:00 às 18:00'
          );

          return {
            success: true,
            data: { availableSlots },
            message: `Horários disponíveis em ${params.date}: ${availableSlots.join(', ')}`
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            message: 'Erro ao verificar disponibilidade.'
          };
        }
      }
    }],
    
    ['escalate_to_human', {
      name: 'escalate_to_human',
      description: 'Transferir conversa para atendente humano',
      parameters: {
        reason: 'string',
        conversationId: 'string'
      },
      execute: async (params) => {
        try {
          await supabase
            .from('whatsapp_conversations')
            .update({
              escalated_to_human: true,
              escalation_reason: params.reason,
              escalated_at: new Date().toISOString()
            })
            .eq('id', params.conversationId);

          // Notificar equipe
          await supabase
            .from('escalation_notifications')
            .insert({
              conversation_id: params.conversationId,
              reason: params.reason,
              created_at: new Date().toISOString()
            });

          return {
            success: true,
            message: 'Transferindo para atendente humano...'
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            message: 'Erro ao transferir atendimento.'
          };
        }
      }
    }]
  ]);

  static async executeTools(intent: Intent, request: any): Promise<ToolCallResponse> {
    const toolsUsed: string[] = [];
    const results: ToolResult[] = [];
    let response = '';

    // Mapear intenção para ferramenta apropriada
    const toolMapping: Record<string, string> = {
      'APPOINTMENT_CREATE': 'create_appointment',
      'APPOINTMENT_LIST': 'list_appointments',
      'APPOINTMENT_CANCEL': 'cancel_appointment',
      'APPOINTMENT_RESCHEDULE': 'reschedule_appointment',
      'CHECK_AVAILABILITY': 'check_availability',
      'HUMAN_HANDOFF': 'escalate_to_human'
    };

    const toolName = toolMapping[intent.name];
    
    if (!toolName || !this.tools.has(toolName)) {
      return {
        response: 'Desculpe, não consigo executar essa ação no momento.',
        toolsUsed: [],
        results: []
      };
    }

    const tool = this.tools.get(toolName)!;
    
    // Preparar parâmetros baseado nas entidades extraídas
    const params = this.prepareToolParameters(toolName, intent.entities, request);
    
    // Executar ferramenta
    console.log(`🔧 Executing tool: ${toolName} with params:`, params);
    const result = await tool.execute(params);
    
    toolsUsed.push(toolName);
    results.push(result);

    // Formatar resposta baseada no resultado
    if (result.success) {
      response = this.formatSuccessResponse(toolName, result);
    } else {
      response = this.formatErrorResponse(toolName, result);
    }

    return {
      response,
      toolsUsed,
      results
    };
  }

  private static prepareToolParameters(toolName: string, entities: Record<string, any>, request: any): any {
    const baseParams = {
      phoneNumber: request.phoneNumber,
      conversationId: request.conversationId
    };

    switch (toolName) {
      case 'create_appointment':
        return {
          ...baseParams,
          title: entities.service || entities.appointmentType || 'Consulta',
          date: entities.date,
          startTime: entities.time || entities.startTime,
          endTime: entities.endTime,
          patientEmail: entities.email,
          location: entities.location,
          notes: entities.notes || entities.symptoms
        };
      
      case 'list_appointments':
        return {
          ...baseParams,
          date: entities.date
        };
      
      case 'cancel_appointment':
        return {
          ...baseParams,
          eventId: entities.eventId || entities.appointmentId,
          reason: entities.reason
        };
      
      case 'check_availability':
        return {
          ...baseParams,
          date: entities.date,
          specialty: entities.specialty,
          doctorName: entities.doctor
        };
      
      case 'escalate_to_human':
        return {
          ...baseParams,
          reason: entities.reason || 'Solicitação do usuário'
        };
      
      default:
        return baseParams;
    }
  }

  private static formatSuccessResponse(toolName: string, result: ToolResult): string {
    const baseResponse = result.message;
    
    switch (toolName) {
      case 'create_appointment':
        return `✅ ${baseResponse}\n\n` +
               `Código do agendamento: ${result.data?.eventId}\n` +
               `Por favor, anote este código para futuras referências.\n\n` +
               `Você receberá uma confirmação por e-mail e um lembrete 24h antes da consulta.`;
      
      case 'list_appointments':
        if (result.data?.appointments?.length > 0) {
          let response = '📅 Seus próximos agendamentos:\n\n';
          result.data.appointments.forEach((apt: any, index: number) => {
            response += `${index + 1}. ${apt.title}\n`;
            response += `   📍 Data: ${this.formatDate(apt.date)}\n`;
            response += `   🕐 Horário: ${apt.startTime} às ${apt.endTime}\n`;
            response += `   📍 Local: ${apt.location || 'Clínica'}\n`;
            response += `   🔖 Código: ${apt.id}\n\n`;
          });
          return response;
        }
        return baseResponse;
      
      case 'check_availability':
        return `🕐 ${baseResponse}\n\n` +
               `Para agendar em um desses horários, me informe qual você prefere.`;
      
      default:
        return baseResponse;
    }
  }

  private static formatErrorResponse(toolName: string, result: ToolResult): string {
    const baseError = result.message || 'Ocorreu um erro ao processar sua solicitação.';
    
    return `❌ ${baseError}\n\n` +
           `Por favor, tente novamente ou digite "falar com atendente" para ajuda adicional.`;
  }

  private static calculateEndTime(startTime: string): string {
    // Adicionar 1 hora ao horário de início como padrão
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + 1;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private static calculateAvailableSlots(appointments: any[], clinicHours: string): string[] {
    // Extrair horários de funcionamento
    const match = clinicHours.match(/(\d{2}:\d{2})\s*[àa]\s*(\d{2}:\d{2})/);
    if (!match) return [];
    
    const [_, openTime, closeTime] = match;
    const slots: string[] = [];
    
    // Gerar slots de 30 em 30 minutos
    let current = this.timeToMinutes(openTime);
    const end = this.timeToMinutes(closeTime);
    
    while (current < end) {
      const slotTime = this.minutesToTime(current);
      
      // Verificar se o slot está ocupado
      const isOccupied = appointments.some(apt => {
        const aptStart = this.timeToMinutes(apt.startTime);
        const aptEnd = this.timeToMinutes(apt.endTime);
        return current >= aptStart && current < aptEnd;
      });
      
      if (!isOccupied) {
        slots.push(slotTime);
      }
      
      current += 30; // Incrementar 30 minutos
    }
    
    return slots;
  }

  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private static formatDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  }
}