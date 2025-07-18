import axios from 'axios';

async function testBaileysConnection() {
  try {
    console.log('🧪 Testando conexão Baileys...');
    
    // Testar health check
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Health check:', healthResponse.data);
    
    // Testar geração de QR Code
    const qrResponse = await axios.post('http://localhost:3001/api/whatsapp/generate-qr', {
      agentId: 'test-agent',
      whatsappNumber: 'test-number',
      connectionId: 'test-connection'
    });
    console.log('✅ QR Code test:', qrResponse.data);
    
    console.log('🎉 Teste Baileys concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testBaileysConnection();
