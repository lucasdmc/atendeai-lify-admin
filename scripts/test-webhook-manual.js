import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWebhookManual() {
  console.log('🔍 Testando webhook manual com payload real...\n');

  try {
    // Payload exato que está sendo recebido
    const webhookPayload = {
      "event": "message.received",
      "data": {
        "from": "554797192447@s.whatsapp.net",
        "message": "Olá",
        "timestamp": 1751567312,
        "pushName": "Unknown",
        "messageId": "3A6B2F4744FB4F92405D",
        "type": "text"
      }
    };

    console.log('📤 Enviando payload real:');
    console.log(JSON.stringify(webhookPayload, null, 2));
    console.log('\n');

    // Chamar o webhook
    const { data, error } = await supabase.functions.invoke('whatsapp-integration/webhook', {
      body: webhookPayload
    });
    
    if (error) {
      console.error('❌ Erro ao chamar webhook:', error);
      return;
    }

    console.log('📥 Resposta do webhook:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testWebhookManual(); 