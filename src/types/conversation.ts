export interface Conversation {
  id: string;
  phone_number: string;
  formatted_phone_number: string | null;
  country_code: string | null;
  name: string | null;
  updated_at: string;
  last_message_preview: string | null;
  unread_count: number | null;
  message_count?: number;
}

export interface Message {
  id: string;
  content: string;
  message_type: 'received' | 'sent';
  timestamp: string;
  whatsapp_message_id: string | null;
}