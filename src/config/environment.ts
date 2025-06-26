// Configuração centralizada das variáveis de ambiente
export const config = {
  // Google OAuth
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
    scopes: 'https://www.googleapis.com/auth/calendar',
  },

  // Supabase
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
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
    redirectUri: `${window.location.origin}/agendamentos`,
  },
} as const;

// Validação das variáveis obrigatórias
export const validateConfig = () => {
  const requiredVars = [
    'VITE_GOOGLE_CLIENT_ID',
    'VITE_GOOGLE_CLIENT_SECRET',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const missingVars = requiredVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    console.error('❌ Variáveis de ambiente obrigatórias não configuradas:', missingVars);
    return false;
  }

  console.log('✅ Todas as variáveis de ambiente estão configuradas');
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