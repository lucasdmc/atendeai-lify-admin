import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const PhoneInput = ({ 
  value, 
  onChange, 
  placeholder = "Digite o telefone",
  disabled = false,
  className = ""
}: PhoneInputProps) => {
  const [displayValue, setDisplayValue] = useState('');

  // Formata o número para exibição: (11) 99999-9999
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
      return `(${cleanNumbers.slice(0, 2)}) ${cleanNumbers.slice(2, 6)}-${cleanNumbers.slice(6)}`;
    } else {
      return `(${cleanNumbers.slice(0, 2)}) ${cleanNumbers.slice(2, 7)}-${cleanNumbers.slice(7, 11)}`;
    }
  };

  // Converte para formato internacional: +5511999999999
  const formatInternationalValue = (input: string): string => {
    // Remove tudo exceto números
    const numbers = input.replace(/\D/g, '');
    
    // Se não tem números, retorna vazio
    if (numbers.length === 0) return '';
    
    // Se começa com 0, remove
    const cleanNumbers = numbers.startsWith('0') ? numbers.slice(1) : numbers;
    
    // Se tem 11 dígitos (DDD + 9 dígitos), adiciona +55
    if (cleanNumbers.length === 11) {
      return `+55${cleanNumbers}`;
    }
    
    // Se já tem código do país, retorna como está
    if (input.startsWith('+')) {
      return input;
    }
    
    // Se tem 13 dígitos (código do país + DDD + número), adiciona +
    if (cleanNumbers.length === 13 && cleanNumbers.startsWith('55')) {
      return `+${cleanNumbers}`;
    }
    
    // Se tem 12 dígitos (código do país + DDD + número sem 9), adiciona +
    if (cleanNumbers.length === 12 && cleanNumbers.startsWith('55')) {
      return `+${cleanNumbers}`;
    }
    
    // Caso padrão, adiciona +55
    return `+55${cleanNumbers}`;
  };

  // Atualiza o valor de exibição quando o valor externo muda
  useEffect(() => {
    if (value) {
      // Se o valor já está no formato internacional, converte para exibição
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
    // Formata para exibição
    const formattedDisplay = formatDisplayValue(input);
    setDisplayValue(formattedDisplay);
    
    // Converte para formato internacional e chama onChange
    const internationalValue = formatInternationalValue(input);
    onChange(internationalValue);
  };

  return (
    <Input
      type="tel"
      value={displayValue}
      onChange={(e) => handleInputChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      maxLength={15} // (11) 99999-9999 = 15 caracteres
    />
  );
}; 