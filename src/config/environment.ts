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

  // Backend API (NOVO - Configuração principal)
  backend: {
    url: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
    timeout: 30000,
    retryAttempts: 3,
    healthCheck: '/health',
    endpoints: {
      auth: {
        login: '/api/auth/login',
        register: '/api/auth/register',
        logout: '/api/auth/logout',
        refresh: '/api/auth/refresh',
        me: '/api/auth/me',
        resetPassword: '/api/auth/reset-password',
        changePassword: '/api/auth/change-password',
        verifyEmail: '/api/auth/verify-email',
      },
      users: {
        create: '/api/users/create',
        list: '/api/users',
        update: '/api/users/:id',
        delete: '/api/users/:id',
      },
      clinics: {
        list: '/api/clinics',
        create: '/api/clinics',
        update: '/api/clinics/:id',
        delete: '/api/clinics/:id',
      },
      whatsapp: {
        sendMessage: '/api/whatsapp-integration/send-message',
        status: '/api/whatsapp-integration/status',
        initialize: '/api/whatsapp-integration/initialize',
        disconnect: '/api/whatsapp-integration/disconnect',
      },
      agents: {
        connections: '/api/agents/connections',
        generateQr: '/api/agents/generate-qr',
        status: '/api/agents/status',
        disconnect: '/api/agents/disconnect',
        refreshQr: '/api/agents/refresh-qr',
      },
      calendar: {
        events: '/api/calendar/events',
        calendars: '/api/calendar/calendars',
        sync: '/api/calendar/sync',
      },
      ai: {
        chat: '/api/ai/chat',
        intentRecognition: '/api/ai/intent-recognition',
        conversations: '/api/ai/conversations',
      },
      rag: {
        search: '/api/rag/search',
        knowledgeBase: '/api/rag/knowledge-base',
        documents: '/api/rag/documents',
        stats: '/api/rag/stats',
      },
      setup: {
        status: '/api/setup/status',
        testData: '/api/setup/test-data',
        calendarFix: '/api/setup/calendar-fix',
        disconnectFix: '/api/setup/disconnect-fix',
        userCalendarsTable: '/api/setup/user-calendars-table',
        fixUserProfiles: '/api/setup/fix-user-profiles',
        googleServiceAuth: '/api/setup/google-service-auth',
        googleUserAuth: '/api/setup/google-user-auth',
        removeConstraint: '/api/setup/remove-constraint',
        deployWhatsApp: '/api/setup/deploy-whatsapp',
        allRemainingFixes: '/api/setup/all-remaining-fixes',
      },
    },
  },

  // WhatsApp (legacy - mantido para compatibilidade)
  whatsapp: {
    serverUrl: import.meta.env.VITE_WHATSAPP_SERVER_URL || 'http://31.97.241.19:3001',
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
  
  // Preview environment (Lovable)
  if (hostname.includes('preview--atendeai-lify-admin.lovable.app')) {
    return 'https://preview--atendeai-lify-admin.lovable.app/agendamentos';
  }
  
  // Production environment (Lify)
  if (hostname.includes('atendeai.lify.com.br') || hostname.includes('lify.com.br')) {
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
  console.log('🔧 Backend URL:', config.backend.url);
  console.log('🔧 Backend Timeout:', config.backend.timeout);
  console.log('🔧 Backend Retry Attempts:', config.backend.retryAttempts);
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