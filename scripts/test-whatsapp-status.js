import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWhatsAppStatus() {
  console.log('🔍 Testando status do WhatsApp...\n');

  try {
    // Testar status
    const { data, error } = await supabase.functions.invoke('whatsapp-integration/status');
    
    if (error) {
      console.error('❌ Erro ao verificar status:', error);
      return;
    }

    console.log('📊 Resposta do servidor:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');

    // Analisar a resposta
    if (data.success) {
      console.log(`✅ Status: ${data.status}`);
      console.log(`📝 Mensagem: ${data.message}`);
      
      if (data.clientInfo) {
        console.log(`📱 Cliente: ${data.clientInfo.name} (${data.clientInfo.number})`);
        console.log(`🕐 Conectado em: ${data.clientInfo.connectedAt}`);
      }
      
      if (data.qrCode) {
        console.log(`📋 QR Code: ${data.qrCode ? 'Presente' : 'Não presente'}`);
      }

      // Verificar se a lógica está correta
      const hasClientInfo = data.clientInfo && data.clientInfo.number;
      const expectedStatus = hasClientInfo ? 'connected' : 'connecting';
      
      console.log(`\n🔍 Análise da lógica:`);
      console.log(`   - Tem clientInfo: ${hasClientInfo ? 'Sim' : 'Não'}`);
      console.log(`   - Status esperado: ${expectedStatus}`);
      console.log(`   - Status atual: ${data.status}`);
      console.log(`   - Status correto: ${data.status === expectedStatus ? '✅' : '❌'}`);
      
      if (data.status !== expectedStatus) {
        console.log(`\n⚠️  Problema detectado: Status deveria ser "${expectedStatus}" mas é "${data.status}"`);
      } else {
        console.log(`\n✅ Lógica funcionando corretamente!`);
      }
    } else {
      console.log('❌ Falha na resposta:', data.error);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testWhatsAppStatus(); 