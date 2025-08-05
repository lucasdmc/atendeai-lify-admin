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
const WHATSAPP_BACKEND_URL = 'https://atendeai-backend-production.up.railway.app';

async function checkBackendConnection(whatsappNumber) {
  try {
    const response = await fetch(`${WHATSAPP_BACKEND_URL}/api/whatsapp/connections`);
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    const connection = data.connections?.find(conn => conn.whatsapp_number === whatsappNumber);
    
    return connection && connection.status === 'connected';
  } catch (error) {
    console.error(`❌ Erro ao verificar conexão ${whatsappNumber}:`, error.message);
    return false;
  }
}

async function getAllDatabaseConnections() {
  try {
    const { data, error } = await supabase
      .from('agent_whatsapp_connections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar conexões do banco:', error.message);
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

async function cleanupInvalidConnections() {
  console.log('🧹 LIMPEZA DE CONEXÕES INVÁLIDAS');
  console.log('=' .repeat(50));

  // 1. Buscar todas as conexões do banco
  console.log('📊 Buscando todas as conexões do banco...');
  const dbConnections = await getAllDatabaseConnections();
  console.log(`📊 Total de conexões encontradas: ${dbConnections.length}`);

  let updatedCount = 0;
  let deletedCount = 0;
  let validCount = 0;

  // 2. Verificar cada conexão
  for (const connection of dbConnections) {
    console.log(`\n📱 Verificando: ${connection.whatsapp_number} (${connection.whatsapp_name})`);
    console.log(`   Status no banco: ${connection.connection_status}`);
    
    // Verificar se está realmente conectada no backend
    const isActuallyConnected = await checkBackendConnection(connection.whatsapp_number);
    
    if (isActuallyConnected) {
      console.log(`✅ Conexão válida - mantendo como conectada`);
      validCount++;
      
      // Atualizar status se necessário
      if (connection.connection_status !== 'connected') {
        console.log(`🔄 Atualizando status para 'connected'`);
        await updateConnectionStatus(connection.id, 'connected');
        updatedCount++;
      }
    } else {
      console.log(`❌ Conexão inválida - não está conectada no backend`);
      
      if (connection.connection_status === 'connected') {
        console.log(`🔄 Marcando como desconectada`);
        await updateConnectionStatus(connection.id, 'disconnected');
        updatedCount++;
      }
      
      // Se a conexão é muito antiga (mais de 24h) e está desconectada, deletar
      const createdAt = new Date(connection.created_at);
      const now = new Date();
      const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
      
      if (hoursDiff > 24 && connection.connection_status === 'disconnected') {
        console.log(`🗑️ Deletando conexão antiga (${Math.round(hoursDiff)}h)`);
        await deleteConnection(connection.id);
        deletedCount++;
      }
    }
  }

  // 3. Relatório final
  console.log('\n📊 RELATÓRIO DE LIMPEZA');
  console.log('=' .repeat(30));
  console.log(`✅ Conexões válidas: ${validCount}`);
  console.log(`🔄 Conexões atualizadas: ${updatedCount}`);
  console.log(`🗑️ Conexões deletadas: ${deletedCount}`);
  
  // 4. Verificar conexões finais
  const finalConnections = await getAllDatabaseConnections();
  const activeConnections = finalConnections.filter(conn => conn.connection_status === 'connected');
  
  console.log(`\n📱 Conexões ativas finais: ${activeConnections.length}`);
  
  if (activeConnections.length > 0) {
    console.log('\n📱 Conexões ativas:');
    activeConnections.forEach(conn => {
      console.log(`   • ${conn.whatsapp_number} (${conn.whatsapp_name})`);
    });
  }

  console.log('\n✅ Limpeza concluída!');
}

// Executar limpeza
cleanupInvalidConnections().catch(console.error); 