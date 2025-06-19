
import React from 'react';

interface CountryFlagProps {
  countryCode: string;
  className?: string;
}

const CountryFlag: React.FC<CountryFlagProps> = ({ countryCode, className = "w-5 h-5" }) => {
  const flagEmojis: Record<string, string> = {
    'BR': '🇧🇷', // Brasil
    'US': '🇺🇸', // Estados Unidos
    'GB': '🇬🇧', // Reino Unido
    'DE': '🇩🇪', // Alemanha
    'FR': '🇫🇷', // França
    'IT': '🇮🇹', // Itália
    'ES': '🇪🇸', // Espanha
    'PT': '🇵🇹', // Portugal
    'AR': '🇦🇷', // Argentina
    'XX': '🌍', // Desconhecido
  };

  const flag = flagEmojis[countryCode] || flagEmojis['XX'];

  return (
    <span className={`inline-flex items-center justify-center ${className}`} title={countryCode}>
      {flag}
    </span>
  );
};

export default CountryFlag;
