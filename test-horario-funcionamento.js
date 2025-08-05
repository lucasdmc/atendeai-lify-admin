// Teste do horário de funcionamento
import axios from 'axios';

const RAILWAY_URL = 'https://atendeai-lify-backend-production.up.railway.app';

async function testHorarioFuncionamento() {
  console.log('🔍 TESTE DO HORÁRIO DE FUNCIONAMENTO');
  console.log('============================================================\n');

  try {
    // 1. Verificar horário atual
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][now.getDay()];
    
    console.log('📅 Informações atuais:');
    console.log(`  - Data: ${now.toLocaleDateString('pt-BR')}`);
    console.log(`  - Hora: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
    console.log(`  - Dia: ${currentDay}`);
    console.log('');

    // 2. Teste com API para verificar configurações
    console.log('📋 2. Verificando configurações via API...');
    const aiResponse = await axios.post(`${RAILWAY_URL}/api/ai/process`, {
      message: "Teste de horário",
      clinicId: "cardioprime_blumenau_2024",
      userId: "5511999999999",
      sessionId: "test-horario"
    });
    
    console.log('✅ Resposta da API:', aiResponse.data.success ? 'SUCESSO' : 'ERRO');
    console.log('');

    // 3. Teste com webhook para verificar comportamento
    console.log('📋 3. Testando webhook...');
    const testNumber = '5511444444444';
    
    const webhookData = {
      object: "whatsapp_business_account",
      entry: [{
        id: "test-horario",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: testNumber,
              phone_number_id: "698766983327246"
            },
            contacts: [{
              profile: { name: "Teste Horário" },
              wa_id: testNumber
            }],
            messages: [{
              from: testNumber,
              id: "wamid.test.horario." + Date.now(),
              timestamp: "1704067200",
              text: { body: "Teste de horário" },
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
      
      // Verificar tipo de resposta
      const isOutOfHours = response.includes('fora do horário de atendimento');
      const hasInitialGreeting = response.includes('Olá! Sou o Cardio') || response.includes('assistente virtual da CardioPrime');
      
      console.log('🔍 Análise da resposta:');
      console.log('  - Mensagem fora do horário:', isOutOfHours ? 'SIM' : 'NÃO');
      console.log('  - Saudação inicial:', hasInitialGreeting ? 'SIM' : 'NÃO');
      console.log('  - Resposta normal:', (!isOutOfHours && !hasInitialGreeting) ? 'SIM' : 'NÃO');
    }
    
    // 4. Horários esperados da CardioPrime
    console.log('\n📋 4. Horários esperados da CardioPrime:');
    console.log('  - Segunda a Sexta: 08:00 às 18:00');
    console.log('  - Sábado: 08:00 às 12:00');
    console.log('  - Domingo: Fechado');
    console.log('');

    console.log('🎉 TESTE DO HORÁRIO FINALIZADO!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Data:', error.response.data);
    }
  }
}

testHorarioFuncionamento(); 