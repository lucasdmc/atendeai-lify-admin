import { supabase } from '../integrations/supabase/client';

export interface Clinic {
  id: string;
  name: string;
  whatsapp_phone: string;
  contextualization_json: any;
  has_contextualization: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicContextualization {
  clinic_id: string;
  contextualization_json: any;
  has_contextualization: boolean;
}

export class ClinicService {
  static async getClinics(): Promise<Clinic[]> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ [ClinicService] Erro ao buscar clínicas:', error);
      throw error;
    }
  }

  static async getClinic(id: string): Promise<Clinic | null> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ [ClinicService] Erro ao buscar clínica:', error);
      throw error;
    }
  }

  static async createClinic(clinic: Omit<Clinic, 'id' | 'created_at' | 'updated_at'>): Promise<Clinic> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .insert([clinic])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ [ClinicService] Erro ao criar clínica:', error);
      throw error;
    }
  }

  static async updateClinic(id: string, updates: Partial<Clinic>): Promise<Clinic> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ [ClinicService] Erro ao atualizar clínica:', error);
      throw error;
    }
  }

  static async deleteClinic(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('clinics')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('❌ [ClinicService] Erro ao deletar clínica:', error);
      throw error;
    }
  }

  static async getClinicContextualization(clinicId: string): Promise<ClinicContextualization | null> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, contextualization_json, has_contextualization')
        .eq('id', clinicId)
        .single();

      if (error) throw error;
      
      if (!data) return null;

      return {
        clinic_id: data.id,
        contextualization_json: data.contextualization_json || {},
        has_contextualization: data.has_contextualization || false
      };
    } catch (error) {
      console.error('❌ [ClinicService] Erro ao buscar contextualização:', error);
      throw error;
    }
  }

  static async updateClinicContextualization(clinicId: string, contextualization: any): Promise<ClinicContextualization> {
    try {
      const hasContextualization = contextualization && Object.keys(contextualization).length > 0;
      
      const { data, error } = await supabase
        .from('clinics')
        .update({
          contextualization_json: contextualization,
          has_contextualization: hasContextualization
        })
        .eq('id', clinicId)
        .select('id, contextualization_json, has_contextualization')
        .single();

      if (error) throw error;
      
      return {
        clinic_id: data.id,
        contextualization_json: data.contextualization_json || {},
        has_contextualization: data.has_contextualization || false
      };
    } catch (error) {
      console.error('❌ [ClinicService] Erro ao atualizar contextualização:', error);
      throw error;
    }
  }

  static async getClinicByWhatsAppPhone(whatsappPhone: string): Promise<Clinic | null> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('whatsapp_phone', whatsappPhone)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ [ClinicService] Erro ao buscar clínica por WhatsApp:', error);
      return null;
    }
  }
} 