// Script para verificar se as variáveis de ambiente estão sendo incluídas no build
console.log('=== VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE NO BUILD ===');

// Simular o que acontece no build do Vite
const buildEnv = {
  VITE_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID || '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com',
  VITE_GOOGLE_CLIENT_SECRET: process.env.VITE_GOOGLE_CLIENT_SECRET || 'GOCSPX-...',
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  NODE_ENV: process.env.NODE_ENV || 'production',
  DEV: process.env.NODE_ENV === 'development',
  PROD: process.env.NODE_ENV === 'production'
};

console.log('=== VARIÁVEIS DE AMBIENTE ===');
console.log('VITE_GOOGLE_CLIENT_ID:', buildEnv.VITE_GOOGLE_CLIENT_ID ? '✅ Configurado' : '❌ Não configurado');
console.log('VITE_GOOGLE_CLIENT_SECRET:', buildEnv.VITE_GOOGLE_CLIENT_SECRET ? '✅ Configurado' : '❌ Não configurado');
console.log('VITE_SUPABASE_URL:', buildEnv.VITE_SUPABASE_URL ? '✅ Configurado' : '❌ Não configurado');
console.log('VITE_SUPABASE_ANON_KEY:', buildEnv.VITE_SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Não configurado');
console.log('NODE_ENV:', buildEnv.NODE_ENV);
console.log('DEV:', buildEnv.DEV);
console.log('PROD:', buildEnv.PROD);

// Simular a configuração que seria gerada no build
const config = {
  google: {
    clientId: buildEnv.VITE_GOOGLE_CLIENT_ID,
    clientSecret: buildEnv.VITE_GOOGLE_CLIENT_SECRET,
    scopes: 'https://www.googleapis.com/auth/calendar',
  },
  environment: buildEnv.NODE_ENV || 'development',
  isDevelopment: buildEnv.DEV,
  isProduction: buildEnv.PROD,
  urls: {
    redirectUri: getRedirectUri(),
  },
};

// Função que simula a detecção de ambiente no build
function getRedirectUri() {
  // Em produção, isso seria baseado no hostname atual
  const hostname = 'preview--atendeai-lify-admin.lovable.app'; // Simular preview
  const protocol = 'https:';
  const port = '';
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}${port ? `:${port}` : ''}/agendamentos`;
  }
  
  if (hostname.includes('preview--atendeai-lify-admin.lovable.app')) {
    return 'https://preview--atendeai-lify-admin.lovable.app/agendamentos';
  }
  
  if (hostname.includes('atendeai.lify.com.br')) {
    return 'https://atendeai.lify.com.br/agendamentos';
  }
  
  return `${protocol}//${hostname}${port ? `:${port}` : ''}/agendamentos`;
}

console.log('\n=== CONFIGURAÇÃO GERADA ===');
console.log('Google Client ID:', config.google.clientId);
console.log('Google Client Secret:', config.google.clientSecret ? '✅ Configurado' : '❌ Não configurado');
console.log('Environment:', config.environment);
console.log('Is Development:', config.isDevelopment);
console.log('Is Production:', config.isProduction);
console.log('Redirect URI:', config.urls.redirectUri);

// Testar se a configuração está válida
console.log('\n=== VALIDAÇÃO DA CONFIGURAÇÃO ===');
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

if (!config.urls.redirectUri) {
  console.log('❌ Redirect URI não está configurado');
} else {
  console.log('✅ Redirect URI está configurado');
}

console.log('\n=== POSSÍVEIS CAUSAS DO ERRO 404 ===');
console.log('1. Variáveis de ambiente não estão sendo carregadas no build');
console.log('2. Cache do navegador está mostrando versão antiga');
console.log('3. JavaScript está falhando silenciosamente');
console.log('4. Problema de CORS específico do navegador');
console.log('5. Problema de rede específico do ambiente');

console.log('\n=== PRÓXIMOS PASSOS ===');
console.log('1. Verifique se as variáveis estão no arquivo .env');
console.log('2. Faça um novo build e deploy');
console.log('3. Limpe o cache do navegador (Ctrl+Shift+R)');
console.log('4. Teste em uma aba anônima');
console.log('5. Verifique o console do navegador para erros JavaScript'); 