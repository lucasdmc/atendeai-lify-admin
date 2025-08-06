import axios from 'axios';

// URLs para verificar
const RAILWAY_BASE_URL = 'https://atendeai-lify-backend-production.up.railway.app';
const WEBHOOK_URL = `${RAILWAY_BASE_URL}/webhook/whatsapp-meta`;
const HEALTH_URL = `${RAILWAY_BASE_URL}/health`;

async function checkRailwayStatus() {
  console.log('🔍 Verificando status do Railway após atualização do token...');
  
  try {
    // Teste 1: Verificar se o serviço está online
    console.log('\n1️⃣ Testando se o serviço está online...');
    const healthResponse = await axios.get(HEALTH_URL, {
      timeout: 5000
    });
    
    console.log('✅ Serviço online!');
    console.log('📋 Status:', healthResponse.status);
    
  } catch (error) {
    console.log('❌ Serviço offline ou em reinicialização:', error.message);
  }
  
  try {
    // Teste 2: Verificar se o webhook está acessível
    console.log('\n2️⃣ Testando acessibilidade do webhook...');
    const webhookResponse = await axios.get(WEBHOOK_URL, {
      timeout: 5000
    });
    
    console.log('✅ Webhook acessível!');
    console.log('📋 Status:', webhookResponse.status);
    
  } catch (error) {
    console.log('❌ Webhook não acessível:', error.message);
  }
  
  // Teste 3: Verificar logs recentes
  console.log('\n3️⃣ Verificando logs recentes...');
  console.log('📋 Execute: railway logs --service atendeai-lify-backend | tail -20');
  console.log('📋 Para ver os logs mais recentes do Railway');
  
  console.log('\n🎯 Próximos passos:');
  console.log('1. Aguarde alguns minutos para o Railway reinicializar');
  console.log('2. Execute: node test-webhook-after-token-update.js');
  console.log('3. Teste enviando uma mensagem real no WhatsApp');
}

checkRailwayStatus(); 