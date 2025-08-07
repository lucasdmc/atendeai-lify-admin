import axios from 'axios';

async function checkRailwayToken() {
  console.log('🔍 Verificando qual token está sendo usado no Railway...');
  
  try {
    // Fazer uma requisição para o webhook do Railway para ver os logs
    const response = await axios.get('https://atendeai-lify-backend-production.up.railway.app/whatsapp-meta', {
      params: {
        'hub.mode': 'subscribe',
        'hub.challenge': 'test-challenge',
        'hub.verify_token': 'atendeai-lify-backend'
      }
    });
    
    console.log('✅ Webhook respondendo:', response.status);
    console.log('📝 Resposta:', response.data);
    
  } catch (error) {
    console.error('❌ Erro ao verificar webhook:', error.response?.status, error.response?.data);
  }
}

checkRailwayToken().then(() => {
  console.log('\n✅ Verificação concluída!');
  console.log('📱 Agora envie uma mensagem no WhatsApp para ver os logs do token.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
}); 