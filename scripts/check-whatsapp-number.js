import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkWhatsAppNumber() {
  const phoneNumber = '47 99719-2447';
  let serverStatus = 'Offline';
  
  try {
    console.log(`🔍 Verificando número: ${phoneNumber}`);
    
    // 1. Verificar na tabela agent_whatsapp_connections
    console.log('\n1️⃣ Verificando tabela agent_whatsapp_connections...');
    const { data: connections, error: connectionsError } = await supabase
      .from('agent_whatsapp_connections')
      .select('*')
      .eq('whatsapp_number', phoneNumber);
    
    if (connectionsError) {
      console.error('❌ Erro ao buscar conexões:', connectionsError);
    } else {
      console.log('✅ Conexões encontradas:', connections.length);
      connections.forEach(conn => {
        console.log(`  - ID: ${conn.id}`);
        console.log(`  - Agent ID: ${conn.agent_id}`);
        console.log(`  - Status: ${conn.connection_status}`);
        console.log(`  - Conectado em: ${conn.connected_at}`);
        console.log(`  - Atualizado em: ${conn.updated_at}`);
      });
    }
    
    // 2. Verificar na tabela agents
    console.log('\n2️⃣ Verificando tabela agents...');
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*');
    
    if (agentsError) {
      console.error('❌ Erro ao buscar agentes:', agentsError);
    } else {
      console.log('✅ Agentes encontrados:', agents.length);
      agents.forEach(agent => {
        console.log(`  - ID: ${agent.id}`);
        console.log(`  - Nome: ${agent.name}`);
        console.log(`  - Ativo: ${agent.is_active}`);
      });
    }
    
    // 3. Verificar status no servidor WhatsApp
    console.log('\n3️⃣ Verificando servidor WhatsApp...');
    try {
      const response = await fetch('http://31.97.241.19:3001/health');
      if (response.ok) {
        const data = await response.json();
        serverStatus = 'Online';
        console.log('✅ Servidor WhatsApp está online');
        console.log(`📊 Sessões ativas: ${data.activeSessions}`);
        
        data.sessions.forEach(session => {
          console.log(`  - Agent ID: ${session.agentId}`);
          console.log(`  - Status: ${session.status}`);
          console.log(`  - Conectado: ${session.connected}`);
          if (session.connectedAt) {
            console.log(`  - Conectado em: ${session.connectedAt}`);
          }
        });
      } else {
        console.log('❌ Servidor WhatsApp não está respondendo');
      }
    } catch (error) {
      console.error('❌ Erro ao conectar com servidor WhatsApp:', error.message);
    }
    
    // 4. Testar envio de mensagem
    console.log('\n4️⃣ Testando envio de mensagem...');
    try {
      const testMessage = {
        to: phoneNumber,
        message: '🤖 Teste de conectividade - Chatbot AtendeAI funcionando!'
      };
      
      const { data: messageData, error: messageError } = await supabase.functions.invoke('whatsapp-integration/send-message', {
        body: testMessage
      });
      
      if (messageError) {
        console.error('❌ Erro ao enviar mensagem:', messageError);
      } else {
        console.log('✅ Mensagem enviada com sucesso:', messageData);
      }
    } catch (error) {
      console.error('❌ Erro ao testar envio:', error.message);
    }
    
    console.log('\n📋 Resumo:');
    console.log(`- Número verificado: ${phoneNumber}`);
    console.log(`- Conexões encontradas: ${connections?.length || 0}`);
    console.log(`- Agentes disponíveis: ${agents?.length || 0}`);
    console.log(`- Servidor WhatsApp: ${serverStatus}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkWhatsAppNumber(); 