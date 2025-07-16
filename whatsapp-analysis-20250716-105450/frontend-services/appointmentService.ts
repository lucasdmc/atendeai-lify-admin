
import { supabase } from '@/integrations/supabase/client';

export interface AppointmentRequest {
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  patientEmail?: string;
  location?: string;
  label?: string;
}

export interface AppointmentUpdateRequest extends Partial<AppointmentRequest> {
  eventId: string;
}

export class AppointmentService {
  static async createAppointment(request: AppointmentRequest): Promise<{ success: boolean; message: string; eventId?: string }> {
    try {
      const { error } = await supabase.functions.invoke('appointment-manager', {
        body: {
          action: 'create',
          appointmentData: request
        }
      });

      if (error) {
        console.error('Error creating appointment:', error);
        return { success: false, message: 'Erro ao criar agendamento. Tente novamente.' };
      }

      return {
        success: true,
        message: `Agendamento criado com sucesso para ${request.date} às ${request.startTime}`
      };
    } catch (error) {
      console.error('Error in createAppointment:', error);
      return { success: false, message: 'Erro interno ao criar agendamento.' };
    }
  }

  static async updateAppointment(request: AppointmentUpdateRequest): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.functions.invoke('appointment-manager', {
        body: {
          action: 'update',
          eventId: request.eventId,
          appointmentData: request
        }
      });

      if (error) {
        console.error('Error updating appointment:', error);
        return { success: false, message: 'Erro ao atualizar agendamento. Tente novamente.' };
      }

      return {
        success: true,
        message: 'Agendamento atualizado com sucesso'
      };
    } catch (error) {
      console.error('Error in updateAppointment:', error);
      return { success: false, message: 'Erro interno ao atualizar agendamento.' };
    }
  }

  static async deleteAppointment(eventId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.functions.invoke('appointment-manager', {
        body: {
          action: 'delete',
          eventId
        }
      });

      if (error) {
        console.error('Error deleting appointment:', error);
        return { success: false, message: 'Erro ao cancelar agendamento. Tente novamente.' };
      }

      return {
        success: true,
        message: 'Agendamento cancelado com sucesso'
      };
    } catch (error) {
      console.error('Error in deleteAppointment:', error);
      return { success: false, message: 'Erro interno ao cancelar agendamento.' };
    }
  }

  static async listAppointments(date?: string): Promise<{ success: boolean; appointments?: any[]; message: string }> {
    try {
      const { error } = await supabase.functions.invoke('appointment-manager', {
        body: {
          action: 'list',
          date
        }
      });

      if (error) {
        console.error('Error listing appointments:', error);
        return { success: false, message: 'Erro ao buscar agendamentos.' };
      }

      return {
        success: true,
        appointments: [],
        message: 'Agendamentos carregados com sucesso'
      };
    } catch (error) {
      console.error('Error in listAppointments:', error);
      return { success: false, message: 'Erro interno ao buscar agendamentos.' };
    }
  }
}
