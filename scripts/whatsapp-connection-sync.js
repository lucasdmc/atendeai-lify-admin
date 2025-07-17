const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuração do backend WhatsApp
const WHATSAPP_BACKEND_URL = 'http://31.97.241.19:3001';

async function checkBackendStatus() {
  try {
    const response = await fetch(`${WHATSAPP_BACKEND_URL}/api/whatsapp/status`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao verificar status do backend:', error.message);
    return null;
  }
}

async function getBackendConnections() {
  try {
    const response = await fetch(`${WHATSAPP_BACKEND_URL}/api/whatsapp/connections`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao buscar conexões do backend:', error.message);
    return { connections: [] };
  }
}

async function getDatabaseConnections() {
  try {
    const { data, error } = await supabase
      .from('agent_whatsapp_connections')
      .select('*')
      .eq('connection_status', 'connected');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar conexões do banco:', error.message);
    return [];
  }
}

async function updateConnectionStatus(connectionId, status, backendInfo = null) {
  try {
    const updateData = {
      connection_status: status,
      updated_at: new Date().toISOString()
    };

    if (backendInfo) {
      updateData.client_info = backendInfo;
      updateData.last_connection_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('agent_whatsapp_connections')
      .update(updateData)
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

async function syncConnections() {
  console.log('🔄 SINCRONIZANDO CONEXÕES WHATSAPP');
  console.log('=' .repeat(50));

  // 1. Verificar status do backend
  console.log('📡 Verificando status do backend...');
  const backendStatus = await checkBackendStatus();
  
  if (!backendStatus) {
    console.log('❌ Backend não está acessível');
    return;
  }

  console.log(`✅ Backend: ${backendStatus.status}`);
  console.log(`📱 Conectado: ${backendStatus.connected ? 'Sim' : 'Não'}`);

  // 2. Buscar conexões do backend
  console.log('\n📡 Buscando conexões do backend...');
  const backendConnections = await getBackendConnections();
  console.log(`📊 Conexões no backend: ${backendConnections.connections?.length || 0}`);

  // 3. Buscar conexões do banco
  console.log('\n🗄️ Buscando conexões do banco de dados...');
  const dbConnections = await getDatabaseConnections();
  console.log(`📊 Conexões no banco: ${dbConnections.length}`);

  // 4. Verificar cada conexão do banco
  console.log('\n🔍 Verificando integridade das conexões...');
  
  for (const dbConnection of dbConnections) {
    console.log(`\n📱 Verificando: ${dbConnection.whatsapp_number} (${dbConnection.whatsapp_name})`);
    
    // Verificar se existe no backend
    const backendConnection = backendConnections.connections?.find(
      conn => conn.whatsapp_number === dbConnection.whatsapp_number
    );

    if (backendConnection) {
      console.log(`✅ Encontrado no backend - Status: ${backendConnection.status}`);
      
      // Atualizar status se necessário
      if (backendConnection.status !== dbConnection.connection_status) {
        console.log(`🔄 Atualizando status: ${dbConnection.connection_status} → ${backendConnection.status}`);
        await updateConnectionStatus(dbConnection.id, backendConnection.status, backendConnection);
      }
    } else {
      console.log(`❌ Não encontrado no backend - Marcando como desconectado`);
      await updateConnectionStatus(dbConnection.id, 'disconnected');
    }
  }

  // 5. Verificar conexões órfãs no backend (não estão no banco)
  console.log('\n🔍 Verificando conexões órfãs no backend...');
  
  if (backendConnections.connections) {
    for (const backendConn of backendConnections.connections) {
      const dbConnection = dbConnections.find(
        conn => conn.whatsapp_number === backendConn.whatsapp_number
      );

      if (!dbConnection) {
        console.log(`⚠️ Conexão órfã encontrada: ${backendConn.whatsapp_number}`);
        console.log('💡 Esta conexão não está registrada no banco de dados');
      }
    }
  }

  // 6. Relatório final
  console.log('\n📊 RELATÓRIO FINAL');
  console.log('=' .repeat(30));
  
  const finalDbConnections = await getDatabaseConnections();
  console.log(`✅ Conexões ativas no banco: ${finalDbConnections.length}`);
  
  if (finalDbConnections.length > 0) {
    console.log('\n📱 Conexões ativas:');
    finalDbConnections.forEach(conn => {
      console.log(`   • ${conn.whatsapp_number} (${conn.whatsapp_name})`);
    });
  } else {
    console.log('📱 Nenhuma conexão ativa encontrada');
  }

  console.log('\n✅ Sincronização concluída!');
}

// Executar sincronização
syncConnections().catch(console.error); 