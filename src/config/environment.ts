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