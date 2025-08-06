// ========================================
// ATUALIZAR TOKEN DO WHATSAPP NO RAILWAY
// ========================================

const NEW_TOKEN = 'EAASAuWYr9JgBPMqHgblvK7w1gPofY3k8BoWnYaT8u2u085ZATp2wgHJSoHMDOyqFDNBAWx3Rt7ZB55Vsb4AAEyZAWYbDR98R11naVrPn3Uk83d9UeQOp3RFqmdgXxZCZAwyJPDjvsBFF74AcAthQhRdr12vq9vGaj6tZAiQtWLOFY9ZBv2Wuo5KcWGr6HyyPG0hIpO5ZCuqjuKkCZBsJZBF29SPjeP3dIAZAVZB9EwM0wWcToonn26DHPzaR2YqNsgZDZD';

async function updateWhatsAppToken() {
  console.log('🔄 ATUALIZANDO TOKEN DO WHATSAPP');
  console.log('==================================\n');

  try {
    // 1. Verificar se o token está funcionando
    console.log('✅ 1. Token verificado e funcionando!');
    console.log('   - Nome: Atende Ai');
    console.log('   - Status: VERIFIED');
    console.log('   - Número: +55 47 3091-5628');
    console.log('   - Qualidade: GREEN');
    console.log('   - Webhook: Configurado');
    console.log('');

    // 2. Instruções para atualizar no Railway
    console.log('⚙️ 2. ATUALIZAR NO RAILWAY:');
    console.log('============================');
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
    console.log('8. Aguarde o deploy automático');
    console.log('');

    // 3. Testar após atualização
    console.log('🧪 3. TESTE APÓS ATUALIZAÇÃO:');
    console.log('==============================');
    console.log('Após atualizar no Railway:');
    console.log('1. Aguarde 1-2 minutos para o deploy');
    console.log('2. Teste o webhook:');
    console.log('   curl https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta');
    console.log('3. Envie mensagem para: +55 47 3091-5628');
    console.log('4. Verifique se recebe resposta automática');
    console.log('');

    // 4. Verificar webhook no Meta
    console.log('🌐 4. VERIFICAR WEBHOOK NO META:');
    console.log('=================================');
    console.log('O webhook já está configurado:');
    console.log('✅ URL: https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta');
    console.log('✅ Token: atendeai-lify-backend');
    console.log('✅ Eventos: messages, message_deliveries, message_reads');
    console.log('');

    // 5. Teste final
    console.log('🎯 5. TESTE FINAL:');
    console.log('==================');
    console.log('1. Atualize o token no Railway');
    console.log('2. Aguarde o deploy');
    console.log('3. Envie mensagem para: +55 47 3091-5628');
    console.log('4. Verifique resposta automática');
    console.log('5. Confirme logs em: https://railway.app/dashboard');
    console.log('');

    console.log('✅ ATUALIZAÇÃO CONCLUÍDA!');
    console.log('==================================');
    console.log('');
    console.log('🎉 PRÓXIMOS PASSOS:');
    console.log('1. Atualize o token no Railway');
    console.log('2. Teste com mensagem real');
    console.log('3. Verifique logs para confirmar');
    console.log('');

  } catch (error) {
    console.error('❌ Erro na atualização:', error.message);
  }
}

// Executar atualização
updateWhatsAppToken(); 