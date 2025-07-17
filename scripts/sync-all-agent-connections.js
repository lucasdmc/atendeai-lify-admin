import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAllAgentConnections() {
  console.log('🔄 SINCRONIZANDO CONEXÕES DE TODOS OS AGENTES');
  console.log('==============================================\n');

  try {
    // 1. Buscar todos os agentes
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*');
    
    if (agentsError) {
      console.error('❌ Erro ao buscar agentes:', agentsError);
      return;
    }

    console.log(`📊 Total de agentes encontrados: ${agents?.length || 0}`);

    // 2. Para cada agente, verificar status no servidor WhatsApp
    for (const agent of agents || []) {
      console.log(`\n🔍 Verificando agente: ${agent.name} (${agent.id})`);
      
      try {
        // Verificar status no servidor WhatsApp
        const statusResponse = await fetch(`http://31.97.241.19:3001/api/whatsapp/status/${agent.id}`);
        
        if (!statusResponse.ok) {
          console.log(`   ⚠️ Servidor não respondeu para ${agent.name}`);
          continue;
        }
        
        const statusData = await statusResponse.json();
        console.log(`   📊 Status: ${statusData.status}`);
        
        // 3. Verificar se já existe conexão na tabela
        const { data: existingConnection } = await supabase
          .from('agent_whatsapp_connections')
          .select('*')
          .eq('agent_id', agent.id)
          .eq('connection_status', 'connected')
          .single();
        
        if (statusData.status === 'connected') {
          console.log(`   ✅ Agente ${agent.name} está conectado no servidor`);
          
          if (existingConnection) {
            console.log(`   🔄 Atualizando conexão existente...`);
            const { error: updateError } = await supabase
              .from('agent_whatsapp_connections')
              .update({
                connection_status: 'connected',
                last_connection_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', existingConnection.id);
            
            if (updateError) {
              console.log(`   ❌ Erro ao atualizar: ${updateError.message}`);
            } else {
              console.log(`   ✅ Conexão atualizada`);
            }
          } else {
            console.log(`   ➕ Criando nova conexão...`);
            const { error: insertError } = await supabase
              .from('agent_whatsapp_connections')
              .insert({
                agent_id: agent.id,
                whatsapp_number: `agente-${agent.id}`, // Placeholder
                whatsapp_name: agent.name,
                connection_status: 'connected',
                last_connection_at: new Date().toISOString()
              });
            
            if (insertError) {
              console.log(`   ❌ Erro ao criar: ${insertError.message}`);
            } else {
              console.log(`   ✅ Nova conexão criada`);
            }
          }
        } else {
          console.log(`   ❌ Agente ${agent.name} não está conectado`);
          
          // Se existe conexão mas não está conectado, atualizar status
          if (existingConnection) {
            console.log(`   🔄 Atualizando status para desconectado...`);
            const { error: updateError } = await supabase
              .from('agent_whatsapp_connections')
              .update({
                connection_status: 'disconnected',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingConnection.id);
            
            if (updateError) {
              console.log(`   ❌ Erro ao atualizar: ${updateError.message}`);
            } else {
              console.log(`   ✅ Status atualizado para desconectado`);
            }
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao verificar ${agent.name}: ${error.message}`);
      }
    }

    // 4. Relatório final
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log('====================');
    
    const { data: finalConnections } = await supabase
      .from('agent_whatsapp_connections')
      .select('*');
    
    const connectedAgents = finalConnections?.filter(c => c.connection_status === 'connected') || [];
    const disconnectedAgents = finalConnections?.filter(c => c.connection_status === 'disconnected') || [];
    
    console.log(`✅ Agentes conectados: ${connectedAgents.length}`);
    console.log(`❌ Agentes desconectados: ${disconnectedAgents.length}`);
    console.log(`📊 Total de conexões: ${finalConnections?.length || 0}`);
    
    if (connectedAgents.length > 0) {
      console.log('\n🤖 AGENTES CONECTADOS:');
      connectedAgents.forEach(conn => {
        console.log(`   - ${conn.whatsapp_name} (${conn.whatsapp_number})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar sincronização
syncAllAgentConnections().then(() => {
  console.log('\n🎉 Sincronização de agentes finalizada!');
}); 