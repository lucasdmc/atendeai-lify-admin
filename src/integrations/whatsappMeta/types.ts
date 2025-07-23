// Tipos básicos para integração com a API oficial do WhatsApp (Meta)

export interface WhatsAppTextMessagePayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: {
    body: string;
  };
}

export interface WhatsAppAPIResponse {
  messages: Array<{ id: string }>;
  // ... outros campos relevantes
} 