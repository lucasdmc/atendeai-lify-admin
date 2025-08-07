
import { Conversation } from '@/types/conversation';

export const getDisplayName = (conversation: Conversation | null | undefined) => {
  // Verificação de segurança
  if (!conversation) {
    return 'Contato Desconhecido';
  }

  // Log para debug
  console.log('getDisplayName - Conversation data:', {
    patient_name: conversation?.patient_name,
    patient_phone_number: conversation?.patient_phone_number,
    clinic_whatsapp_number: conversation?.clinic_whatsapp_number
  });
  
  // Primeiro, verificar se há um nome salvo e se é válido
  if (conversation.patient_name && 
      conversation.patient_name.trim() && 
      conversation.patient_name !== conversation.patient_phone_number && 
      !conversation.patient_name.includes('@s.whatsapp.net') &&
      !conversation.patient_name.includes('@c.us') &&
      conversation.patient_name !== 'null' &&
      conversation.patient_name !== 'undefined') {
    console.log('getDisplayName - Using saved name:', conversation.patient_name);
    return conversation.patient_name;
  }
  
  // Se não há nome válido, usar o número do paciente
  const phoneToDisplay = conversation.patient_phone_number;
  
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

export const formatPhoneNumber = (conversation: Conversation | null | undefined) => {
  if (!conversation) {
    return '';
  }

  const phoneToDisplay = conversation.patient_phone_number;
  
  if (!phoneToDisplay) {
    return '';
  }

  // Se o número contém @s.whatsapp.net, remover
  let cleanNumber = phoneToDisplay;
  if (phoneToDisplay.includes('@s.whatsapp.net')) {
    cleanNumber = phoneToDisplay.replace('@s.whatsapp.net', '');
  }
  
  // Formatar o número se necessário
  if (cleanNumber.startsWith('55') && cleanNumber.length >= 12) {
    // Formato brasileiro
    const countryCode = cleanNumber.substring(0, 2);
    const areaCode = cleanNumber.substring(2, 4);
    const number = cleanNumber.substring(4);
    return `+${countryCode} (${areaCode}) ${number.substring(0, 5)}-${number.substring(5)}`;
  } else if (!cleanNumber.startsWith('+')) {
    return `+${cleanNumber}`;
  }
  
  return cleanNumber;
};

export const formatMessageTime = (timestamp: string | null | undefined) => {
  if (!timestamp) {
    return '';
  }
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (error) {
    console.error('Error formatting message time:', error);
    return '';
  }
};
