const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
  console.log('Configure a variável de ambiente SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWhatsAppAutoResponse() {
  console.log('🧪 Testando Sistema de Resposta Automática do WhatsApp\n');

  try {
    // 1. Verificar conexões WhatsApp ativas
    console.log('📋 1. Verificando conexões WhatsApp ativas...');
    
    const { data: connections, error: connectionsError } = await supabase
      .from('agent_whatsapp_connections')
      .select(`
        id,
        agent_id,
        whatsapp_number,
        whatsapp_name,
        connection_status,
        agents (
          id,
          name,
          description,
          personality,
          temperature,
          context_json,
          clinics (
            name,
            address,
            phone,
            email
          )
        )
      `)
      .eq('connection_status', 'connected');

    if (connectionsError) {
      console.error('❌ Erro ao buscar conexões:', connectionsError);
      return;
    }

    console.log(`✅ Encontradas ${connections.length} conexões ativas:`);
    connections.forEach(conn => {
      console.log(`   - ${conn.agents.name}: ${conn.whatsapp_number} (${conn.whatsapp_name || 'Sem nome'})`);
    });

    if (connections.length === 0) {
      console.log('⚠️ Nenhuma conexão ativa encontrada. Conecte um agente primeiro.');
      return;
    }

    // 2. Testar processamento de mensagem para cada conexão
    console.log('\n📋 2. Testando processamento de mensagens...');
    
    for (const connection of connections) {
      console.log(`\n🔍 Testando agente: ${connection.agents.name}`);
      console.log(`   Número: ${connection.whatsapp_number}`);
      
      // Simular mensagem recebida
      const testMessages = [
        "Olá! Como posso agendar uma consulta?",
        "Quais são os horários de funcionamento?",
        "Vocês aceitam convênio?",
        "Preciso de informações sobre endoscopia"
      ];
      
      for (const message of testMessages) {
        console.log(`\n   📨 Mensagem: "${message}"`);
        
        try {
          // Simular webhook de mensagem
          const webhookData = {
            event: 'message',
            data: {
              from: connection.whatsapp_number,
              body: message,
              timestamp: Date.now() / 1000,
              id: `test-${Date.now()}`
            }
          };
          
          // Chamar Edge Function whatsapp-integration
          const { data, error } = await supabase.functions.invoke('whatsapp-integration', {
            body: webhookData
          });
          
          if (error) {
            console.log(`   ❌ Erro no webhook: ${error.message}`);
          } else {
            console.log(`   ✅ Webhook processado com sucesso`);
            
            // Verificar se a resposta foi salva
            const { data: savedMessages, error: messagesError } = await supabase
              .from('whatsapp_messages')
              .select('*')
              .eq('conversation_id', data?.conversationId)
              .order('created_at', { ascending: false })
              .limit(2);
            
            if (messagesError) {
              console.log(`   ⚠️ Erro ao verificar mensagens salvas: ${messagesError.message}`);
            } else if (savedMessages && savedMessages.length > 0) {
              const aiResponse = savedMessages.find(m => m.message_type === 'sent' && m.metadata?.ai_generated);
              if (aiResponse) {
                console.log(`   🤖 Resposta da IA: "${aiResponse.content.substring(0, 100)}..."`);
                console.log(`   📊 Metadata: ${JSON.stringify(aiResponse.metadata)}`);
              }
            }
          }
          
          // Aguardar um pouco entre as mensagens
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.log(`   ❌ Erro ao processar mensagem: ${error.message}`);
        }
      }
    }

    // 3. Testar diferentes tipos de mensagens
    console.log('\n📋 3. Testando diferentes tipos de mensagens...');
    
    const testConnection = connections[0];
    const messageTypes = [
      { type: 'Saudação', message: 'Oi! Tudo bem?' },
      { type: 'Agendamento', message: 'Quero marcar uma consulta para amanhã' },
      { type: 'Informação', message: 'Quais são os preços dos exames?' },
      { type: 'Localização', message: 'Onde fica a clínica?' },
      { type: 'Convênio', message: 'Vocês aceitam Unimed?' }
    ];
    
    for (const { type, message } of messageTypes) {
      console.log(`\n   📝 ${type}: "${message}"`);
      
      try {
        const { data, error } = await supabase.functions.invoke('whatsapp-integration', {
          body: {
            event: 'message',
            data: {
              from: testConnection.whatsapp_number,
              body: message,
              timestamp: Date.now() / 1000,
              id: `test-${type}-${Date.now()}`
            }
          }
        });
        
        if (error) {
          console.log(`   ❌ Erro: ${error.message}`);
        } else {
          console.log(`   ✅ Processado com sucesso`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
      }
    }

    // 4. Verificar estatísticas de processamento
    console.log('\n📋 4. Verificando estatísticas...');
    
    const { data: messageStats, error: statsError } = await supabase
      .from('whatsapp_messages')
      .select('message_type, metadata')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    if (statsError) {
      console.error('❌ Erro ao buscar estatísticas:', statsError);
    } else {
      const received = messageStats.filter(m => m.message_type === 'received').length;
      const sent = messageStats.filter(m => m.message_type === 'sent').length;
      const aiGenerated = messageStats.filter(m => m.metadata?.ai_generated).length;
      
      console.log(`   📊 Últimas 24h:`);
      console.log(`      Mensagens recebidas: ${received}`);
      console.log(`      Mensagens enviadas: ${sent}`);
      console.log(`      Respostas da IA: ${aiGenerated}`);
    }

    console.log('\n✅ Teste de resposta automática concluído!');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testWhatsAppAutoResponse().catch(console.error); 