import axios from 'axios';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const NEW_TOKEN = 'EAASAuWYr9JgBPIcF02GyxXvhOk92zytddz0BlM6CZCwh2Hy5g4UTamaXOY0AuVwxckNPDIuh5HD0YKyuwiTvKYiXe21PSH9tL1FSvIbDndJ3JXrJ6OBaFRnmM49zZAflxtEffgCppb43VHnJvZAH9F8y4XQT09NgsAZAZB1hUXdFa8ME8zS4FDn3BTGNRQcFPEGnZB2ZAkLDeW5PZCthaJKwPnG301Jxs1plvUCZBKJWQ3n02A7asTommNXSaDQZDZD';

async function testNewToken() {
  console.log('🧪 TESTE: Verificando se o novo token está funcionando');
  
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
        body: '🧪 Teste: Novo token funcionando! Sistema de duplicações implementado com sucesso.'
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