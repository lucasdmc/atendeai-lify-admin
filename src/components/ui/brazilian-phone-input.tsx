import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface BrazilianPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export const BrazilianPhoneInput = ({ 
  value, 
  onChange, 
  placeholder = "Digite o telefone",
  disabled = false,
  className = "",
  required = false
}: BrazilianPhoneInputProps) => {
  const [displayValue, setDisplayValue] = useState('');

  // Formata o número para exibição: (47) 9999-9999 ou (47) 99999-9999
  const formatDisplayValue = (input: string): string => {
    // Remove tudo exceto números
    const numbers = input.replace(/\D/g, '');
    
    // Se não tem números, retorna vazio
    if (numbers.length === 0) return '';
    
    // Se começa com 0, remove
    const cleanNumbers = numbers.startsWith('0') ? numbers.slice(1) : numbers;
    
    // Formata para exibição
    if (cleanNumbers.length <= 2) {
      return `(${cleanNumbers}`;
    } else if (cleanNumbers.length <= 6) {
      return `(${cleanNumbers.slice(0, 2)}) ${cleanNumbers.slice(2)}`;
    } else if (cleanNumbers.length <= 10) {
      // 8 dígitos: (47) 9999-9999
      return `(${cleanNumbers.slice(0, 2)}) ${cleanNumbers.slice(2, 6)}-${cleanNumbers.slice(6)}`;
    } else if (cleanNumbers.length <= 11) {
      // 9 dígitos: (47) 99999-9999
      return `(${cleanNumbers.slice(0, 2)}) ${cleanNumbers.slice(2, 7)}-${cleanNumbers.slice(7)}`;
    } else {
      // Limita a 11 dígitos (DDD + 9 dígitos)
      const limited = cleanNumbers.slice(0, 11);
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    }
  };

  // Converte para formato WhatsApp: +554799999999 ou +5547999999999
  const formatWhatsAppValue = (input: string): string => {
    // Remove tudo exceto números
    const numbers = input.replace(/\D/g, '');
    
    // Se não tem números, retorna vazio
    if (numbers.length === 0) return '';
    
    // Se começa com 0, remove
    const cleanNumbers = numbers.startsWith('0') ? numbers.slice(1) : numbers;
    
    // Se já tem código do país, retorna como está
    if (input.startsWith('+')) {
      return input;
    }
    
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

  // Atualiza o valor de exibição quando o valor externo muda
  useEffect(() => {
    if (value && value.trim() !== '') {
      // Se o valor já está no formato WhatsApp, converte para exibição
      if (value.startsWith('+55')) {
        const numbers = value.replace('+55', '');
        setDisplayValue(formatDisplayValue(numbers));
      } else {
        setDisplayValue(formatDisplayValue(value));
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleInputChange = (input: string) => {
    // Remove caracteres não permitidos (apenas números, parênteses, hífen e espaço)
    const allowedChars = input.replace(/[^\d()\-\s]/g, '');
    
    // Formata para exibição
    const formattedDisplay = formatDisplayValue(allowedChars);
    setDisplayValue(formattedDisplay);
    
    // Converte para formato WhatsApp e chama onChange
    const whatsappValue = formatWhatsAppValue(allowedChars);
    onChange(whatsappValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permite apenas números, backspace, delete, setas, tab, enter
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];
    
    const isNumber = /^\d$/.test(e.key);
    const isAllowedKey = allowedKeys.includes(e.key);
    const isControlKey = e.ctrlKey || e.metaKey;
    
    if (!isNumber && !isAllowedKey && !isControlKey) {
      e.preventDefault();
    }
  };

  return (
    <Input
      type="tel"
      value={displayValue}
      onChange={(e) => handleInputChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      required={required}
      maxLength={15} // (47) 99999-9999 = 15 caracteres
    />
  );
}; 