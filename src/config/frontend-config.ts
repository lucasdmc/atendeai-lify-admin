// ========================================
// CONFIGURAÇÃO DE AMBIENTE FRONTEND
// ========================================

// Função para detectar URL base automaticamente
const getRedirectUri = (): string => {
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
  
  // Fallback para desenvolvimento
  return 'http://localhost:8080/agendamentos';
};

// Configuração para o frontend
export const config = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com',
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ')
  },
  urls: {
    redirectUri: getRedirectUri()
  },
  backend: {
    url: import.meta.env.VITE_BACKEND_URL || 'https://atendeai-lify-backend-production.up.railway.app'
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
  },
  whatsapp: {
    serverUrl: import.meta.env.VITE_WHATSAPP_SERVER_URL || 'https://atendeai-lify-backend-production.up.railway.app'
  }
};

export default config; 