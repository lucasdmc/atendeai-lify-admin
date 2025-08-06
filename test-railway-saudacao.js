import axios from 'axios';

async function testRailwaySaudacao() {
  console.log('🧪 TESTE: Verificando se a correção da saudação foi aplicada no Railway');
  
  try {
    // URL do Railway (substitua pela URL correta)
    const railwayUrl = 'https://atendeai-backend-production.up.railway.app';
    
    console.log(`🌐 Testando endpoint: ${railwayUrl}/health`);
    
    // Testar se o serviço está online
    const healthResponse = await axios.get(`${railwayUrl}/health`, {
      timeout: 10000
    });
    
    console.log('✅ Serviço online');
    console.log('📊 Status:', healthResponse.status);
    
    // Simular uma mensagem de teste
    console.log('\n📝 Simulando mensagem de teste...');
    
    const testMessage = {
      phoneNumber: '554730915628',
      message: 'Olá!',
      conversationId: 'test-' + Date.now(),
      userId: 'test-user'
    };
    
    console.log('📤 Enviando mensagem de teste...');
    
    const messageResponse = await axios.post(`${railwayUrl}/api/ai/process-message`, testMessage, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Resposta recebida');
    console.log('📊 Status:', messageResponse.status);
    
    const responseData = messageResponse.data;
    console.log('\n📝 RESPOSTA DO RAILWAY:');
    console.log('='.repeat(50));
    console.log(responseData.response);
    console.log('='.repeat(50));
    
    // Verificar se a resposta contém saudação
    const hasGreeting = responseData.response.includes('Olá! Sou o Cardio, assistente virtual da CardioPrime');
    console.log(`\n🔍 Contém saudação? ${hasGreeting ? 'SIM' : 'NÃO'}`);
    
    // Verificar metadados
    if (responseData.metadata) {
      console.log('\n📊 METADADOS:');
      console.log(`  - isFirstConversationOfDay: ${responseData.metadata.conversationContext?.isFirstConversationOfDay}`);
      console.log(`  - isWithinBusinessHours: ${responseData.metadata.conversationContext?.isWithinBusinessHours}`);
      console.log(`  - Intent: ${responseData.intent?.name}`);
    }
    
    if (hasGreeting) {
      console.log('\n⚠️ PROBLEMA: Saudação ainda está sendo aplicada no Railway!');
      console.log('🔍 Isso indica que a correção pode não ter sido aplicada ou há outro problema.');
    } else {
      console.log('\n✅ CORRETO: Saudação não está sendo aplicada no Railway!');
      console.log('🎉 A correção foi aplicada com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📝 Dados:', error.response.data);
    }
  }
}

// Executar teste
testRailwaySaudacao().then(() => {
  console.log('\n✅ Teste concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
}); 