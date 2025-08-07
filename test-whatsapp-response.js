import axios from 'axios';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const NEW_TOKEN = 'EAASAuWYr9JgBPJ1i9ItaEW6lZAxzXxt7WusW4udjYRogZBwd6TYyyPsYPP3Yl6ZBbud5ujTOryLmg4b8WugZBvdO04ZB4XDrBl08mG0qEAWrFwSITXr3j4mv6qK5OoIDWG2VMnVQwA8YhKNR9wYhs5OYliZAgVWez0gXKEv6PDhM2LIeMB5sMhImTWz87erUSbK6RRro2xMaO6VUX9yGYYu7RvYgrQv1SQpHUNVI2hdeomXxW9ty7SJibADAZDZD';

async function testWhatsAppResponse() {
  console.log('🧪 TESTE: Verificando se o WhatsApp está respondendo após atualização do token');
  
  try {
    // Testar envio de mensagem
    console.log('📝 Enviando mensagem de teste...');
    
    const messageResponse = await axios.post(`https://graph.facebook.com/v18.0/698766983327246/messages`, {
      messaging_product: 'whatsapp',
      to: '554797192447',
      type: 'text',
      text: {
        body: '🧪 Teste: Token atualizado no Railway! Sistema funcionando corretamente.'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${NEW_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Mensagem enviada com sucesso!');
    console.log('ID da mensagem:', messageResponse.data.messages?.[0]?.id);
    console.log('Status:', messageResponse.status);
    
    // Verificar logs do Railway
    console.log('\n📊 Verificando logs do Railway...');
    console.log('Aguarde alguns segundos e envie uma mensagem no WhatsApp para testar o webhook.');
    
  } catch (error) {
    console.error('❌ Erro ao testar WhatsApp:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔍 Token ainda não foi atualizado no Railway ou há outro problema.');
    }
  }
}

// Executar teste
testWhatsAppResponse().then(() => {
  console.log('\n✅ Teste concluído!');
  console.log('📱 Agora envie uma mensagem no WhatsApp para testar o webhook.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
}); 