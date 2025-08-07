const { supabase } = require('../config/database');

class ClinicService {
  // Buscar todas as clínicas
  static async getAllClinics() {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar clínicas:', error);
        throw new Error('Erro ao buscar clínicas');
      }

      return data || [];
    } catch (error) {
      console.error('Erro no ClinicService.getAllClinics:', error);
      throw error;
    }
  }

  // Buscar clínica por ID
  static async getClinicById(id) {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar clínica:', error);
        throw new Error('Clínica não encontrada');
      }

      return data;
    } catch (error) {
      console.error('Erro no ClinicService.getClinicById:', error);
      throw error;
    }
  }

  // Atualizar clínica
  static async updateClinic(id, updates) {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar clínica:', error);
        throw new Error('Erro ao atualizar clínica');
      }

      return data;
    } catch (error) {
      console.error('Erro no ClinicService.updateClinic:', error);
      throw error;
    }
  }

  // Deletar clínica
  static async deleteClinic(id) {
    try {
      const { error } = await supabase
        .from('clinics')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar clínica:', error);
        throw new Error('Erro ao deletar clínica');
      }

      return true;
    } catch (error) {
      console.error('Erro no ClinicService.deleteClinic:', error);
      throw error;
    }
  }

  // Criar clínica
  static async createClinic(clinicData) {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .insert([{
          ...clinicData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar clínica:', error);
        throw new Error('Erro ao criar clínica');
      }

      return data;
    } catch (error) {
      console.error('Erro no ClinicService.createClinic:', error);
      throw error;
    }
  }
}

module.exports = ClinicService; 