// ========================================
// VERIFICAR CONFIGURAÇÃO DO WEBHOOK WHATSAPP
// ========================================

import https from 'https';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = '698766983327246';

async function verifyWhatsAppWebhookConfig() {
  console.log('🔍 VERIFICANDO CONFIGURAÇÃO DO WEBHOOK WHATSAPP');
  console.log('================================================\n');

  try {
    // 1. Verificar se o token está válido
    console.log('🔑 1. Verificando token do WhatsApp...');
    console.log('⚠️  Para verificar o token, você precisa:');
    console.log('   1. Acessar: https://developers.facebook.com/apps/');
    console.log('   2. Ir em: WhatsApp > Getting Started');
    console.log('   3. Copiar o Access Token (começa com EAAS...)');
    console.log('   4. Verificar se não expirou');
    console.log('');

    // 2. Verificar configuração do webhook
    console.log('🌐 2. CONFIGURAÇÃO NECESSÁRIA NO WHATSAPP BUSINESS API:');
    console.log('============================================================');
    console.log('📋 URL do Webhook:');
    console.log('   https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta');
    console.log('');
    console.log('🔑 Token de Verificação:');
    console.log('   atendeai-lify-backend');
    console.log('');
    console.log('📧 Eventos necessários:');
    console.log('   ✅ messages');
    console.log('   ✅ message_deliveries');
    console.log('   ✅ message_reads');
    console.log('');

    // 3. Passos para configurar
    console.log('⚙️ 3. PASSOS PARA CONFIGURAR:');
    console.log('================================');
    console.log('1. Acesse: https://developers.facebook.com/apps/');
    console.log('2. Selecione seu app do WhatsApp Business API');
    console.log('3. Vá em: WhatsApp > API Setup');
    console.log('4. Em "Webhooks", clique em "Configure"');
    console.log('5. Configure:');
    console.log('   - URL: https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta');
    console.log('   - Verify Token: atendeai-lify-backend');
    console.log('   - Selecione eventos: messages, message_deliveries, message_reads');
    console.log('6. Clique em "Verify and Save"');
    console.log('');

    // 4. Teste manual
    console.log('🧪 4. TESTE MANUAL:');
    console.log('===================');
    console.log('Após configurar o webhook:');
    console.log('1. Envie uma mensagem para: +55 11 99999-9999');
    console.log('2. Verifique se recebe resposta automática');
    console.log('3. Verifique logs em: https://railway.app/dashboard');
    console.log('');

    // 5. Verificar logs esperados
    console.log('📊 5. LOGS ESPERADOS:');
    console.log('=====================');
    console.log('Quando uma mensagem chegar, você deve ver nos logs:');
    console.log('');
    console.log('🚨 [Webhook-Contextualizado] WEBHOOK CHAMADO!');
    console.log('[Webhook-Contextualizado] Mensagem recebida: {');
    console.log('  method: "POST",');
    console.log('  body: { object: "whatsapp_business_account", entry: [...] }');
    console.log('}');
    console.log('[Webhook-Contextualizado] Processamento concluído com sucesso');
    console.log('');

    // 6. Troubleshooting
    console.log('🔧 6. TROUBLESHOOTING:');
    console.log('======================');
    console.log('Se não funcionar:');
    console.log('❓ Verificar se a URL está correta no Meta');
    console.log('❓ Verificar se o token de verificação está correto');
    console.log('❓ Verificar se todos os eventos estão selecionados');
    console.log('❓ Verificar se o token do WhatsApp não expirou');
    console.log('❓ Verificar logs do Railway para erros');
    console.log('');

    console.log('✅ VERIFICAÇÃO CONCLUÍDA!');
    console.log('================================================');
    console.log('');
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('1. Configure o webhook no WhatsApp Business API');
    console.log('2. Teste enviando uma mensagem');
    console.log('3. Verifique os logs para confirmar funcionamento');
    console.log('');

  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
}

// Executar verificação
verifyWhatsAppWebhookConfig(); 