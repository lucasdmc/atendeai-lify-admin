export interface Conversation {
  id: string;
  patient_phone_number: string;
  clinic_whatsapp_number: string;
  patient_name: string | null;
  last_message_preview: string | null;
  unread_count: number | null;
  last_message_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  clinic_id: string | null;
}

export interface Message {
  id: string;
  content: string;
  message_type: 'received' | 'sent';
  timestamp: string;
  whatsapp_message_id: string | null;
}