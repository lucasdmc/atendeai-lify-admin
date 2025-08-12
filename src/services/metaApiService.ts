import axios from 'axios';
import { config } from '@/config/environment';

export interface MetaPhoneNumber {
  id: string; // phone_number_id
  display_phone_number: string;
  verified_name?: string;
}

export class MetaApiService {
  static async listPhoneNumbers(): Promise<MetaPhoneNumber[]> {
    const token = import.meta.env.VITE_META_ACCESS_TOKEN || '';
    const wabaId = import.meta.env.VITE_META_WABA_ID || '';
    const version = import.meta.env.VITE_WHATSAPP_API_VERSION || 'v20.0';
    if (!token || !wabaId) throw new Error('VITE_META_ACCESS_TOKEN/VITE_META_WABA_ID não configurados');
    const url = `https://graph.facebook.com/${version}/${wabaId}/phone_numbers`;
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const items = (res.data?.data || []).map((n: any) => ({
      id: n.id,
      display_phone_number: n.display_phone_number,
      verified_name: n.verified_name,
    }));
    return items;
  }
}
