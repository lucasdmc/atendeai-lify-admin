#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Atualizando Configurações do Supabase...\n');

// Configurações
const SUPABASE_URL = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';
const WHATSAPP_SERVER_URL = 'http://31.97.241.19:3001';

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function updateSupabaseConfig() {
  console.log('📝 Atualizando configurações...');
  
  try {
    // 1. Verificar se a tabela de configurações existe
    console.log('1️⃣ Verificando tabela de configurações...');
    
    const { data: configs, error: configError } = await supabase
      .from('system_configs')
      .select('*')
      .eq('key', 'whatsapp_server_url');
    
    if (configError && configError.code !== 'PGRST116') {
      console.log('❌ Erro ao verificar configurações:', configError.message);
      return false;
    }
    
    // 2. Atualizar ou criar configuração do WhatsApp
    console.log('2️⃣ Atualizando URL do servidor WhatsApp...');
    
    const { error: upsertError } = await supabase
      .from('system_configs')
      .upsert({
        key: 'whatsapp_server_url',
        value: WHATSAPP_SERVER_URL,
        description: 'URL do servidor WhatsApp na VPS',
        updated_at: new Date().toISOString()
      });
    
    if (upsertError) {
      console.log('❌ Erro ao atualizar configuração:', upsertError.message);
      return false;
    }
    
    console.log('✅ URL do WhatsApp atualizada com sucesso');
    
    // 3. Verificar configurações atuais
    console.log('3️⃣ Verificando configurações atuais...');
    
    const { data: currentConfigs, error: fetchError } = await supabase
      .from('system_configs')
      .select('*');
    
    if (fetchError) {
      console.log('❌ Erro ao buscar configurações:', fetchError.message);
    } else {
      console.log('📋 Configurações atuais:');
      currentConfigs?.forEach(config => {
        console.log(`   ✅ ${config.key}: ${config.value}`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    return false;
  }
}

async function testWhatsAppIntegration() {
  console.log('\n🧪 Testando integração WhatsApp...');
  
  try {
    // Testar endpoint de health
    const healthResponse = await fetch(`${WHATSAPP_SERVER_URL}/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Servidor WhatsApp está online');
      console.log(`   📊 Status: ${healthData.status}`);
      console.log(`   📊 Sessões ativas: ${healthData.activeSessions}`);
    } else {
      console.log(`❌ Servidor retornou status ${healthResponse.status}`);
      return false;
    }
    
    // Testar geração de QR Code
    console.log('\n📱 Testando geração de QR Code...');
    
    const qrResponse = await fetch(`${WHATSAPP_SERVER_URL}/api/whatsapp/generate-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agentId: 'test-agent-integration'
      })
    });
    
    if (qrResponse.ok) {
      const qrData = await qrResponse.json();
      console.log('✅ Geração de QR Code funcionando');
      console.log(`   📊 Status: ${qrData.status}`);
      console.log(`   📊 QR Code gerado: ${qrData.qrCode ? 'Sim' : 'Não'}`);
    } else {
      console.log(`❌ Geração de QR Code falhou: ${qrResponse.status}`);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao testar integração WhatsApp:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando atualização das configurações...\n');
  
  // 1. Atualizar configurações do Supabase
  const configUpdated = await updateSupabaseConfig();
  
  // 2. Testar integração WhatsApp
  const whatsappWorking = await testWhatsAppIntegration();
  
  // 3. Resumo final
  console.log('\n📋 RESUMO DA ATUALIZAÇÃO:');
  console.log('='.repeat(50));
  console.log(`✅ Configurações Supabase: ${configUpdated ? 'Atualizadas' : 'Falhou'}`);
  console.log(`✅ Integração WhatsApp: ${whatsappWorking ? 'Funcionando' : 'Com problemas'}`);
  console.log(`✅ Servidor VPS: ${WHATSAPP_SERVER_URL}`);
  
  if (configUpdated && whatsappWorking) {
    console.log('\n🎉 ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Execute: npm run dev');
    console.log('2. Acesse: http://localhost:8080');
    console.log('3. Vá para a página de Agentes');
    console.log('4. Teste a conexão WhatsApp');
  } else {
    console.log('\n⚠️  ALGUNS PROBLEMAS FORAM IDENTIFICADOS');
    console.log('Verifique as configurações e tente novamente');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  updateSupabaseConfig,
  testWhatsAppIntegration
}; 