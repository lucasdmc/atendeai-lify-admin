/**
 * Utilitários para validação de formato de telefone conforme padrão da Meta
 */

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validação rigorosa para formato Meta WhatsApp
 * Formato esperado: +5511999999999 ou +551199999999 (8 ou 9 dígitos após DDD)
 */
export const validateMetaPhoneFormat = (phoneNumber: string): PhoneValidationResult => {
  // Remove espaços e caracteres especiais
  const cleanNumber = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  
  // Verificar se está vazio
  if (!cleanNumber) {
    return { isValid: false, error: 'Número de telefone é obrigatório' };
  }
  
  // Verificar se começa com +
  if (!cleanNumber.startsWith('+')) {
    return { isValid: false, error: 'Número deve começar com + (formato internacional)' };
  }
  
  // Verificar se tem código do país +55 (Brasil)
  if (!cleanNumber.startsWith('+55')) {
    return { isValid: false, error: 'Número deve ter código do país +55 (Brasil)' };
  }
  
  // Extrair apenas os números após o +
  const numbersOnly = cleanNumber.substring(1).replace(/\D/g, '');
  
  // Verificar se tem 12 ou 13 dígitos (55 + 2 DDD + 8 ou 9 número)
  if (numbersOnly.length !== 12 && numbersOnly.length !== 13) {
    return { isValid: false, error: 'Número deve ter 12 ou 13 dígitos (código do país + DDD + número)' };
  }
  
  // Verificar se o código do país é 55
  if (numbersOnly.substring(0, 2) !== '55') {
    return { isValid: false, error: 'Código do país deve ser 55 (Brasil)' };
  }
  
  // Verificar se o DDD é válido (11-99)
  const ddd = numbersOnly.substring(2, 4);
  const dddNum = parseInt(ddd);
  if (dddNum < 11 || dddNum > 99) {
    return { isValid: false, error: 'DDD deve estar entre 11 e 99' };
  }
  
  // Verificar se o número tem 8 ou 9 dígitos
  const number = numbersOnly.substring(4);
  if (number.length !== 8 && number.length !== 9) {
    return { isValid: false, error: 'Número deve ter 8 ou 9 dígitos após o DDD' };
  }
  
  // Verificar se o número não começa com 0
  if (number.startsWith('0')) {
    return { isValid: false, error: 'Número não pode começar com 0' };
  }
  
  return { isValid: true };
};

/**
 * Formata número de telefone para formato internacional da Meta
 * Converte qualquer formato para +5511999999999 ou +551199999999
 */
export const formatPhoneNumberForMeta = (input: string): string => {
  // Remove tudo exceto números e +
  const cleanInput = input.replace(/[^\d+]/g, '');
  
  // Se não tem números, retorna vazio
  if (!cleanInput.replace('+', '')) return '';
  
  // Se já tem +, mantém como está
  if (cleanInput.startsWith('+')) {
    return cleanInput;
  }
  
  // Remove tudo exceto números
  const numbers = cleanInput.replace(/\D/g, '');
  
  // Se começa com 0, remove
  const cleanNumbers = numbers.startsWith('0') ? numbers.slice(1) : numbers;
  
  // Se tem 10 dígitos (DDD + 8 dígitos), adiciona +55
  if (cleanNumbers.length === 10) {
    return `+55${cleanNumbers}`;
  }
  
  // Se tem 11 dígitos (DDD + 9 dígitos), adiciona +55
  if (cleanNumbers.length === 11) {
    return `+55${cleanNumbers}`;
  }
  
  // Se tem 12 dígitos (código do país + DDD + 8 dígitos), adiciona +
  if (cleanNumbers.length === 12 && cleanNumbers.startsWith('55')) {
    return `+${cleanNumbers}`;
  }
  
  // Se tem 13 dígitos (código do país + DDD + 9 dígitos), adiciona +
  if (cleanNumbers.length === 13 && cleanNumbers.startsWith('55')) {
    return `+${cleanNumbers}`;
  }
  
  // Caso padrão, adiciona +55
  return `+55${cleanNumbers}`;
};

/**
 * Verifica se um número de telefone está no formato correto para Meta API
 * e retorna uma mensagem de erro específica se não estiver
 */
export const validateAndFormatPhoneForMeta = (phoneNumber: string): {
  isValid: boolean;
  formatted: string;
  error?: string;
} => {
  const formatted = formatPhoneNumberForMeta(phoneNumber);
  const validation = validateMetaPhoneFormat(formatted);
  
  return {
    isValid: validation.isValid,
    formatted,
    error: validation.error
  };
}; 