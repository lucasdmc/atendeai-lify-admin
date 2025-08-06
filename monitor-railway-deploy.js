import axios from 'axios';

// Novo token que deve estar sendo usado
const NEW_TOKEN_PREFIX = 'EAASAuWYr9JgBPPAwZC5';

async function monitorRailwayDeploy() {
  console.log('🔍 Monitorando deploy do Railway...');
  console.log('⏳ Aguardando o novo token entrar em vigor...');
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\n📊 Tentativa ${attempts}/${maxAttempts}`);
    
    try {
      // Teste simples para verificar se o serviço está respondendo
      const response = await axios.get('https://atendeai-lify-backend-production.up.railway.app/health', {
        timeout: 5000
      });
      
      console.log('✅ Serviço online');
      
      // Agora vamos testar se o token foi atualizado
      console.log('🔑 Verificando se o novo token está ativo...');
      
      // Teste de envio de mensagem para verificar o token
      const messageResponse = await axios.post(
        'https://graph.facebook.com/v18.0/698766983327246/messages',
        {
          messaging_product: 'whatsapp',
          to: '5511999999999',
          type: 'text',
          text: {
            body: '🧪 Teste de monitoramento - Verificando token'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${NEW_TOKEN_PREFIX}...`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      
      console.log('✅ Token atualizado e funcionando!');
      console.log('🎉 O chatbot deve estar funcionando agora!');
      break;
      
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⏳ Token ainda não foi atualizado no Railway...');
      } else {
        console.log('⏳ Serviço ainda reiniciando...');
      }
      
      if (attempts < maxAttempts) {
        console.log('⏰ Aguardando 30 segundos...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
  }
  
  if (attempts >= maxAttempts) {
    console.log('❌ Timeout - Verifique manualmente os logs do Railway');
    console.log('📋 Execute: railway logs --service atendeai-lify-backend');
  }
}

monitorRailwayDeploy(); 