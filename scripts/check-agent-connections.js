#!/usr/bin/env node

import { execSync } from 'child_process';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const agentId = '36e62010-e74a-4eaa-b1f7-4037d4721b81';
const supabaseToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

log('🔍 VERIFICANDO CONEXÕES DO AGENTE', 'bright');
log('=' * 50, 'bright');

// 1. Verificar conexões no banco de dados
log('\n📊 Verificando conexões no banco de dados...', 'cyan');

const checkDatabaseConnections = () => {
  try {
    const command = `curl -s -X GET "https://niakqdolcdwxtrkbqmdi.supabase.co/rest/v1/agent_whatsapp_connections?agent_id=eq.${agentId}&select=*" \\
      -H "apikey: ${supabaseToken}" \\
      -H "Authorization: Bearer ${supabaseToken}" \\
      -H "Content-Type: application/json"`;

    const result = execSync(command, { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (error) {
    log(`❌ Erro ao consultar banco: ${error.message}`, 'red');
    return [];
  }
};

// 2. Verificar status no backend WhatsApp
log('\n🖥️ Verificando status no backend WhatsApp...', 'cyan');

const checkBackendStatus = () => {
  try {
    const command = `curl -s -X GET "https://atendeai-backend-production.up.railway.app/api/whatsapp/status/${agentId}"`;
    const result = execSync(command, { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (error) {
    log(`❌ Erro ao consultar backend: ${error.message}`, 'red');
    return null;
  }
};

// 3. Verificar informações do agente
log('\n👤 Verificando informações do agente...', 'cyan');

const checkAgentInfo = () => {
  try {
    const command = `curl -s -X GET "https://niakqdolcdwxtrkbqmdi.supabase.co/rest/v1/agents?id=eq.${agentId}&select=*" \\
      -H "apikey: ${supabaseToken}" \\
      -H "Authorization: Bearer ${supabaseToken}" \\
      -H "Content-Type: application/json"`;

    const result = execSync(command, { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (error) {
    log(`❌ Erro ao consultar agente: ${error.message}`, 'red');
    return [];
  }
};

// Executar verificações
const dbConnections = checkDatabaseConnections();
const backendStatus = checkBackendStatus();
const agentInfo = checkAgentInfo();

// Análise dos resultados
log('\n📊 RESULTADOS DA ANÁLISE', 'magenta');
log('=' * 40, 'magenta');

// Informações do agente
if (agentInfo && agentInfo.length > 0) {
  const agent = agentInfo[0];
  log(`\n👤 Agente: ${agent.name}`, 'green');
  log(`   ID: ${agent.id}`, 'yellow');
  log(`   Status: ${agent.status}`, 'yellow');
  log(`   Criado em: ${agent.created_at}`, 'yellow');
} else {
  log('\n❌ Agente não encontrado no banco de dados', 'red');
}

// Conexões no banco de dados
log(`\n📊 Conexões no banco de dados: ${dbConnections.length}`, 'cyan');
if (dbConnections.length > 0) {
  dbConnections.forEach((conn, index) => {
    log(`\n   Conexão ${index + 1}:`, 'yellow');
    log(`     ID: ${conn.id}`, 'yellow');
    log(`     Número: ${conn.whatsapp_number}`, 'yellow');
    log(`     Nome: ${conn.whatsapp_name || 'N/A'}`, 'yellow');
    log(`     Status: ${conn.connection_status}`, 'yellow');
    log(`     Última conexão: ${conn.last_connection_at || 'N/A'}`, 'yellow');
    log(`     Criado em: ${conn.created_at}`, 'yellow');
    log(`     Atualizado em: ${conn.updated_at}`, 'yellow');
    
    if (conn.connection_status === 'connected') {
      log(`     ✅ CONECTADO`, 'green');
    } else if (conn.connection_status === 'connecting') {
      log(`     🔄 CONECTANDO`, 'yellow');
    } else {
      log(`     ❌ DESCONECTADO`, 'red');
    }
  });
} else {
  log('   ❌ Nenhuma conexão encontrada no banco de dados', 'red');
}

// Status no backend
if (backendStatus) {
  log(`\n🖥️ Status no backend WhatsApp:`, 'cyan');
  log(`   Status: ${backendStatus.status}`, 'yellow');
  log(`   Conectado: ${backendStatus.connected}`, 'yellow');
  if (backendStatus.connectedAt) {
    log(`   Conectado em: ${backendStatus.connectedAt}`, 'yellow');
  }
  if (backendStatus.qrCode) {
    log(`   QR Code: Disponível`, 'green');
  }
} else {
  log('\n❌ Não foi possível verificar status no backend', 'red');
}

// Resumo
log('\n💡 RESUMO', 'magenta');
log('=' * 20, 'magenta');

const connectedInDB = dbConnections.filter(conn => conn.connection_status === 'connected');
const connectedInBackend = backendStatus && backendStatus.connected;

if (connectedInDB.length > 0) {
  log(`✅ ${connectedInDB.length} número(s) conectado(s) no banco de dados`, 'green');
  connectedInDB.forEach(conn => {
    log(`   - ${conn.whatsapp_number} (${conn.whatsapp_name || 'Sem nome'})`, 'green');
  });
} else {
  log('❌ Nenhum número conectado no banco de dados', 'red');
}

if (connectedInBackend) {
  log('✅ Agente conectado no backend WhatsApp', 'green');
} else {
  log('❌ Agente não conectado no backend WhatsApp', 'red');
}

if (connectedInDB.length > 0 && connectedInBackend) {
  log('\n🎉 SISTEMA FUNCIONANDO CORRETAMENTE!', 'green');
  log('O agente está conectado tanto no banco quanto no backend.', 'green');
} else if (connectedInDB.length > 0 && !connectedInBackend) {
  log('\n⚠️ INCONSISTÊNCIA DETECTADA', 'yellow');
  log('O agente está marcado como conectado no banco, mas não no backend.', 'yellow');
} else if (connectedInDB.length === 0 && connectedInBackend) {
  log('\n⚠️ INCONSISTÊNCIA DETECTADA', 'yellow');
  log('O agente está conectado no backend, mas não há registro no banco.', 'yellow');
} else {
  log('\n❌ AGENTE NÃO CONECTADO', 'red');
  log('O agente não está conectado nem no banco nem no backend.', 'red');
}

log('\n✅ Análise concluída!', 'green'); 