import https from 'https';

const SERVER_URL = 'https://lify-chatbot-production.up.railway.app';

async function testWhatsAppConnection() {
  console.log('🔍 Testando conexão com servidor WhatsApp...\n');

  try {
    // Teste 1: Verificar status
    console.log('1️⃣ Testando endpoint /api/whatsapp/status...');
    const statusResponse = await makeRequest(`${SERVER_URL}/api/whatsapp/status`);
    console.log('✅ Status Response:', JSON.stringify(statusResponse, null, 2));

    // Teste 2: Tentar gerar QR Code
    console.log('\n2️⃣ Tentando gerar QR Code...');
    const qrResponse = await makeRequest(`${SERVER_URL}/api/whatsapp/connect`, 'POST');
    console.log('✅ QR Code Response:', JSON.stringify(qrResponse, null, 2));

    // Teste 3: Verificar se há QR Code disponível
    if (qrResponse.success && qrResponse.qrCode) {
      console.log('\n🎉 QR Code gerado com sucesso!');
      console.log('📱 QR Code disponível para escaneamento');
    } else {
      console.log('\n⚠️ QR Code não foi gerado. Possíveis motivos:');
      console.log('   - WhatsApp já está conectado');
      console.log('   - Servidor em processo de geração');
      console.log('   - Erro no servidor');
    }

  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error.message);
  }
}

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WhatsApp-Test-Script/1.0'
      },
      timeout: 10000
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          resolve({ raw: data, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (method === 'POST') {
      req.write(JSON.stringify({ action: 'connect' }));
    }

    req.end();
  });
}

// Executar teste
testWhatsAppConnection(); 