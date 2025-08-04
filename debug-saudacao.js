// Debug da saudação inicial
import axios from 'axios';

const RAILWAY_URL = 'https://atendeai-lify-backend-production.up.railway.app';

async function debugSaudacao() {
  console.log('🔍 DEBUG DA SAUDAÇÃO INICIAL');
  console.log('============================================================\n');

  try {
    // Teste com número completamente novo
    const testNumber = '5511777777777';
    console.log(`📱 Testando com número: ${testNumber}`);
    
    const webhookData = {
      object: "whatsapp_business_account",
      entry: [{
        id: "debug-saudacao",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: testNumber,
              phone_number_id: "698766983327246"
            },
            contacts: [{
              profile: { name: "Debug Test" },
              wa_id: testNumber
            }],
            messages: [{
              from: testNumber,
              id: "wamid.debug." + Date.now(),
              timestamp: "1704067200",
              text: { body: "Oi" },
              type: "text"
            }]
          },
          field: "messages"
        }]
      }]
    };

    console.log('📤 Enviando webhook...');
    const response = await axios.post(`${RAILWAY_URL}/webhook/whatsapp-meta`, webhookData);
    
    console.log('📥 Resposta recebida:');
    console.log('✅ Success:', response.data.success);
    console.log('📝 Message:', response.data.message);
    
    if (response.data.processed && response.data.processed.length > 0) {
      const processed = response.data.processed[0];
      console.log('📊 Processed data:');
      console.log('  - Phone Number:', processed.phoneNumber);
      console.log('  - Message:', processed.message);
      console.log('  - Response length:', processed.response?.length || 0);
      console.log('  - Intent:', processed.intent?.name);
      console.log('  - Confidence:', processed.confidence);
      
      console.log('\n💬 Resposta completa:');
      console.log(processed.response);
      
      // Verificar se contém elementos da saudação
      const responseText = processed.response || '';
      console.log('\n🔍 Análise da resposta:');
      console.log('  - Contém "Olá! Sou o Cardio":', responseText.includes('Olá! Sou o Cardio'));
      console.log('  - Contém "assistente virtual":', responseText.includes('assistente virtual'));
      console.log('  - Contém "CardioPrime":', responseText.includes('CardioPrime'));
      console.log('  - Contém "Como posso cuidar":', responseText.includes('Como posso cuidar'));
      console.log('  - Contém "saúde cardiovascular":', responseText.includes('saúde cardiovascular'));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Data:', error.response.data);
    }
  }
}

debugSaudacao(); 