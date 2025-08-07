import axios from 'axios';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function checkCurrentToken() {
  console.log('🔍 VERIFICANDO TOKEN ATUAL NO SERVIÇO');
  
  try {
    // Verificar qual token está sendo usado pelo serviço
    const response = await axios.get('https://atendeai-lify-backend-production.up.railway.app/api/whatsapp/send-message', {
      params: {
        to: '554797192447',
        message: 'Teste de verificação de token'
      }
    });
    
    console.log('✅ Resposta do serviço:', response.data);
    
  } catch (error) {
    console.error('❌ Erro ao verificar token:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔍 Detalhes do erro 401:');
      console.log('Headers:', error.response.headers);
      console.log('Data:', error.response.data);
    }
  }
}

// Executar verificação
checkCurrentToken().then(() => {
  console.log('\n✅ Verificação concluída!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
}); 