// ========================================
// INVESTIGAR MUDANÇAS RECENTES
// ========================================

import https from 'https';
import http from 'http';

// Configurações da VPS
const VPS_IP = 'atendeai-backend-production.up.railway.app';
const VPS_URL = 'https://atendeai-backend-production.up.railway.app';

async function investigateChanges() {
  console.log('🔍 INVESTIGANDO MUDANÇAS RECENTES');
  console.log('===================================\n');

  try {
    // 1. Verificar se há outros serviços rodando
    console.log('📡 1. Verificando outros serviços...');
    
    const ports = [80, 443, 3000, 3001, 8080, 8000];
    
    for (const port of ports) {
      const response = await makeBasicRequest(`http://${VPS_IP}:${port}`);
      if (response.statusCode > 0) {
        console.log(`   ✅ Porta ${port}: ${response.statusCode}`);
        if (response.body) {
          console.log(`      Servidor: ${response.headers['server'] || 'N/A'}`);
          console.log(`      Powered-by: ${response.headers['x-powered-by'] || 'N/A'}`);
        }
      } else {
        console.log(`   ❌ Porta ${port}: Não responde`);
      }
    }
    console.log('');

    // 2. Verificar configuração atual do domínio
    console.log('🌐 2. Verificando configuração do domínio...');
    
    const domainResponse = await makeBasicRequest(VPS_URL);
    console.log(`   Status: ${domainResponse.statusCode}`);
    console.log(`   Servidor: ${domainResponse.headers['server'] || 'N/A'}`);
    console.log(`   Powered-by: ${domainResponse.headers['x-powered-by'] || 'N/A'}`);
    console.log(`   Content-Type: ${domainResponse.headers['content-type'] || 'N/A'}`);
    console.log('');

    // 3. Verificar se há redirecionamentos
    console.log('🔄 3. Verificando redirecionamentos...');
    
    const redirectResponse = await makeRequestWithRedirects(VPS_URL);
    console.log(`   URL final: ${redirectResponse.url}`);
    console.log(`   Status: ${redirectResponse.statusCode}`);
    console.log('');

    // 4. Análise das mudanças
    console.log('📊 ANÁLISE DAS MUDANÇAS');
    console.log('========================');
    
    if (domainResponse.headers['x-powered-by']?.includes('PHP')) {
      console.log('❌ PROBLEMA IDENTIFICADO:');
      console.log('   - WordPress está servindo o domínio principal');
      console.log('   - Node.js está rodando apenas na porta 3001');
      console.log('   - Nginx não está fazendo proxy reverso');
      console.log('');
      console.log('💡 CAUSA PROVÁVEL:');
      console.log('   1. VPS foi reiniciada');
      console.log('   2. Nginx perdeu configuração de proxy');
      console.log('   3. WordPress voltou a servir na porta 80');
      console.log('');
      console.log('🔧 SOLUÇÃO NECESSÁRIA:');
      console.log('   1. Configurar proxy reverso no Nginx');
      console.log('   2. Manter WordPress para páginas principais');
      console.log('   3. Redirecionar /webhook/ e /api/ para Node.js');
    }
    console.log('');

    // 5. Comandos para verificar na VPS
    console.log('🔧 COMANDOS PARA VERIFICAR NA VPS');
    console.log('==================================');
    console.log('1. Verificar processos:');
    console.log('   ps aux | grep node');
    console.log('   pm2 status');
    console.log('   netstat -tlnp | grep :3001');
    console.log('');
    console.log('2. Verificar Nginx:');
    console.log('   nginx -t');
    console.log('   cat /etc/nginx/sites-available/atendeai.com.br');
    console.log('   systemctl status nginx');
    console.log('');
    console.log('3. Verificar logs:');
    console.log('   tail -f /var/log/nginx/access.log');
    console.log('   tail -f /var/log/nginx/error.log');
    console.log('   pm2 logs atendeai-backend');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

/**
 * Faz uma requisição básica para verificar conectividade
 */
function makeBasicRequest(url) {
  return new Promise((resolve) => {
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
      resolve({
        statusCode: 0,
        headers: {},
        body: '',
        error: error.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        statusCode: 0,
        headers: {},
        body: '',
        error: 'Timeout'
      });
    });
  });
}

/**
 * Faz uma requisição com verificação de redirecionamentos
 */
function makeRequestWithRedirects(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      resolve({
        url: url,
        statusCode: res.statusCode,
        headers: res.headers
      });
    });

    req.on('error', (error) => {
      resolve({
        url: url,
        statusCode: 0,
        error: error.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url: url,
        statusCode: 0,
        error: 'Timeout'
      });
    });
  });
}

// Executar investigação
investigateChanges(); 