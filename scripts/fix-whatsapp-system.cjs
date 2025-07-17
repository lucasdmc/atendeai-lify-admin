const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no ambiente');
  console.log('💡 Execute este script no Supabase Dashboard ou configure a variável de ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuração do backend WhatsApp
const WHATSAPP_BACKEND_URL = 'http://31.97.241.19:3001';

async function checkBackendAgentStatus(agentId) {
  try {
    const response = await fetch(`${WHATSAPP_BACKEND_URL}/api/whatsapp/status/${agentId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao verificar status do agente no backend:', error.message);
    return { status: 'disconnected' };
  }
}

async function getAllAgents() {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar agentes:', error.message);
    return [];
  }
}

async function getAgentConnections(agentId) {
  try {
    const { data, error } = await supabase
      .from('agent_whatsapp_connections')
      .select('*')
      .eq('agent_id', agentId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar conexões do agente:', error.message);
    return [];
  }
}

async function updateConnectionStatus(connectionId, status) {
  try {
    const { error } = await supabase
      .from('agent_whatsapp_connections')
      .update({
        connection_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`❌ Erro ao atualizar conexão ${connectionId}:`, error.message);
    return false;
  }
}

async function deleteConnection(connectionId) {
  try {
    const { error } = await supabase
      .from('agent_whatsapp_connections')
      .delete()
      .eq('id', connectionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`❌ Erro ao deletar conexão ${connectionId}:`, error.message);
    return false;
  }
}

async function fixWhatsAppSystem() {
  console.log('🔧 CORRIGINDO SISTEMA WHATSAPP');
  console.log('=' .repeat(50));

  // 1. Buscar todos os agentes
  console.log('👥 Buscando agentes...');
  const agents = await getAllAgents();
  console.log(`📊 Total de agentes: ${agents.length}`);

  let totalConnections = 0;
  let updatedConnections = 0;
  let deletedConnections = 0;
  let validConnections = 0;

  // 2. Verificar cada agente
  for (const agent of agents) {
    console.log(`\n👤 Verificando agente: ${agent.name} (${agent.id})`);
    
    // Verificar status no backend
    const backendStatus = await checkBackendAgentStatus(agent.id);
    console.log(`   Status no backend: ${backendStatus.status}`);
    
    // Buscar conexões do agente
    const connections = await getAgentConnections(agent.id);
    console.log(`   Conexões no banco: ${connections.length}`);
    
    totalConnections += connections.length;

    // Verificar cada conexão
    for (const connection of connections) {
      console.log(`   📱 Verificando: ${connection.whatsapp_number}`);
      
      const isConnectedInBackend = backendStatus.status === 'connected';
      const isConnectedInDatabase = connection.connection_status === 'connected';
      
      if (isConnectedInBackend && isConnectedInDatabase) {
        console.log(`     ✅ Conexão válida - mantendo`);
        validConnections++;
      } else if (isConnectedInBackend && !isConnectedInDatabase) {
        console.log(`     🔄 Atualizando para 'connected'`);
        await updateConnectionStatus(connection.id, 'connected');
        updatedConnections++;
        validConnections++;
      } else if (!isConnectedInBackend && isConnectedInDatabase) {
        console.log(`     🔄 Atualizando para 'disconnected'`);
        await updateConnectionStatus(connection.id, 'disconnected');
        updatedConnections++;
      } else {
        console.log(`     ✅ Status correto (desconectado)`);
      }
    }

    // Se o agente está desconectado no backend, limpar conexões antigas
    if (backendStatus.status === 'disconnected') {
      const oldConnections = connections.filter(conn => {
        const createdAt = new Date(conn.created_at);
        const now = new Date();
        const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
        return hoursDiff > 24; // Mais de 24h
      });

      for (const oldConnection of oldConnections) {
        console.log(`     🗑️ Deletando conexão antiga: ${oldConnection.whatsapp_number}`);
        await deleteConnection(oldConnection.id);
        deletedConnections++;
      }
    }
  }

  // 3. Relatório final
  console.log('\n📊 RELATÓRIO DE CORREÇÃO');
  console.log('=' .repeat(30));
  console.log(`👥 Agentes verificados: ${agents.length}`);
  console.log(`📱 Total de conexões: ${totalConnections}`);
  console.log(`✅ Conexões válidas: ${validConnections}`);
  console.log(`🔄 Conexões atualizadas: ${updatedConnections}`);
  console.log(`🗑️ Conexões deletadas: ${deletedConnections}`);

  // 4. Verificar conexões finais
  console.log('\n📱 CONEXÕES ATIVAS FINAIS');
  console.log('=' .repeat(30));
  
  let activeConnectionsCount = 0;
  
  for (const agent of agents) {
    const connections = await getAgentConnections(agent.id);
    const activeConnections = connections.filter(conn => conn.connection_status === 'connected');
    
    if (activeConnections.length > 0) {
      console.log(`\n👤 ${agent.name}:`);
      activeConnections.forEach(conn => {
        console.log(`   • ${conn.whatsapp_number} (${conn.whatsapp_name})`);
        activeConnectionsCount++;
      });
    }
  }

  if (activeConnectionsCount === 0) {
    console.log('📱 Nenhuma conexão ativa encontrada');
  }

  console.log(`\n✅ Sistema corrigido! Total de conexões ativas: ${activeConnectionsCount}`);
}

// Executar correção
fixWhatsAppSystem().catch(console.error); 