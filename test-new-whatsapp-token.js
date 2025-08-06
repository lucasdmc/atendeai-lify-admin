import axios from 'axios';

// Novo token do WhatsApp
const NEW_TOKEN = 'EAASAuWYr9JgBPPAwZC54E9ZCfrZCYHxbfZBgK4PqZAbTygxFquiqb6kqpnRf1hVddTcAX3p8acVXWiYhsujvChfpQ63JZCGNbBzg5H6WpZBXkGjIOaUSc5PuwGFLq0DGwwqpl0QDojthXNfNZBasULKZCfg2eHFah5KZCz0V46C9ckQ5Pcy14rZBZCcnsmq0u6p8bma6RdeWYUQGVazwtzxBmIgZCiSnOHundltZACmJRY4ZBCkgWqiAnteFGL9qV6kWAZDZD';
const PHONE_NUMBER_ID = '698766983327246';

async function testNewToken() {
  console.log('🧪 Testando novo token do WhatsApp...');
  console.log('📱 Phone Number ID:', PHONE_NUMBER_ID);
  console.log('🔑 Token (primeiros 20 chars):', NEW_TOKEN.substring(0, 20) + '...');
  
  try {
    // Teste 1: Verificar informações do número de telefone
    console.log('\n1️⃣ Testando informações do número de telefone...');
    const phoneInfoResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${NEW_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Informações do telefone:', phoneInfoResponse.data);
    
    // Teste 2: Verificar webhooks configurados
    console.log('\n2️⃣ Testando webhooks configurados...');
    const webhooksResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/webhooks`,
      {
        headers: {
          'Authorization': `Bearer ${NEW_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Webhooks configurados:', webhooksResponse.data);
    
    // Teste 3: Enviar mensagem de teste
    console.log('\n3️⃣ Testando envio de mensagem...');
    const messageResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: '5511999999999',
        type: 'text',
        text: {
          body: '🧪 Teste do novo token - Sistema funcionando!'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${NEW_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Mensagem enviada com sucesso:', messageResponse.data);
    
    console.log('\n🎉 Todos os testes passaram! O novo token está funcionando.');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔍 O token ainda pode estar expirado ou inválido.');
    }
  }
}

// Executar teste
testNewToken(); 