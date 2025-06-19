
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
  // Log para debug
  console.log('getDisplayName - Conversation data:', {
    name: conversation?.name,
    phone_number: conversation?.phone_number,
    formatted_phone_number: conversation?.formatted_phone_number
  });
  
  // Primeiro, verificar se há um nome salvo e se é válido
  if (conversation?.name && 
      conversation.name.trim() && 
      conversation.name !== conversation.phone_number && 
      !conversation.name.includes('@s.whatsapp.net') &&
      !conversation.name.includes('@c.us') &&
      conversation.name !== 'null' &&
      conversation.name !== 'undefined') {
    console.log('getDisplayName - Using saved name:', conversation.name);
    return conversation.name;
  }
  
  // Se não há nome válido, usar o número formatado ou original
  const phoneToDisplay = conversation?.formatted_phone_number || conversation?.phone_number;
  
  // Se o número ainda contém @s.whatsapp.net, remover
  if (phoneToDisplay && phoneToDisplay.includes('@s.whatsapp.net')) {
    const cleanNumber = phoneToDisplay.replace('@s.whatsapp.net', '');
    // Tentar formatar o número limpo
    if (cleanNumber.startsWith('55') && cleanNumber.length >= 12) {
      // Formato brasileiro
      const countryCode = cleanNumber.substring(0, 2);
      const areaCode = cleanNumber.substring(2, 4);
      const number = cleanNumber.substring(4);
      return `+${countryCode} (${areaCode}) ${number.substring(0, 5)}-${number.substring(5)}`;
    }
    return `+${cleanNumber}`;
  }
  
  console.log('getDisplayName - Using phone number:', phoneToDisplay);
  return phoneToDisplay || 'Contato Desconhecido';
};

export const formatMessageTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};
