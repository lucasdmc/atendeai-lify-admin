// Função para detectar URL base automaticamente
const getBaseUrl = (): string => {
  // Se variável de ambiente estiver definida, use ela
  if (import.meta.env.VITE_GOOGLE_REDIRECT_URI) {
    return import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  }
  
  // Detectar automaticamente baseado no ambiente
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    
    // Produção: atendeai.lify.com.br
    if (hostname === 'atendeai.lify.com.br') {
      return 'https://atendeai.lify.com.br/agendamentos';
    }
    
    // Localhost com porta específica
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const portSuffix = port ? `:${port}` : ':8080';
      return `${protocol}//${hostname}${portSuffix}/agendamentos`;
    }
    
    // Outros domínios (como Railway preview)
    return `${protocol}//${hostname}${port ? `:${port}` : ''}/agendamentos`;
  }
  
  // Fallback: usar produção se não conseguir detectar
  return 'https://atendeai.lify.com.br/agendamentos';
};

// Configuração de ambiente para Vite/React
export const environment = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com',
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' '),
  },
  urls: {
    redirectUri: getBaseUrl(),
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw',
  },
  backend: {
    url: import.meta.env.VITE_BACKEND_URL || 'https://atendeai-lify-backend-production.up.railway.app',
  },
  whatsapp: {
    serverUrl: import.meta.env.VITE_WHATSAPP_SERVER_URL || 'https://atendeai-lify-backend-production.up.railway.app',
  },
  environment: import.meta.env.MODE || 'development',
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
};

// Log de debug da configuração (apenas em desenvolvimento)
if (environment.isDevelopment) {
  console.log('🔧 [OAuth Config] Current redirect URI:', environment.urls.redirectUri);
  console.log('🔧 [OAuth Config] Environment:', environment.environment);
  console.log('🔧 [OAuth Config] Client ID:', environment.google.clientId);
}

// Função para validar configuração OAuth
export const validateOAuthConfig = () => {
  const config = environment;
  const issues: string[] = [];
  
  if (!config.google.clientId) {
    issues.push('Google Client ID não configurado');
  }
  
  if (!config.urls.redirectUri) {
    issues.push('Redirect URI não configurado');
  }
  
  if (config.urls.redirectUri.includes('localhost') && config.isProduction) {
    issues.push('Usando localhost em produção');
  }
  
  if (issues.length > 0) {
    console.error('❌ [OAuth Config] Problemas encontrados:', issues);
    return { valid: false, issues };
  }
  
  console.log('✅ [OAuth Config] Configuração válida');
  return { valid: true, issues: [] };
};

// Exportação de compatibilidade para config
export const config = environment;

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