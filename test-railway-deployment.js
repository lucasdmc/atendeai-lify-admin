// ========================================
// TESTE DE DEPLOYMENT RAILWAY
// ========================================

import axios from 'axios';

async function testRailwayDeployment() {
  const RAILWAY_URL = process.env.RAILWAY_URL || 'https://atendeai-backend-production.up.railway.app';
  
  console.log('🚀 [Railway Test] Iniciando testes de deployment...');
  console.log('📍 URL:', RAILWAY_URL);
  
  try {
    // 1. Teste de health check
    console.log('\n🏥 [Test 1] Health Check...');
    const health = await axios.get(`${RAILWAY_URL}/health`);
    console.log('✅ Health check:', health.data);
    
    // 2. Teste de endpoint principal
    console.log('\n🏠 [Test 2] Endpoint Principal...');
    const main = await axios.get(`${RAILWAY_URL}/`);
    console.log('✅ Main endpoint:', main.data);
    
    // 3. Teste de webhook com contextualização
    console.log('\n🤖 [Test 3] Webhook com Contextualização...');
    const webhookTest = await axios.post(`${RAILWAY_URL}/webhook/whatsapp-meta`, {
      object: "whatsapp_business_account",
      entry: [{
        id: "test-railway",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "5511999999999",
              phone_number_id: "test-railway"
            },
            contacts: [{
              profile: { name: "Lucas" },
              wa_id: "5511999999999"
            }],
            messages: [{
              from: "5511999999999",
              id: "wamid.test.railway",
              timestamp: "1704067200",
              text: { body: "Olá! Me chamo Lucas. Quais são os preços dos procedimentos da CardioPrime?" },
              type: "text"
            }]
          },
          field: "messages"
        }]
      }]
    });
    
    console.log('✅ Webhook test:', {
      success: webhookTest.data.success,
      message: webhookTest.data.message,
      aiResponse: webhookTest.data.aiResponse?.response?.substring(0, 100) + '...'
    });
    
    // 4. Teste de AI process
    console.log('\n🧠 [Test 4] AI Process...');
    const aiTest = await axios.post(`${RAILWAY_URL}/api/ai/process`, {
      message: "Quais são os preços da CardioPrime?",
      clinicId: "cardioprime_blumenau_2024",
      userId: "5511999999999",
      sessionId: "test-railway-session"
    });
    
    console.log('✅ AI Process test:', {
      success: aiTest.data.success,
      response: aiTest.data.data?.response?.substring(0, 100) + '...'
    });
    
    console.log('\n🎉 [Railway Test] TODOS OS TESTES PASSARAM!');
    console.log('✅ Railway deployment está funcionando corretamente');
    
  } catch (error) {
    console.error('❌ [Railway Test] Erro:', error.message);
    
    if (error.response) {
      console.error('📊 Response data:', error.response.data);
      console.error('📊 Status:', error.response.status);
    }
    
    process.exit(1);
  }
}

// Executar teste
testRailwayDeployment(); 