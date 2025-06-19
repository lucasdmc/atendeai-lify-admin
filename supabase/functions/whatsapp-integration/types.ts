
export interface WhatsappMessage {
  to: string;
  message: string;
}

export interface WebhookData {
  event: string;
  data?: {
    message?: string;
    from: string;
    pushName?: string;
    notifyName?: string;
    contact?: {
      name?: string;
    };
    timestamp?: number;
  };
}

export interface ConversationData {
  id: string;
  phone_number: string;
  last_message_preview: string;
  updated_at: string;
  name?: string;
}
