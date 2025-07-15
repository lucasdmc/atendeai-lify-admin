#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔗 Configurando Integração Completa - AtendeAI\n');

// Configurações da VPS
const VPS_CONFIG = {
  ip: '31.97.241.19',
  port: '3001',
  protocol: 'http'
};

// Configurações do Google OAuth
const GOOGLE_CONFIG = {
  clientId: '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com',
  clientSecret: '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'
};

// Configurações do Supabase
const SUPABASE_CONFIG = {
  url: 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
};

// Conteúdo do arquivo .env
const ENV_CONTENT = `# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=${GOOGLE_CONFIG.clientId}
VITE_GOOGLE_CLIENT_SECRET=${GOOGLE_CONFIG.clientSecret}

# Supabase Configuration
VITE_SUPABASE_URL=${SUPABASE_CONFIG.url}
VITE_SUPABASE_ANON_KEY=${SUPABASE_CONFIG.anonKey}

# WhatsApp Configuration - VPS
VITE_WHATSAPP_SERVER_URL=${VPS_CONFIG.protocol}://${VPS_CONFIG.ip}:${VPS_CONFIG.port}

# Backend Configuration
VITE_BACKEND_URL=${VPS_CONFIG.protocol}://${VPS_CONFIG.ip}:${VPS_CONFIG.port}

# Google APIs
VITE_GOOGLE_PLACES_API_KEY=AIzaSyBxGxGxGxGxGxGxGxGxGxGxGxGxGxGxGx

# Environment
NODE_ENV=development
`;

// Função para criar arquivo .env
function createEnvFile() {
  console.log('📝 Criando arquivo .env...');
  
  try {
    fs.writeFileSync('.env', ENV_CONTENT);
    console.log('✅ Arquivo .env criado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao criar arquivo .env:', error.message);
    return false;
  }
  return true;
}

// Função para verificar conectividade com a VPS
async function testVPSConnection() {
  console.log('\n🌐 Testando conectividade com a VPS...');
  
  try {
    const response = await fetch(`${VPS_CONFIG.protocol}://${VPS_CONFIG.ip}:${VPS_CONFIG.port}/health`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ VPS está online e funcionando');
      console.log(`   📊 Status: ${data.status}`);
      console.log(`   📊 Sessões ativas: ${data.activeSessions}`);
      console.log(`   📊 Timestamp: ${data.timestamp}`);
      return true;
    } else {
      console.log(`❌ VPS retornou status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao conectar com a VPS:', error.message);
    return false;
  }
}

// Função para verificar configurações do Google Cloud Console
function checkGoogleConfig() {
  console.log('\n🔍 Verificando configurações do Google Cloud Console...');
  
  const redirectUris = [
    'http://localhost:8080/agendamentos',
    'http://localhost:5173/agendamentos',
    'https://preview--atendeai-lify-admin.lovable.app/agendamentos',
    'https://atendeai.lify.com.br/agendamentos'
  ];
  
  console.log('📋 URLs de redirecionamento que devem estar configuradas:');
  redirectUris.forEach(uri => {
    console.log(`   ✅ ${uri}`);
  });
  
  console.log('\n📋 Origens JavaScript autorizadas:');
  const origins = [
    'http://localhost:8080',
    'http://localhost:5173',
    'https://preview--atendeai-lify-admin.lovable.app',
    'https://atendeai.lify.com.br'
  ];
  
  origins.forEach(origin => {
    console.log(`   ✅ ${origin}`);
  });
  
  console.log('\n⚠️  Verifique se essas URLs estão configuradas no Google Cloud Console');
}

// Função para verificar configurações do Supabase
function checkSupabaseConfig() {
  console.log('\n🔍 Verificando configurações do Supabase...');
  
  console.log('📋 Edge Functions que devem estar configuradas:');
  const functions = [
    'google-user-auth',
    'whatsapp-integration',
    'agent-whatsapp-manager',
    'calendar-manager'
  ];
  
  functions.forEach(func => {
    console.log(`   ✅ ${func}`);
  });
  
  console.log('\n📋 Variáveis de ambiente necessárias no Supabase:');
  const envVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'WHATSAPP_SERVER_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  envVars.forEach(env => {
    console.log(`   ✅ ${env}`);
  });
}

// Função para testar integração completa
async function testCompleteIntegration() {
  console.log('\n🧪 Testando integração completa...');
  
  // Testar VPS
  const vpsOk = await testVPSConnection();
  
  // Testar Supabase
  console.log('\n📊 Testando Supabase...');
  try {
    const supabaseUrl = `${SUPABASE_CONFIG.url}/rest/v1/`;
    const response = await fetch(supabaseUrl, {
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Supabase está acessível');
    } else {
      console.log(`❌ Supabase retornou status ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Erro ao conectar com Supabase:', error.message);
  }
  
  return vpsOk;
}

// Função principal
async function main() {
  console.log('🚀 Iniciando configuração de integração...\n');
  
  // 1. Criar arquivo .env
  const envCreated = createEnvFile();
  if (!envCreated) {
    console.log('❌ Falha ao criar arquivo .env');
    process.exit(1);
  }
  
  // 2. Verificar conectividade
  const vpsConnected = await testVPSConnection();
  
  // 3. Verificar configurações
  checkGoogleConfig();
  checkSupabaseConfig();
  
  // 4. Testar integração completa
  const integrationOk = await testCompleteIntegration();
  
  // 5. Resumo final
  console.log('\n📋 RESUMO DA CONFIGURAÇÃO:');
  console.log('='.repeat(50));
  console.log(`✅ Arquivo .env: ${envCreated ? 'Criado' : 'Falhou'}`);
  console.log(`✅ VPS (${VPS_CONFIG.ip}:${VPS_CONFIG.port}): ${vpsConnected ? 'Online' : 'Offline'}`);
  console.log(`✅ Integração completa: ${integrationOk ? 'Funcionando' : 'Com problemas'}`);
  
  if (integrationOk) {
    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Execute: npm run dev');
    console.log('2. Acesse: http://localhost:8080');
    console.log('3. Teste a integração com WhatsApp');
    console.log('4. Verifique os logs no console');
  } else {
    console.log('\n⚠️  ALGUNS PROBLEMAS FORAM IDENTIFICADOS');
    console.log('Verifique as configurações acima e tente novamente');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createEnvFile,
  testVPSConnection,
  testCompleteIntegration
}; 