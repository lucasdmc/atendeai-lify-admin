import axios from 'axios';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const NEW_TOKEN = 'EAASAuWYr9JgBPJ1i9ItaEW6lZAxzXxt7WusW4udjYRogZBwd6TYyyPsYPP3Yl6ZBbud5ujTOryLmg4b8WugZBvdO04ZB4XDrBl08mG0qEAWrFwSITXr3j4mv6qK5OoIDWG2VMnVQwA8YhKNR9wYhs5OYliZAgVWez0gXKEv6PDhM2LIeMB5sMhImTWz87erUSbK6RRro2xMaO6VUX9yGYYu7RvYgrQv1SQpHUNVI2hdeomXxW9ty7SJibADAZDZD';

async function testNewToken() {
  console.log('🧪 TESTE: Verificando se o novo token atualizado está funcionando');
  
  try {
    // Testar o token diretamente com a API do Meta
    const response = await axios.get('https://graph.facebook.com/v18.0/698766983327246', {
      params: {
        access_token: NEW_TOKEN,
        fields: 'id,code_verification_status,quality_rating'
      }
    });
    
    console.log('✅ Token funcionando! Resposta da API:');
    console.log('ID:', response.data.id);
    console.log('Status de verificação:', response.data.code_verification_status);
    console.log('Qualidade:', response.data.quality_rating);
    
    // Testar envio de mensagem
    console.log('\n📝 Testando envio de mensagem...');
    
    const messageResponse = await axios.post(`https://graph.facebook.com/v18.0/698766983327246/messages`, {
      messaging_product: 'whatsapp',
      to: '554797192447',
      type: 'text',
      text: {
        body: '🧪 Teste: Novo token atualizado funcionando! Sistema de duplicações implementado com sucesso.'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${NEW_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Mensagem enviada com sucesso!');
    console.log('ID da mensagem:', messageResponse.data.messages?.[0]?.id);
    
  } catch (error) {
    console.error('❌ Erro ao testar token:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔍 Detalhes do erro 401:');
      console.log('Headers:', error.response.headers);
      console.log('Data:', error.response.data);
    }
  }
}

// Executar teste
testNewToken().then(() => {
  console.log('\n✅ Teste concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
}); 