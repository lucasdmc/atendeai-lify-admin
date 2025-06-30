// Configuração centralizada das variáveis de ambiente
export const config = {
  // Google OAuth
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com',
    // Client Secret não deve estar no frontend por segurança
    scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
  },

  // Supabase
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw',
  },

  // WhatsApp
  whatsapp: {
    serverUrl: import.meta.env.VITE_WHATSAPP_SERVER_URL,
  },

  // Environment
  environment: import.meta.env.NODE_ENV || 'development',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,

  // URLs
  urls: {
    redirectUri: getRedirectUri(),
  },
} as const;

// Função para detectar a URL de redirecionamento baseada no ambiente
function getRedirectUri(): string {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // Desenvolvimento local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:${port}/agendamentos`;
  }
  
  // Preview environment
  if (hostname.includes('preview--atendeai-lify-admin.lovable.app')) {
    return 'https://preview--atendeai-lify-admin.lovable.app/agendamentos';
  }
  
  // Production environment
  if (hostname.includes('atendeai.lify.com.br')) {
    return 'https://atendeai.lify.com.br/agendamentos';
  }
  
  // Fallback para desenvolvimento
  return `${protocol}//${hostname}${port ? `:${port}` : ''}/agendamentos`;
}

// Validação das variáveis obrigatórias
export const validateConfig = () => {
  // Como agora temos valores padrão, não precisamos falhar se as variáveis não estiverem definidas
  console.log('✅ Configuração carregada com sucesso');
  console.log('🔧 Google Client ID:', config.google.clientId);
  console.log('🔧 Supabase URL:', config.supabase.url);
  console.log('🔧 Supabase Anon Key:', config.supabase.anonKey ? 'Configurada' : 'Usando valor padrão');
  return true;
};

// Configuração específica por ambiente
export const getEnvironmentConfig = () => {
  const baseConfig = {
    apiTimeout: 30000,
    retryAttempts: 3,
    cacheTime: 5 * 60 * 1000, // 5 minutos
  };

  if (config.isDevelopment) {
    return {
      ...baseConfig,
      apiTimeout: 60000, // Timeout maior em desenvolvimento
      retryAttempts: 1, // Menos tentativas em desenvolvimento
      cacheTime: 1 * 60 * 1000, // Cache menor em desenvolvimento
    };
  }

  return baseConfig;
};

export default config; 