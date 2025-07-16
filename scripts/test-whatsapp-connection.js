#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const WHATSAPP_SERVER_URL = 'http://31.97.241.19:3001';

async function testWhatsAppConnection() {
  console.log('🔍 Testando conectividade com servidor WhatsApp...\n');

  // Teste 1: Verificar se o servidor está respondendo
  console.log('1️⃣ Testando resposta do servidor...');
  try {
    const response = await fetch(`${WHATSAPP_SERVER_URL}/health`);
    if (response.ok) {
      console.log('✅ Servidor WhatsApp está respondendo');
      const data = await response.text();
      console.log('📊 Resposta:', data);
    } else {
      console.log('❌ Servidor não está respondendo corretamente');
      console.log('📊 Status:', response.status);
    }
  } catch (error) {
    console.log('❌ Erro ao conectar com servidor:', error.message);
  }

  // Teste 2: Testar endpoint de geração de QR Code
  console.log('\n2️⃣ Testando endpoint de geração de QR Code...');
  try {
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/whatsapp/generate-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agentId: 'test-agent-id' }),
    });

    console.log('📊 Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Endpoint funcionando');
      console.log('📊 Dados retornados:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Erro no endpoint:', errorText);
    }
  } catch (error) {
    console.log('❌ Erro ao testar endpoint:', error.message);
  }

  // Teste 3: Verificar logs do servidor
  console.log('\n3️⃣ Verificando logs do servidor...');
  try {
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/whatsapp/status`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Status do WhatsApp:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Não foi possível obter status');
    }
  } catch (error) {
    console.log('❌ Erro ao obter status:', error.message);
  }

  // Teste 4: Verificar conectividade de rede
  console.log('\n4️⃣ Testando conectividade de rede...');
  
  try {
    const { stdout } = await execAsync(`ping -c 3 31.97.241.19`);
    console.log('✅ Ping bem-sucedido');
    console.log('📊 Resultado:', stdout);
  } catch (error) {
    console.log('❌ Erro ao fazer ping:', error.message);
  }

  // Teste 5: Verificar porta 3001
  console.log('\n5️⃣ Testando porta 3001...');
  try {
    const { stdout } = await execAsync(`nc -zv 31.97.241.19 3001`);
    console.log('✅ Porta 3001 está acessível');
    console.log('📊 Resultado:', stdout);
  } catch (error) {
    console.log('❌ Porta 3001 não está acessível:', error.message);
  }
}

// Função para testar via curl
async function testWithCurl() {
  console.log('\n🔧 Testando com curl...\n');
  
  // Teste de health check
  try {
    const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" ${WHATSAPP_SERVER_URL}/health`);
    console.log('📊 Health check status:', stdout);
  } catch (error) {
    console.log('❌ Erro no curl health check:', error.message);
  }

  // Teste de geração de QR Code
  try {
    const { stdout } = await execAsync(`curl -X POST ${WHATSAPP_SERVER_URL}/api/whatsapp/generate-qr -H "Content-Type: application/json" -d '{"agentId":"test"}' -s`);
    console.log('📊 QR Code response:', stdout);
  } catch (error) {
    console.log('❌ Erro no curl QR Code:', error.message);
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes de conectividade WhatsApp\n');
  console.log('📍 Servidor:', WHATSAPP_SERVER_URL);
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('='.repeat(60));

  await testWhatsAppConnection();
  await testWithCurl();

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Testes concluídos');
}

runTests().catch(console.error); 