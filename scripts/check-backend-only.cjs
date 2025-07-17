// Configuração do backend WhatsApp
const WHATSAPP_BACKEND_URL = 'http://31.97.241.19:3001';

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

async function checkBackendOnly() {
  console.log(`🔍 VERIFICANDO BACKEND WHATSAPP`);
  console.log(`📱 Número alvo: ${TARGET_NUMBER}`);
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

  if (backendConnections.connections && backendConnections.connections.length > 0) {
    console.log('\n📱 Conexões encontradas no backend:');
    backendConnections.connections.forEach((conn, index) => {
      console.log(`\n   Conexão ${index + 1}:`);
      console.log(`   • Número: ${conn.whatsapp_number}`);
      console.log(`   • Status: ${conn.status}`);
      console.log(`   • Nome: ${conn.whatsapp_name || 'N/A'}`);
    });
  } else {
    console.log('\n📱 Nenhuma conexão encontrada no backend');
  }

  // 3. Verificar se o número específico está no backend
  const targetConnection = backendConnections.connections?.find(
    conn => conn.whatsapp_number === TARGET_NUMBER
  );

  console.log(`\n🔍 VERIFICANDO NÚMERO ESPECÍFICO: ${TARGET_NUMBER}`);
  console.log('=' .repeat(50));

  if (targetConnection) {
    console.log(`✅ Número encontrado no backend:`);
    console.log(`   • Número: ${targetConnection.whatsapp_number}`);
    console.log(`   • Status: ${targetConnection.status}`);
    console.log(`   • Nome: ${targetConnection.whatsapp_name || 'N/A'}`);
    
    if (targetConnection.status === 'connected') {
      console.log(`✅ Número está CONECTADO no backend`);
    } else {
      console.log(`❌ Número está DESCONECTADO no backend`);
    }
  } else {
    console.log(`❌ Número NÃO encontrado no backend`);
  }

  // 4. Resumo
  console.log('\n📊 RESUMO');
  console.log('=' .repeat(20));
  console.log(`• Backend acessível: ${backendStatus ? 'Sim' : 'Não'}`);
  console.log(`• Total de conexões: ${backendConnections.connections?.length || 0}`);
  console.log(`• Número ${TARGET_NUMBER} encontrado: ${targetConnection ? 'Sim' : 'Não'}`);
  console.log(`• Número ${TARGET_NUMBER} conectado: ${targetConnection?.status === 'connected' ? 'Sim' : 'Não'}`);

  console.log('\n✅ Verificação concluída!');
}

// Executar verificação
checkBackendOnly().catch(console.error); 