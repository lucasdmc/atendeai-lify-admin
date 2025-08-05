// ========================================
// VERIFICAR STATUS ATUAL DO RAILWAY
// ========================================

import https from 'https';
import http from 'http';

// URLs do Railway para testar
const RAILWAY_URLS = [
  'https://atendeai-backend-production.up.railway.app',
  'https://atendeai-lify-backend-production.up.railway.app',
  'https://atendeai-lify-admin-production.up.railway.app'
];

async function checkRailwayStatus() {
  console.log('🔍 VERIFICANDO STATUS ATUAL DO RAILWAY');
  console.log('=======================================\n');

  for (const url of RAILWAY_URLS) {
    console.log(`📡 Testando: ${url}`);
    
    try {
      const response = await makeRequest(url);
      
      if (response.statusCode === 200) {
        console.log(`   ✅ ONLINE - Status: ${response.statusCode}`);
        console.log(`   📝 Resposta: ${response.body.substring(0, 200)}...`);
        
        // Testar endpoints específicos
        await testEndpoints(url);
        
      } else if (response.statusCode === 404) {
        console.log(`   ❌ OFFLINE - Application not found (404)`);
        console.log(`   💡 A aplicação foi removida ou não existe mais`);
        
      } else {
        console.log(`   ⚠️ Status: ${response.statusCode}`);
        console.log(`   📝 Resposta: ${response.body.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERRO: ${error.message}`);
    }
    
    console.log('');
  }

  // Análise do problema
  console.log('📊 ANÁLISE DO PROBLEMA');
  console.log('========================');
  console.log('❌ Railway está OFFLINE');
  console.log('💡 Possíveis causas:');
  console.log('   1. Aplicação foi removida do Railway');
  console.log('   2. Projeto foi deletado');
  console.log('   3. Deploy falhou');
  console.log('   4. Variáveis de ambiente incorretas');
  console.log('');
  
  console.log('🔧 SOLUÇÃO IMEDIATA');
  console.log('====================');
  console.log('1. Acessar Railway Dashboard:');
  console.log('   https://railway.app');
  console.log('');
  console.log('2. Verificar se o projeto existe');
  console.log('3. Se não existir, criar novo projeto');
  console.log('4. Conectar este repositório GitHub');
  console.log('5. Configurar variáveis de ambiente');
  console.log('6. Fazer deploy automático');
  console.log('');
  
  console.log('📋 VARIÁVEIS NECESSÁRIAS');
  console.log('=========================');
  console.log('NODE_ENV=production');
  console.log('PORT=3001');
  console.log('LOG_LEVEL=info');
  console.log('SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co');
  console.log('SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw');
  console.log('OPENAI_API_KEY=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');
  console.log('WHATSAPP_META_ACCESS_TOKEN=EAASAuWYr9JgBPMxLKIoZCYAfUOWrj721aw1HMLK5ZBUBJOAPpB2k3as1Nj2bmJskjiBZCh8szn7ajR7Ic2OsnJSZCJIuz9eD2wk1wL7cWnZBv3jBaZA56ZCH48ngQ6VRZBjXZAlnancYdrdag1UougDbyZCemhIhE9MchQ0pS1hXCwhZCKytYpPPocgqf1sFlFt2iGZAnxFB5alHzVTZCw2172NnZBB2qtjgXkikTTRopth8mxB7mvdI4yqk3dficzsAZDZD');
  console.log('WHATSAPP_META_PHONE_NUMBER_ID=698766983327246');
  console.log('DEFAULT_CLINIC_ID=cardioprime_blumenau_2024');
  console.log('');
  
  console.log('⏰ TEMPO ESTIMADO PARA CORREÇÃO');
  console.log('================================');
  console.log('• Criar projeto Railway: 2 minutos');
  console.log('• Configurar variáveis: 3 minutos');
  console.log('• Deploy automático: 5 minutos');
  console.log('• Testar endpoints: 2 minutos');
  console.log('• Total: ~12 minutos');
  console.log('');
  
  console.log('🚨 STATUS: URGENTE - SEM RESPOSTA WHATSAPP');
  console.log('💡 AÇÃO: Recriar projeto Railway imediatamente');
}

async function testEndpoints(baseUrl) {
  const endpoints = [
    '/health',
    '/',
    '/webhook/whatsapp-meta'
  ];
  
  console.log('   🔧 Testando endpoints específicos:');
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${baseUrl}${endpoint}`);
      console.log(`      ${endpoint}: ${response.statusCode}`);
    } catch (error) {
      console.log(`      ${endpoint}: ❌ ${error.message}`);
    }
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Executar verificação
checkRailwayStatus(); 