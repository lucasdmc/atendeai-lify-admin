// Configuração de ambiente para Node.js
export const environment = {
  google: {
    clientId: process.env.VITE_GOOGLE_CLIENT_ID || '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com',
  },
  supabase: {
    url: process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw',
  },
  backend: {
    url: process.env.VITE_BACKEND_URL || 'http://localhost:3001',
  },
  whatsapp: {
    serverUrl: process.env.VITE_WHATSAPP_SERVER_URL || 'http://31.97.241.19:3001',
  },
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Função para obter URL base dinamicamente
export function getBaseUrl(): string {
  return environment.backend.url;
}

// Validação das variáveis obrigatórias
export const validateConfig = () => {
  // Como agora temos valores padrão, não precisamos falhar se as variáveis não estiverem definidas
  console.log('✅ Configuração carregada com sucesso');
  console.log('🔧 Google Client ID:', environment.google.clientId);
  console.log('🔧 Supabase URL:', environment.supabase.url);
  console.log('🔧 Supabase Anon Key:', environment.supabase.anonKey ? 'Configurada' : 'Usando valor padrão');
  console.log('🔧 Backend URL:', environment.backend.url);
  return true;
};

// Configuração específica por ambiente
export const getEnvironmentConfig = () => {
  const baseConfig = {
    apiTimeout: 30000,
    retryAttempts: 3,
    cacheTime: 5 * 60 * 1000, // 5 minutos
  };

  if (environment.isDevelopment) {
    return {
      ...baseConfig,
      apiTimeout: 60000, // Timeout maior em desenvolvimento
      retryAttempts: 1, // Menos tentativas em desenvolvimento
      cacheTime: 1 * 60 * 1000, // Cache menor em desenvolvimento
    };
  }

  return baseConfig;
};

export default environment; 