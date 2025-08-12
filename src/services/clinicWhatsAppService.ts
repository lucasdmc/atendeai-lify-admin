import { supabase } from '@/integrations/supabase/client';

export interface ClinicWhatsAppMapping {
  clinic_id: string;
  phone_number_id: string;
  display_phone_number: string | null;
}

export class ClinicWhatsAppService {
  static async getMappingByClinicId(clinicId: string): Promise<ClinicWhatsAppMapping | null> {
    const { data, error } = await supabase
      .from('clinic_whatsapp_numbers')
      .select('clinic_id, phone_number_id, display_phone_number')
      .eq('clinic_id', clinicId)
      .maybeSingle();

    if (error) throw error;
    return (data as ClinicWhatsAppMapping) || null;
  }

  static async upsertMapping(params: ClinicWhatsAppMapping): Promise<ClinicWhatsAppMapping> {
    const { data, error } = await supabase
      .from('clinic_whatsapp_numbers')
      .upsert(params, { onConflict: 'clinic_id' })
      .select('clinic_id, phone_number_id, display_phone_number')
      .single();

    if (error) throw error;
    return data as ClinicWhatsAppMapping;
  }
}
