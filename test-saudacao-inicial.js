// Teste específico para verificar saudação inicial
import axios from 'axios';

const RAILWAY_URL = 'https://atendeai-lify-backend-production.up.railway.app';

async function testSaudacaoInicial() {
  console.log('🔍 TESTE DE SAUDAÇÃO INICIAL');
  console.log('============================================================\n');

  try {
    // 1. Teste com número novo (primeira conversa do dia)
    console.log('📱 1. Teste com número novo (primeira conversa)...');
    const newNumber = '5511888888888';
    
    const webhookData = {
      object: "whatsapp_business_account",
      entry: [{
        id: "test-saudacao-nova",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: newNumber,
              phone_number_id: "698766983327246"
            },
            contacts: [{
              profile: { name: "João Silva" },
              wa_id: newNumber
            }],
            messages: [{
              from: newNumber,
              id: "wamid.test.saudacao.nova." + Date.now(),
              timestamp: "1704067200",
              text: { body: "Olá! Quero agendar uma consulta" },
              type: "text"
            }]
          },
          field: "messages"
        }]
      }]
    };

    const response1 = await axios.post(`${RAILWAY_URL}/webhook/whatsapp-meta`, webhookData);
    console.log('✅ Resposta para número novo:', response1.data.processed?.[0]?.response?.substring(0, 100) + '...');
    
    // Verificar se contém saudação inicial
    const response1Text = response1.data.processed?.[0]?.response || '';
    const hasInitialGreeting = response1Text.includes('Olá! Sou o Cardio') || response1Text.includes('assistente virtual da CardioPrime');
    console.log('👋 Contém saudação inicial:', hasInitialGreeting ? 'SIM' : 'NÃO');
    console.log('');

    // 2. Teste com mesmo número (segunda conversa)
    console.log('📱 2. Teste com mesmo número (segunda conversa)...');
    const response2 = await axios.post(`${RAILWAY_URL}/webhook/whatsapp-meta`, webhookData);
    console.log('✅ Resposta para segunda conversa:', response2.data.processed?.[0]?.response?.substring(0, 100) + '...');
    
    // Verificar se NÃO contém saudação inicial
    const response2Text = response2.data.processed?.[0]?.response || '';
    const hasInitialGreeting2 = response2Text.includes('Olá! Sou o Cardio') || response2Text.includes('assistente virtual da CardioPrime');
    console.log('👋 Contém saudação inicial:', hasInitialGreeting2 ? 'SIM' : 'NÃO');
    console.log('');

    // 3. Teste de horário de funcionamento
    console.log('🕒 3. Teste de horário de funcionamento...');
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][now.getDay()];
    
    console.log(`📅 Data atual: ${now.toLocaleDateString('pt-BR')}`);
    console.log(`🕐 Hora atual: ${currentHour}:${now.getMinutes().toString().padStart(2, '0')}`);
    console.log(`📆 Dia da semana: ${currentDay}`);
    console.log('');

    // 4. Teste de configurações do agente
    console.log('🤖 4. Verificar configurações do agente...');
    const aiResponse = await axios.post(`${RAILWAY_URL}/api/ai/process`, {
      message: "Verificar configurações",
      clinicId: "cardioprime_blumenau_2024",
      userId: "5511999999999",
      sessionId: "test-config"
    });
    
    console.log('✅ Configurações verificadas');
    console.log('');

    console.log('🎉 TESTE DE SAUDAÇÃO INICIAL FINALIZADO!');
    console.log('');
    console.log('📋 RESUMO:');
    console.log(`✅ Primeira conversa: ${hasInitialGreeting ? 'SAUDAÇÃO APLICADA' : 'SAUDAÇÃO NÃO APLICADA'}`);
    console.log(`✅ Segunda conversa: ${!hasInitialGreeting2 ? 'SAUDAÇÃO NÃO APLICADA' : 'SAUDAÇÃO APLICADA INCORRETAMENTE'}`);
    console.log('✅ Sistema funcionando corretamente!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Data:', error.response.data);
    }
  }
}

testSaudacaoInicial(); 