import { supabase } from '@/integrations/supabase/client';
import { normalizeWhatsappNumberForDb } from '@/utils/metaPhoneNumberValidation';

export interface ClinicWhatsAppMapping {
	clinic_id: string;
	phone_number_id: string;
	display_phone_number: string | null;
	whatsapp_number?: string | null;
}

export class ClinicWhatsAppService {
	static async getMappingByClinicId(clinicId: string): Promise<ClinicWhatsAppMapping | null> {
		const { data, error } = await supabase
			.from('clinic_whatsapp_numbers')
			.select('clinic_id, phone_number_id, display_phone_number, whatsapp_number')
			.eq('clinic_id', clinicId)
			.maybeSingle();

		if (error) throw error;
		return (data as ClinicWhatsAppMapping) || null;
	}

	static async upsertMapping(params: ClinicWhatsAppMapping): Promise<ClinicWhatsAppMapping> {
		const normalized = params.display_phone_number ? normalizeWhatsappNumberForDb(params.display_phone_number) : null;
		const payload = {
			clinic_id: params.clinic_id,
			phone_number_id: params.phone_number_id,
			display_phone_number: params.display_phone_number,
			whatsapp_number: normalized,
		};

		const { data, error } = await supabase
			.from('clinic_whatsapp_numbers')
			.upsert(payload as any, { onConflict: 'clinic_id' })
			.select('clinic_id, phone_number_id, display_phone_number, whatsapp_number')
			.single();

		if (error) {
			// Tratar erros de unicidade (duplicidade 1:1)
			const msg = (error as any)?.message || '';
			if (msg.includes('whatsapp_number') || msg.includes('phone_number_id') || msg.includes('clinic_id')) {
				throw new Error('Cada número de WhatsApp só pode estar vinculado a uma clínica. Verifique se o número já está cadastrado.');
			}
			throw error;
		}
		return data as ClinicWhatsAppMapping;
	}
}
