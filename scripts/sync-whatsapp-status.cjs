#!/usr/bin/env node

/**
 * Script para sincronizar status do WhatsApp entre backend e banco
 * Resolve problemas de frontend não atualizando após conectar QR Code
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const backendUrl = 'http://31.97.241.19:3001';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncWhatsAppStatus() {
  console.log('🔄 Iniciando sincronização de status do WhatsApp...\n');

  try {
    // 1. Verificar status do backend
    console.log('📡 Verificando status do backend...');
    const backendStatus = await checkBackendStatus();
    console.log('✅ Backend status:', backendStatus);

    // 2. Verificar conexões no banco
    console.log('\n📊 Verificando conexões no banco...');
    const dbConnections = await getDatabaseConnections();
    console.log('✅ Conexões no banco:', dbConnections.length);

    // 3. Sincronizar status
    console.log('\n🔄 Sincronizando status...');
    const syncResults = await syncStatus(backendStatus, dbConnections);
    
    // 4. Mostrar resultados
    console.log('\n📋 Resultados da sincronização:');
    console.log(`   ✅ Atualizadas: ${syncResults.updated}`);
    console.log(`   ❌ Erros: ${syncResults.errors}`);
    console.log(`   🔍 Verificadas: ${syncResults.checked}`);

    // 5. Verificar se há agentes conectados
    console.log('\n🤖 Verificando agentes conectados...');
    const connectedAgents = await getConnectedAgents();
    
    if (connectedAgents.length > 0) {
      console.log('✅ Agentes conectados:');
      connectedAgents.forEach(agent => {
        console.log(`   - ${agent.name} (${agent.whatsapp_number})`);
      });
    } else {
      console.log('⚠️  Nenhum agente conectado encontrado');
    }

    // 6. Testar webhook
    console.log('\n🌐 Testando webhook...');
    await testWebhook();

    console.log('\n🎉 Sincronização concluída!');
    console.log('\n💡 Dicas:');
    console.log('   - Recarregue o frontend (F5)');
    console.log('   - Verifique se o status aparece atualizado');
    console.log('   - Se não aparecer, verifique o console do navegador');

  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message);
  }
}

async function checkBackendStatus() {
  try {
    // Usar o endpoint de health que retorna todas as sessões
    const response = await fetch(`${backendUrl}/health`);
    if (!response.ok) {
      throw new Error(`Backend não respondeu: ${response.status}`);
    }
    const data = await response.json();
    
    // Converter o formato do health para o formato esperado
    const agents = data.sessions
      .filter(session => session.connected)
      .map(session => ({
        id: session.agentId,
        phoneNumber: session.phoneNumber || 'unknown',
        name: session.name || 'Agente',
        status: session.status,
        connectedAt: session.connectedAt
      }));

    return {
      connected: data.activeSessions > 0,
      agents: agents,
      totalSessions: data.activeSessions,
      sessions: data.sessions
    };
  } catch (error) {
    console.error('❌ Erro ao verificar backend:', error.message);
    return { connected: false, agents: [], totalSessions: 0, sessions: [] };
  }
}

async function getDatabaseConnections() {
  try {
    const { data, error } = await supabase
      .from('agent_whatsapp_connections')
      .select(`
        id,
        agent_id,
        whatsapp_number,
        connection_status,
        created_at,
        updated_at,
        agents (
          id,
          name,
          description
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar conexões:', error.message);
    return [];
  }
}

async function syncStatus(backendStatus, dbConnections) {
  let updated = 0;
  let errors = 0;
  let checked = 0;

  // Se o backend tem agentes conectados, atualizar no banco
  if (backendStatus.agents && backendStatus.agents.length > 0) {
    for (const agent of backendStatus.agents) {
      try {
        checked++;
        
        // Buscar ou criar conexão no banco
        const { data: existingConnection } = await supabase
          .from('agent_whatsapp_connections')
          .select('*')
          .eq('agent_id', agent.id)
          .eq('whatsapp_number', agent.phoneNumber)
          .single();

        if (existingConnection) {
          // Atualizar conexão existente
          const { error: updateError } = await supabase
            .from('agent_whatsapp_connections')
            .update({
              connection_status: 'connected',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingConnection.id);

          if (updateError) {
            console.error(`❌ Erro ao atualizar conexão ${existingConnection.id}:`, updateError.message);
            errors++;
          } else {
            console.log(`✅ Atualizada conexão: ${agent.name} (${agent.phoneNumber})`);
            updated++;
          }
        } else {
          // Criar nova conexão
          const { error: insertError } = await supabase
            .from('agent_whatsapp_connections')
            .insert({
              agent_id: agent.id,
              whatsapp_number: agent.phoneNumber,
              connection_status: 'connected',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            console.error(`❌ Erro ao criar conexão para ${agent.name}:`, insertError.message);
            errors++;
          } else {
            console.log(`✅ Criada nova conexão: ${agent.name} (${agent.phoneNumber})`);
            updated++;
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao processar agente ${agent.id}:`, error.message);
        errors++;
      }
    }
  }

  // Marcar como desconectado agentes que não estão no backend
  const backendAgentIds = backendStatus.agents?.map(a => a.id) || [];
  
  for (const connection of dbConnections) {
    if (connection.connection_status === 'connected' && !backendAgentIds.includes(connection.agent_id)) {
      try {
        checked++;
        
        const { error: updateError } = await supabase
          .from('agent_whatsapp_connections')
          .update({
            connection_status: 'disconnected',
            updated_at: new Date().toISOString()
          })
          .eq('id', connection.id);

        if (updateError) {
          console.error(`❌ Erro ao desconectar ${connection.id}:`, updateError.message);
          errors++;
        } else {
          console.log(`🔌 Desconectado: ${connection.agents?.name || connection.agent_id} (${connection.whatsapp_number})`);
          updated++;
        }
      } catch (error) {
        console.error(`❌ Erro ao desconectar ${connection.id}:`, error.message);
        errors++;
      }
    }
  }

  return { updated, errors, checked };
}

async function getConnectedAgents() {
  try {
    const { data, error } = await supabase
      .from('agent_whatsapp_connections')
      .select(`
        id,
        agent_id,
        whatsapp_number,
        connection_status,
        agents (
          id,
          name,
          description
        )
      `)
      .eq('connection_status', 'connected')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar agentes conectados:', error.message);
    return [];
  }
}

async function testWebhook() {
  try {
    console.log('📤 Testando webhook do WhatsApp...');
    
    const { data, error } = await supabase.functions.invoke('whatsapp-integration/status', {
      body: {}
    });

    if (error) {
      console.error('❌ Erro no webhook:', error.message);
    } else {
      console.log('✅ Webhook funcionando:', data);
    }
  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error.message);
  }
}

async function forceRefresh() {
  console.log('\n🔄 Forçando refresh das conexões...');
  
  try {
    // Limpar cache do frontend forçando nova requisição
    const { data, error } = await supabase
      .from('agent_whatsapp_connections')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao forçar refresh:', error.message);
    } else {
      console.log(`✅ Refresh realizado. ${data.length} conexões encontradas.`);
    }
  } catch (error) {
    console.error('❌ Erro no refresh:', error.message);
  }
}

async function main() {
  console.log('🔧 SCRIPT DE SINCRONIZAÇÃO WHATSAPP\n');
  console.log('Este script vai:');
  console.log('1. Verificar status do backend WhatsApp');
  console.log('2. Sincronizar com o banco de dados');
  console.log('3. Atualizar status das conexões');
  console.log('4. Testar webhook');
  console.log('5. Forçar refresh do frontend\n');

  await syncWhatsAppStatus();
  await forceRefresh();

  console.log('\n🎯 Sincronização completa!');
  console.log('Agora recarregue o frontend (F5) para ver as atualizações.');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  syncWhatsAppStatus,
  checkBackendStatus,
  getDatabaseConnections,
  syncStatus
}; 