import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Search } from 'lucide-react';
import { 
  searchAddressByCEP, 
  searchAddressSuggestions, 
  getPlaceDetails, 
  extractAddressComponents,
  validateCEP 
} from '@/services/addressService';

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddressComplete?: (address: {
    address: string;
    city: string;
    state: string;
    cep?: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

interface AddressSuggestion {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export const AddressInput = ({ 
  value, 
  onChange, 
  onAddressComplete, 
  placeholder = "Digite o endereço ou CEP",
  className 
}: AddressInputProps) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cepValue, setCepValue] = useState('');
  const [isSearchingCEP, setIsSearchingCEP] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce para busca de sugestões
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (value.length >= 3 && !validateCEP(value)) {
        setIsLoading(true);
        try {
          const results = await searchAddressSuggestions(value);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Erro ao buscar sugestões:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value;
    setCepValue(cep);
    
    // Formatar CEP automaticamente
    const formattedCEP = cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
    setCepValue(formattedCEP);
  };

  const handleCEPSearch = async () => {
    if (!validateCEP(cepValue)) {
      return;
    }

    setIsSearchingCEP(true);
    try {
      const addressData = await searchAddressByCEP(cepValue);
      if (addressData) {
        const fullAddress = `${addressData.logradouro}, ${addressData.bairro}, ${addressData.localidade} - ${addressData.uf}`;
        onChange(fullAddress);
        
        if (onAddressComplete) {
          onAddressComplete({
            address: fullAddress,
            city: addressData.localidade,
            state: addressData.uf,
            cep: addressData.cep
          });
        }
        
        setCepValue('');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setIsSearchingCEP(false);
    }
  };

  const handleSuggestionClick = async (suggestion: AddressSuggestion) => {
    setIsLoading(true);
    try {
      const details = await getPlaceDetails(suggestion.place_id);
      if (details) {
        const components = extractAddressComponents(details);
        const fullAddress = details.formatted_address;
        
        onChange(fullAddress);
        
        if (onAddressComplete) {
          onAddressComplete({
            address: fullAddress,
            city: components.city,
            state: components.state,
            cep: components.cep
          });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
    } finally {
      setIsLoading(false);
      setShowSuggestions(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Campo de CEP */}
      <div className="flex gap-2 mb-2">
        <div className="flex-1">
          <Input
            value={cepValue}
            onChange={handleCEPChange}
            placeholder="CEP (opcional)"
            maxLength={9}
            className="text-sm"
          />
        </div>
        <Button
          type="button"
          onClick={handleCEPSearch}
          disabled={!validateCEP(cepValue) || isSearchingCEP}
          size="sm"
          variant="outline"
          className="shrink-0"
        >
          {isSearchingCEP ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Campo de endereço com autocompletar */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}

        {/* Sugestões */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">
                      {suggestion.structured_formatting.main_text}
                    </div>
                    <div className="text-xs text-gray-500">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 