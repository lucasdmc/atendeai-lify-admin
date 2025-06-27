// Script para debugar a configuração do frontend
console.log('=== DEBUG FRONTEND CONFIG ===');

// Simular as variáveis de ambiente do Vite
const mockEnv = {
  VITE_GOOGLE_CLIENT_ID: '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com',
  VITE_GOOGLE_CLIENT_SECRET: 'GOCSPX-...', // Será undefined se não estiver configurado
  VITE_SUPABASE_URL: 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  NODE_ENV: 'production',
  DEV: false,
  PROD: true
};

// Simular a função getRedirectUri
function getRedirectUri(hostname = 'preview--atendeai-lify-admin.lovable.app') {
  const protocol = 'https:';
  const port = '';
  
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

// Simular a configuração
const config = {
  google: {
    clientId: mockEnv.VITE_GOOGLE_CLIENT_ID,
    clientSecret: mockEnv.VITE_GOOGLE_CLIENT_SECRET,
    scopes: 'https://www.googleapis.com/auth/calendar',
  },
  environment: mockEnv.NODE_ENV || 'development',
  isDevelopment: mockEnv.DEV,
  isProduction: mockEnv.PROD,
  urls: {
    redirectUri: getRedirectUri(),
  },
};

console.log('=== CONFIGURAÇÃO ATUAL ===');
console.log('Google Client ID:', config.google.clientId);
console.log('Google Client Secret:', config.google.clientSecret ? '✅ Configurado' : '❌ Não configurado');
console.log('Environment:', config.environment);
console.log('Is Development:', config.isDevelopment);
console.log('Is Production:', config.isProduction);
console.log('Redirect URI:', config.urls.redirectUri);

console.log('\n=== TESTE DE URLS ===');
const testHostnames = [
  'localhost:5173',
  'preview--atendeai-lify-admin.lovable.app',
  'atendeai.lify.com.br'
];

testHostnames.forEach(hostname => {
  const redirectUri = getRedirectUri(hostname);
  console.log(`${hostname} -> ${redirectUri}`);
});

console.log('\n=== VALIDAÇÃO ===');
if (!config.google.clientId) {
  console.log('❌ VITE_GOOGLE_CLIENT_ID não está configurado');
} else {
  console.log('✅ VITE_GOOGLE_CLIENT_ID está configurado');
}

if (!config.google.clientSecret) {
  console.log('❌ VITE_GOOGLE_CLIENT_SECRET não está configurado');
} else {
  console.log('✅ VITE_GOOGLE_CLIENT_SECRET está configurado');
}

console.log('\n=== PRÓXIMOS PASSOS ===');
console.log('1. Verifique se as variáveis estão no arquivo .env');
console.log('2. Verifique se o arquivo .env está sendo carregado');
console.log('3. Verifique se as variáveis começam com VITE_');
console.log('4. Reinicie o servidor de desenvolvimento se necessário'); 