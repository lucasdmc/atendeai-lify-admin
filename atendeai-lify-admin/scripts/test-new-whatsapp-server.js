import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SERVICE_ROLE_KEY não encontrada no ambiente');
  console.log('💡 Execute: export SERVICE_ROLE_KEY=sua_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNewWhatsAppServer() {
  try {
    console.log('🧪 Testando novo servidor WhatsApp...');
    
    const whatsappServerUrl = 'https://lify.magah.com.br';
    console.log(`📡 URL do servidor: ${whatsappServerUrl}`);
    
    // Teste 1: Verificar se o servidor está online
    console.log('\n1️⃣ Testando conectividade básica...');
    try {
      const response = await fetch(`${whatsappServerUrl}/`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Servidor está online!');
        console.log('📊 Resposta:', data);
      } else {
        console.log(`⚠️ Servidor respondeu com status: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Erro ao conectar com o servidor:', error.message);
    }
    
    // Teste 2: Verificar endpoint de status
    console.log('\n2️⃣ Testando endpoint de status...');
    try {
      const response = await fetch(`${whatsappServerUrl}/api/whatsapp/status`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Endpoint de status funcionando!');
        console.log('📊 Status:', data);
      } else {
        console.log(`⚠️ Endpoint de status retornou: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Erro no endpoint de status:', error.message);
    }
    
    // Teste 3: Verificar se as Edge Functions estão configuradas
    console.log('\n3️⃣ Verificando configuração das Edge Functions...');
    try {
      const { data: functions, error } = await supabase.functions.list();
      if (error) {
        console.log('❌ Erro ao listar funções:', error);
      } else {
        console.log('✅ Edge Functions encontradas:');
        functions.forEach(func => {
          console.log(`  - ${func.name}`);
        });
      }
    } catch (error) {
      console.log('❌ Erro ao verificar Edge Functions:', error.message);
    }
    
    // Teste 4: Testar geração de QR Code
    console.log('\n4️⃣ Testando geração de QR Code...');
    try {
      const response = await fetch(`${whatsappServerUrl}/api/whatsapp/generate-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: 'test-agent' })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Endpoint de QR Code funcionando!');
        console.log('📊 Resposta:', data);
      } else {
        console.log(`⚠️ Endpoint de QR Code retornou: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Erro no endpoint de QR Code:', error.message);
    }
    
    console.log('\n🎉 Testes concluídos!');
    
  } catch (error) {
    console.error('❌ Erro geral nos testes:', error);
  }
}

// Executar os testes
testNewWhatsAppServer().catch(console.error); 