// Teste das configurações do agente
import axios from 'axios';

const RAILWAY_URL = 'https://atendeai-lify-backend-production.up.railway.app';

async function testConfiguracoesAgente() {
  console.log('🔍 TESTE DAS CONFIGURAÇÕES DO AGENTE');
  console.log('============================================================\n');

  try {
    // Teste 1: Verificar configurações via API
    console.log('📋 1. Verificando configurações via API...');
    const aiResponse = await axios.post(`${RAILWAY_URL}/api/ai/process`, {
      message: "Quais são suas configurações?",
      clinicId: "cardioprime_blumenau_2024",
      userId: "5511999999999",
      sessionId: "test-config"
    });
    
    console.log('✅ Resposta da API:', aiResponse.data.success ? 'SUCESSO' : 'ERRO');
    console.log('');

    // Teste 2: Teste com webhook para verificar saudação
    console.log('📋 2. Testando webhook com saudação...');
    const testNumber = '5511666666666';
    
    const webhookData = {
      object: "whatsapp_business_account",
      entry: [{
        id: "test-config",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: testNumber,
              phone_number_id: "698766983327246"
            },
            contacts: [{
              profile: { name: "Teste Config" },
              wa_id: testNumber
            }],
            messages: [{
              from: testNumber,
              id: "wamid.test.config." + Date.now(),
              timestamp: "1704067200",
              text: { body: "Olá" },
              type: "text"
            }]
          },
          field: "messages"
        }]
      }]
    };

    const webhookResponse = await axios.post(`${RAILWAY_URL}/webhook/whatsapp-meta`, webhookData);
    
    if (webhookResponse.data.processed && webhookResponse.data.processed.length > 0) {
      const response = webhookResponse.data.processed[0].response;
      console.log('💬 Resposta do webhook:');
      console.log(response);
      console.log('');
      
      // Verificar configurações específicas
      console.log('🔍 Verificando configurações:');
      console.log('  - Saudação inicial configurada:', response.includes('Olá! Sou o Cardio') || response.includes('Olá! Sou Cardio'));
      console.log('  - Nome do agente:', response.includes('Cardio') ? 'Cardio' : 'Não encontrado');
      console.log('  - Nome da clínica:', response.includes('CardioPrime') ? 'CardioPrime' : 'Não encontrado');
      console.log('  - Texto "assistente virtual":', response.includes('assistente virtual') ? 'SIM' : 'NÃO');
      console.log('  - Texto "saúde cardiovascular":', response.includes('saúde cardiovascular') ? 'SIM' : 'NÃO');
    }
    
    // Teste 3: Verificar configurações esperadas
    console.log('\n📋 3. Configurações esperadas:');
    console.log('  - Saudação inicial: "Olá! Sou o Cardio, assistente virtual da CardioPrime. Como posso cuidar da sua saúde cardiovascular hoje?"');
    console.log('  - Mensagem de despedida: "Obrigado por escolher a CardioPrime para cuidar do seu coração. Até breve!"');
    console.log('  - Mensagem fora horário: "No momento estamos fora do horário de atendimento. Para emergências cardíacas, procure o pronto-socorro do Hospital Santa Catarina ou ligue 192 (SAMU). Retornaremos seu contato no próximo horário comercial."');
    console.log('');

    console.log('🎉 TESTE DAS CONFIGURAÇÕES FINALIZADO!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Data:', error.response.data);
    }
  }
}

testConfiguracoesAgente(); 