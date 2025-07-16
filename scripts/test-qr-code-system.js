import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:3001';

async function testQRCodeSystem() {
  console.log('🧪 Testando sistema de QR Code...\n');

  try {
    // 1. Testar health check
    console.log('1️⃣ Testando health check...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    console.log('📊 Sessões ativas:', healthData.activeSessions);

    // 2. Gerar QR Code
    console.log('\n2️⃣ Gerando QR Code...');
    const qrResponse = await fetch(`${BACKEND_URL}/api/whatsapp/generate-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'test-agent-refactored' })
    });

    if (!qrResponse.ok) {
      throw new Error(`Erro ao gerar QR Code: ${qrResponse.status}`);
    }

    const qrData = await qrResponse.json();
    console.log('✅ QR Code gerado:', qrData.success ? 'Sim' : 'Não');

    // 3. Verificar status
    console.log('\n3️⃣ Verificando status...');
    const statusResponse = await fetch(`${BACKEND_URL}/api/whatsapp/status/test-agent-refactored`);
    const statusData = await statusResponse.json();
    console.log('📱 Status da sessão:', statusData.status);
    console.log('🔗 Conectado:', statusData.connected);

    // 4. Aguardar um pouco e verificar novamente
    console.log('\n4️⃣ Aguardando 10 segundos...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    const statusResponse2 = await fetch(`${BACKEND_URL}/api/whatsapp/status/test-agent-refactored`);
    const statusData2 = await statusResponse2.json();
    console.log('📱 Status após 10s:', statusData2.status);

    // 5. Resetar sessão
    console.log('\n5️⃣ Resetando sessão...');
    const resetResponse = await fetch(`${BACKEND_URL}/api/whatsapp/reset-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'test-agent-refactored' })
    });

    if (!resetResponse.ok) {
      throw new Error(`Erro ao resetar sessão: ${resetResponse.status}`);
    }

    const resetData = await resetResponse.json();
    console.log('✅ Sessão resetada:', resetData.success);

    // 6. Verificar status final
    console.log('\n6️⃣ Verificando status final...');
    const finalStatusResponse = await fetch(`${BACKEND_URL}/api/whatsapp/status/test-agent-refactored`);
    const finalStatusData = await finalStatusResponse.json();
    console.log('📱 Status final:', finalStatusData.status);

    // 7. Health check final
    console.log('\n7️⃣ Health check final...');
    const finalHealthResponse = await fetch(`${BACKEND_URL}/health`);
    const finalHealthData = await finalHealthResponse.json();
    console.log('📊 Sessões ativas finais:', finalHealthData.activeSessions);

    console.log('\n🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testQRCodeSystem(); 