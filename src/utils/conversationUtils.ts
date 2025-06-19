
interface Conversation {
  id: string;
  phone_number: string;
  formatted_phone_number: string | null;
  country_code: string | null;
  name: string | null;
  updated_at: string;
  last_message_preview: string | null;
  unread_count: number | null;
}

export const getDisplayName = (conversation: Conversation) => {
  if (conversation?.name && conversation.name !== conversation.phone_number && !conversation.name.includes('@s.whatsapp.net')) {
    return conversation.name;
  }
  return conversation?.formatted_phone_number || conversation?.phone_number || 'Contato Desconhecido';
};

export const formatMessageTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};
