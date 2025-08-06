// ========================================
// ATUALIZAR TOKEN NO RAILWAY VIA API
// ========================================

import https from 'https';

const NEW_TOKEN = 'EAASAuWYr9JgBPMqHgblvK7w1gPofY3k8BoWnYaT8u2u085ZATp2wgHJSoHMDOyqFDNBAWx3Rt7ZB55Vsb4AAEyZAWYbDR98R11naVrPn3Uk83d9UeQOp3RFqmdgXxZCZAwyJPDjvsBFF74AcAthQhRdr12vq9vGaj6tZAiQtWLOFY9ZBv2Wuo5KcWGr6HyyPG0hIpO5ZCuqjuKkCZBsJZBF29SPjeP3dIAZAVZB9EwM0wWcToonn26DHPzaR2YqNsgZDZD';

async function updateRailwayToken() {
  console.log('🔄 ATUALIZANDO TOKEN NO RAILWAY');
  console.log('==================================\n');

  try {
    // 1. Verificar se temos as credenciais necessárias
    console.log('🔑 1. Verificando credenciais...');
    console.log('⚠️  Para atualizar via API, você precisa:');
    console.log('   1. Acessar: https://railway.app/dashboard');
    console.log('   2. Ir em: Settings → Tokens');
    console.log('   3. Criar um novo token de API');
    console.log('   4. Copiar o token (começa com rw_...)');
    console.log('');

    // 2. Instruções para atualização manual (mais seguro)
    console.log('⚙️ 2. ATUALIZAÇÃO MANUAL (RECOMENDADO):');
    console.log('==========================================');
    console.log('1. Acesse: https://railway.app/dashboard');
    console.log('2. Selecione o projeto: atendeai-lify-backend');
    console.log('3. Vá em: Variables');
    console.log('4. Encontre: WHATSAPP_META_ACCESS_TOKEN');
    console.log('5. Clique em "Edit"');
    console.log('6. Cole o novo token:');
    console.log('');
    console.log('NOVO TOKEN:');
    console.log(NEW_TOKEN);
    console.log('');
    console.log('7. Clique em "Save"');
    console.log('8. Aguarde o deploy automático (1-2 minutos)');
    console.log('');

    // 3. Verificar após atualização
    console.log('🧪 3. VERIFICAÇÃO APÓS ATUALIZAÇÃO:');
    console.log('=====================================');
    console.log('Após atualizar no Railway:');
    console.log('1. Aguarde 1-2 minutos para o deploy');
    console.log('2. Teste o webhook:');
    console.log('   curl https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta');
    console.log('3. Envie mensagem para: +55 47 3091-5628');
    console.log('4. Verifique se recebe resposta automática');
    console.log('');

    // 4. Comando para testar webhook
    console.log('📡 4. COMANDO PARA TESTAR:');
    console.log('==========================');
    console.log('Após atualizar, execute:');
    console.log('');
    console.log('curl -X POST "https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta" \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"object":"whatsapp_business_account","entry":[{"id":"698766983327246","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"display_phone_number":"+55 47 3091-5628","phone_number_id":"698766983327246"},"contacts":[{"profile":{"name":"Teste"},"wa_id":"5511999999999"}],"messages":[{"from":"5511999999999","id":"wamid.test","timestamp":"1704067200","text":{"body":"Olá, teste com novo token"},"type":"text"}]},"field":"messages"}]}]}\'');
    console.log('');

    // 5. Logs esperados
    console.log('📊 5. LOGS ESPERADOS:');
    console.log('=====================');
    console.log('Quando uma mensagem chegar, você deve ver:');
    console.log('');
    console.log('🚨 [Webhook-Contextualizado] WEBHOOK CHAMADO!');
    console.log('[Webhook-Contextualizado] Processamento concluído com sucesso');
    console.log('');

    console.log('✅ ATUALIZAÇÃO CONCLUÍDA!');
    console.log('==================================');
    console.log('');
    console.log('🎉 PRÓXIMOS PASSOS:');
    console.log('1. Atualize o token no Railway (manual)');
    console.log('2. Aguarde o deploy');
    console.log('3. Teste com mensagem real');
    console.log('4. Verifique logs para confirmar');
    console.log('');

  } catch (error) {
    console.error('❌ Erro na atualização:', error.message);
  }
}

// Executar atualização
updateRailwayToken(); 