import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWebhook() {
  console.log('🔍 Testando webhook do WhatsApp...\n');

  try {
    // Simular uma mensagem recebida
    const webhookPayload = {
      event: 'message',
      from: '554799526477@s.whatsapp.net', // Substitua pelo número correto
      message: 'Oi, como você está?',
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    console.log('📤 Enviando payload de teste:');
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
testWebhook(); 