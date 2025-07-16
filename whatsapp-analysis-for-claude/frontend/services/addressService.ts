// Serviço para busca de endereços via CEP e Google Places API

interface AddressData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

interface GooglePlaceResult {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface GooglePlaceDetails {
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

// Buscar endereço por CEP usando ViaCEP
export const searchAddressByCEP = async (cep: string): Promise<AddressData | null> => {
  try {
    // Limpar CEP (remover caracteres especiais)
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }

    console.log('🔍 Buscando CEP:', cleanCEP);
    
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await response.json();

    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    console.log('✅ Endereço encontrado:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar CEP:', error);
    throw error;
  }
};

// Autocompletar endereços usando Google Places API
export const searchAddressSuggestions = async (query: string): Promise<GooglePlaceResult[]> => {
  try {
    if (!query || query.length < 3) {
      return [];
    }

    console.log('🔍 Buscando sugestões para:', query);

    // Usar Google Places Autocomplete API
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ Google Places API Key não configurada');
      return [];
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
      `input=${encodeURIComponent(query)}` +
      `&types=address` +
      `&components=country:br` +
      `&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('❌ Erro na API do Google:', data.status);
      return [];
    }

    console.log('✅ Sugestões encontradas:', data.predictions.length);
    return data.predictions;
  } catch (error) {
    console.error('❌ Erro ao buscar sugestões:', error);
    return [];
  }
};

// Buscar detalhes de um lugar específico
export const getPlaceDetails = async (placeId: string): Promise<GooglePlaceDetails | null> => {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ Google Places API Key não configurada');
      return null;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?` +
      `place_id=${placeId}` +
      `&fields=address_components,formatted_address,geometry` +
      `&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('❌ Erro ao buscar detalhes:', data.status);
      return null;
    }

    console.log('✅ Detalhes do lugar:', data.result);
    return data.result;
  } catch (error) {
    console.error('❌ Erro ao buscar detalhes:', error);
    return null;
  }
};

// Extrair componentes do endereço dos detalhes do Google
export const extractAddressComponents = (details: GooglePlaceDetails) => {
  const components = {
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: ''
  };

  details.address_components.forEach(component => {
    const types = component.types;
    
    if (types.includes('route')) {
      components.street = component.long_name;
    } else if (types.includes('street_number')) {
      components.number = component.long_name;
    } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
      components.neighborhood = component.long_name;
    } else if (types.includes('administrative_area_level_2')) {
      components.city = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      components.state = component.short_name;
    } else if (types.includes('postal_code')) {
      components.cep = component.long_name;
    }
  });

  return components;
};

// Formatar endereço completo
export const formatFullAddress = (addressData: AddressData): string => {
  const parts = [
    addressData.logradouro,
    addressData.bairro,
    addressData.localidade,
    addressData.uf
  ].filter(Boolean);

  return parts.join(', ');
};

// Validar formato do CEP
export const validateCEP = (cep: string): boolean => {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8;
}; 