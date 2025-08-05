#!/usr/bin/env node

import fetch from 'node-fetch';

console.log('🧪 Testando Backend QR Code');
console.log('============================');

const BACKEND_URL = 'https://atendeai-backend-production.up.railway.app';
const TEST_AGENT_ID = '8aae1bc7-07b7-40ba-9ff3-e13fc32caa0b';

async function testBackendQR() {
  try {
    console.log('\n1. Testando health check...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    
    console.log('\n2. Testando geração de QR Code...');
    const qrResponse = await fetch(`${BACKEND_URL}/api/whatsapp/generate-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId: TEST_AGENT_ID,
        whatsappNumber: 'temp',
        connectionId: `test-${Date.now()}`
      })
    });
    
    const qrData = await qrResponse.json();
    console.log('✅ QR Response:', qrData);
    
    if (qrData.success && qrData.qrCode) {
      console.log('✅ QR Code gerado com sucesso!');
      console.log('   QR Code length:', qrData.qrCode.length);
      console.log('   QR Code preview:', qrData.qrCode.substring(0, 50) + '...');
    } else if (qrData.success) {
      console.log('⚠️ Backend retornou sucesso mas sem QR Code');
      console.log('   Message:', qrData.message);
      console.log('   Possível problema: Timeout ou erro na geração');
    } else {
      console.log('❌ Erro no backend:', qrData.error);
    }
    
  } catch (error) {
    console.log('❌ Erro ao testar backend:', error.message);
  }
}

testBackendQR(); 