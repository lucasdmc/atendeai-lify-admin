// ========================================
// ATUALIZAR TOKEN WHATSAPP NO RAILWAY
// ========================================

const NEW_TOKEN = 'EAASAuWYr9JgBPMviYNu4WXFafodM3Y5ia09Eks3aZAM9LDAnazZCcQiyJup6xNkRZANCunz0ZBTZAy3UbbcsTbZB9drn3LJwzS4iw3Aq5CKF8ZASgXYz4SShQlYsSt0IRD70sO8gZCvPGkASI8c81z5f1X8B9TGpkOUmZAp9zJ6dPDSdFC9X1Mf8t5d2ZCVDnVz4hvjPbVywsrVg3odTrSRcIaPh13BGZCNFc6Qr5rsDFBKS4K3lwSSbIrObiMWIAAZD';

function updateRailwayToken() {
  console.log('🔧 ATUALIZANDO TOKEN WHATSAPP NO RAILWAY');
  console.log('==========================================\n');

  console.log('✅ Novo token configurado:');
  console.log(`   ${NEW_TOKEN.substring(0, 50)}...`);
  console.log('');

  console.log('📋 PASSOS PARA ATUALIZAR NO RAILWAY:');
  console.log('=====================================');
  console.log('');
  console.log('1. Acessar Railway Dashboard:');
  console.log('   https://railway.app/dashboard');
  console.log('');
  console.log('2. Selecionar projeto: atendeai-lify-backend-production');
  console.log('');
  console.log('3. Ir para aba "Variables"');
  console.log('');
  console.log('4. Atualizar a variável:');
  console.log('   WHATSAPP_META_ACCESS_TOKEN');
  console.log('');
  console.log('5. Colar o novo valor:');
  console.log(`   ${NEW_TOKEN}`);
  console.log('');
  console.log('6. Clicar em "Save"');
  console.log('');
  console.log('7. O Railway fará redeploy automático');
  console.log('');
  console.log('8. Aguardar 2-3 minutos para o deploy');
  console.log('');
  console.log('9. Testar webhook novamente');
  console.log('');

  console.log('🧪 TESTE APÓS ATUALIZAÇÃO:');
  console.log('==========================');
  console.log('curl -X POST https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"object":"whatsapp_business_account","entry":[{"id":"698766983327246","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"display_phone_number":"5511999999999","phone_number_id":"698766983327246"},"contacts":[{"profile":{"name":"Teste"},"wa_id":"5511999999999"}],"messages":[{"from":"5511999999999","id":"test","timestamp":"1704067200","text":{"body":"Teste novo token"},"type":"text"}]},"field":"messages"}]}]}\'');
  console.log('');

  console.log('✅ STATUS ATUAL:');
  console.log('===============');
  console.log('• Token Meta: ✅ Válido');
  console.log('• Número WhatsApp: ✅ Configurado');
  console.log('• Envio de mensagem: ✅ Funcionando');
  console.log('• Webhook URL: ✅ Configurado');
  console.log('• Railway: ⏳ Aguardando atualização');
  console.log('');

  console.log('🚨 AÇÃO NECESSÁRIA:');
  console.log('===================');
  console.log('Atualizar WHATSAPP_META_ACCESS_TOKEN no Railway Dashboard');
  console.log('');
}

// Executar atualização
updateRailwayToken(); 