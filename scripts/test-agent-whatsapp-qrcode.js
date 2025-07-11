import fetch from 'node-fetch';

// Configurações
const SUPABASE_FUNCTION_URL = 'https://niakqdolcdwxtrkbqmdi.functions.supabase.co/agent-whatsapp-manager/initialize';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';
const AGENT_ID = '8b613265-3e8b-4d9f-80ed-60948aaa21ff';
const WHATSAPP_NUMBER = '5511999999999';

async function testQRCodeGeneration() {
  console.log('🧪 Testando geração automática de QR Code para agente...');

  try {
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        agentId: AGENT_ID,
        whatsappNumber: WHATSAPP_NUMBER,
      }),
    });

    const data = await response.json();
    console.log('\nResposta da função Edge:');
    console.dir(data, { depth: 5 });

    if (data.success && data.qrCode) {
      console.log('\n✅ QR Code gerado com sucesso!');
      // Opcional: salvar o QR Code em arquivo
      if (data.qrCode.startsWith('data:image')) {
        const base64 = data.qrCode.split(',')[1];
        import('fs').then(fs => {
          fs.writeFileSync('qrcode.png', Buffer.from(base64, 'base64'));
          console.log('QR Code salvo como qrcode.png');
        });
      }
    } else if (data.success && !data.qrCode) {
      console.log('\n⚠️ QR Code ainda não gerado. Tente novamente em alguns segundos.');
    } else {
      console.log('\n❌ Erro ao gerar QR Code:', data.error || data.message);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

testQRCodeGeneration(); 