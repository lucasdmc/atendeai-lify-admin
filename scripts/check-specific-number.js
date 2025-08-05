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

const TARGET_NUMBER = '5547999528232';

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

async function findNumberInDatabase() {
  try {
    const { data, error } = await supabase
      .from('agent_whatsapp_connections')
      .select('*')
      .eq('whatsapp_number', TARGET_NUMBER);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar número no banco:', error.message);
    return [];
  }
}

async function checkSpecificNumber() {
  console.log(`🔍 VERIFICANDO NÚMERO ESPECÍFICO: ${TARGET_NUMBER}`);
  console.log('=' .repeat(60));

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
  console.log(`📊 Total de conexões no backend: ${backendConnections.connections?.length || 0}`);

  // 3. Verificar se o número está no backend
  const backendConnection = backendConnections.connections?.find(
    conn => conn.whatsapp_number === TARGET_NUMBER
  );

  if (backendConnection) {
    console.log(`✅ Número encontrado no backend:`);
    console.log(`   • Número: ${backendConnection.whatsapp_number}`);
    console.log(`   • Status: ${backendConnection.status}`);
    console.log(`   • Nome: ${backendConnection.whatsapp_name || 'N/A'}`);
  } else {
    console.log(`❌ Número NÃO encontrado no backend`);
  }

  // 4. Verificar no banco de dados
  console.log('\n🗄️ Verificando no banco de dados...');
  const dbConnections = await findNumberInDatabase();
  console.log(`📊 Registros encontrados no banco: ${dbConnections.length}`);

  if (dbConnections.length > 0) {
    console.log('\n📱 Registros no banco:');
    dbConnections.forEach((conn, index) => {
      console.log(`\n   Registro ${index + 1}:`);
      console.log(`   • ID: ${conn.id}`);
      console.log(`   • Número: ${conn.whatsapp_number}`);
      console.log(`   • Nome: ${conn.whatsapp_name}`);
      console.log(`   • Status: ${conn.connection_status}`);
      console.log(`   • Agente ID: ${conn.agent_id}`);
      console.log(`   • Criado em: ${conn.created_at}`);
      console.log(`   • Atualizado em: ${conn.updated_at}`);
    });
  } else {
    console.log(`❌ Número NÃO encontrado no banco de dados`);
  }

  // 5. Análise de inconsistências
  console.log('\n🔍 ANÁLISE DE INCONSISTÊNCIAS');
  console.log('=' .repeat(40));

  const isInBackend = !!backendConnection;
  const isInDatabase = dbConnections.length > 0;
  const isConnectedInBackend = backendConnection?.status === 'connected';
  const isConnectedInDatabase = dbConnections.some(conn => conn.connection_status === 'connected');

  console.log(`📊 Resultados:`);
  console.log(`   • No backend: ${isInBackend ? 'Sim' : 'Não'}`);
  console.log(`   • No banco: ${isInDatabase ? 'Sim' : 'Não'}`);
  console.log(`   • Conectado no backend: ${isConnectedInBackend ? 'Sim' : 'Não'}`);
  console.log(`   • Conectado no banco: ${isConnectedInDatabase ? 'Sim' : 'Não'}`);

  if (isInBackend && !isInDatabase) {
    console.log(`\n⚠️ INCONSISTÊNCIA: Número está no backend mas não no banco`);
  } else if (!isInBackend && isInDatabase) {
    console.log(`\n⚠️ INCONSISTÊNCIA: Número está no banco mas não no backend`);
  } else if (isConnectedInBackend && !isConnectedInDatabase) {
    console.log(`\n⚠️ INCONSISTÊNCIA: Conectado no backend mas não no banco`);
  } else if (!isConnectedInBackend && isConnectedInDatabase) {
    console.log(`\n⚠️ INCONSISTÊNCIA: Conectado no banco mas não no backend`);
  } else if (isInBackend && isInDatabase && isConnectedInBackend && isConnectedInDatabase) {
    console.log(`\n✅ SITUAÇÃO CORRETA: Número conectado em ambos os sistemas`);
  } else {
    console.log(`\nℹ️ SITUAÇÃO: Número não está conectado em nenhum sistema`);
  }

  // 6. Recomendações
  console.log('\n💡 RECOMENDAÇÕES');
  console.log('=' .repeat(20));

  if (!isInBackend && !isInDatabase) {
    console.log('• Número não está em nenhum sistema - situação normal');
  } else if (isInBackend && !isInDatabase) {
    console.log('• Sincronizar com banco de dados');
  } else if (!isInBackend && isInDatabase) {
    console.log('• Limpar registro do banco de dados');
  } else if (isConnectedInBackend && !isConnectedInDatabase) {
    console.log('• Atualizar status no banco para "connected"');
  } else if (!isConnectedInBackend && isConnectedInDatabase) {
    console.log('• Atualizar status no banco para "disconnected"');
  }

  console.log('\n✅ Verificação concluída!');
}

// Executar verificação
checkSpecificNumber().catch(console.error); 