const { supabase } = require('../config/database');

class AppointmentService {
  // Buscar todos os agendamentos
  static async getAllAppointments() {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          user_profiles(name, email),
          clinics(name, address)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        throw new Error('Erro ao buscar agendamentos');
      }

      return data || [];
    } catch (error) {
      console.error('Erro no AppointmentService.getAllAppointments:', error);
      throw error;
    }
  }

  // Buscar agendamento por ID
  static async getAppointmentById(id) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          user_profiles(name, email),
          clinics(name, address)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar agendamento:', error);
        throw new Error('Agendamento não encontrado');
      }

      return data;
    } catch (error) {
      console.error('Erro no AppointmentService.getAppointmentById:', error);
      throw error;
    }
  }

  // Buscar agendamentos por usuário
  static async getAppointmentsByUser(userId) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clinics(name, address)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar agendamentos do usuário:', error);
        throw new Error('Erro ao buscar agendamentos');
      }

      return data || [];
    } catch (error) {
      console.error('Erro no AppointmentService.getAppointmentsByUser:', error);
      throw error;
    }
  }

  // Buscar agendamentos por clínica
  static async getAppointmentsByClinic(clinicId) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          user_profiles(name, email)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar agendamentos da clínica:', error);
        throw new Error('Erro ao buscar agendamentos');
      }

      return data || [];
    } catch (error) {
      console.error('Erro no AppointmentService.getAppointmentsByClinic:', error);
      throw error;
    }
  }

  // Atualizar agendamento
  static async updateAppointment(id, updates) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar agendamento:', error);
        throw new Error('Erro ao atualizar agendamento');
      }

      return data;
    } catch (error) {
      console.error('Erro no AppointmentService.updateAppointment:', error);
      throw error;
    }
  }

  // Deletar agendamento
  static async deleteAppointment(id) {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar agendamento:', error);
        throw new Error('Erro ao deletar agendamento');
      }

      return true;
    } catch (error) {
      console.error('Erro no AppointmentService.deleteAppointment:', error);
      throw error;
    }
  }

  // Criar agendamento
  static async createAppointment(appointmentData) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          ...appointmentData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar agendamento:', error);
        throw new Error('Erro ao criar agendamento');
      }

      return data;
    } catch (error) {
      console.error('Erro no AppointmentService.createAppointment:', error);
      throw error;
    }
  }
}

module.exports = AppointmentService; 