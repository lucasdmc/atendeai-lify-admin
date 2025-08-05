import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWhatsAppMessage() {
  const phoneNumber = '47 99719-2447';
  
  try {
    console.log(`📱 Testando envio de mensagem para: ${phoneNumber}`);
    
    // 1. Verificar se há alguma sessão conectada
    console.log('\n1️⃣ Verificando sessões ativas...');
    const healthResponse = await fetch('https://atendeai-backend-production.up.railway.app/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`📊 Sessões ativas: ${healthData.activeSessions}`);
      
      const connectedSessions = healthData.sessions.filter(s => s.connected);
      console.log(`✅ Sessões conectadas: ${connectedSessions.length}`);
      
      if (connectedSessions.length > 0) {
        console.log('🎯 Sessões conectadas encontradas:');
        connectedSessions.forEach(session => {
          console.log(`  - Agent ID: ${session.agentId}`);
          console.log(`  - Conectado em: ${session.connectedAt}`);
        });
      }
    }
    
    // 2. Testar envio via Edge Function
    console.log('\n2️⃣ Testando envio via Edge Function...');
    const testMessage = {
      to: phoneNumber,
      message: '🤖 Teste de conectividade - Chatbot AtendeAI funcionando!'
    };
    
    console.log('📤 Enviando mensagem:', testMessage);
    
    const { data, error } = await supabase.functions.invoke('whatsapp-integration/send-message', {
      body: testMessage
    });
    
    if (error) {
      console.error('❌ Erro na Edge Function:', error);
      
      // Tentar obter mais detalhes do erro
      if (error.context) {
        console.error('📋 Detalhes do erro:');
        console.error('  Status:', error.context.status);
        console.error('  Status Text:', error.context.statusText);
        console.error('  URL:', error.context.url);
      }
    } else {
      console.log('✅ Resposta da Edge Function:', data);
    }
    
    // 3. Verificar se a mensagem foi enviada
    console.log('\n3️⃣ Verificando se a mensagem foi processada...');
    
    // Aguardar um pouco para processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar logs do servidor
    console.log('📋 Verificando logs do servidor...');
    const logsResponse = await fetch('https://atendeai-backend-production.up.railway.app/logs');
    if (logsResponse.ok) {
      const logs = await logsResponse.text();
      console.log('📝 Últimos logs:', logs.substring(0, 500));
    } else {
      console.log('❌ Não foi possível obter logs do servidor');
    }
    
    console.log('\n📋 Resumo do teste:');
    console.log(`- Número testado: ${phoneNumber}`);
    console.log(`- Sessões conectadas: ${connectedSessions?.length || 0}`);
    console.log(`- Status do envio: ${error ? 'Falhou' : 'Sucesso'}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testWhatsAppMessage(); 