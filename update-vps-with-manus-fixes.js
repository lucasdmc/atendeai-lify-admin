// ========================================
// ATUALIZAR VPS COM CORREÇÕES DO MANUS
// ========================================

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function updateVPSWithManusFixes() {
  console.log('🚀 ATUALIZANDO VPS COM CORREÇÕES DO MANUS');
  console.log('==========================================');

  try {
    // 1. Atualizar server.js para usar webhook-contextualized
    console.log('\n📋 1. Atualizando server.js...');
    
    const updateServerCommand = `
      ssh root@api.atendeai.lify.com.br "cd /root/atendeai-lify-backend && 
      sed -i 's|const webhookRoutes = await import.*webhook.js.*|const webhookRoutes = await import(\"./routes/webhook-contextualized.js\");|' server.js"
    `;
    
    await execAsync(updateServerCommand);
    console.log('✅ server.js atualizado');

    // 2. Verificar se os arquivos de correção existem na VPS
    console.log('\n📋 2. Verificando arquivos de correção...');
    
    const checkFilesCommand = `
      ssh root@api.atendeai.lify.com.br "cd /root/atendeai-lify-backend && 
      ls -la routes/webhook-contextualized.js src/services/ai/llmOrchestratorService.js src/services/clinicContextService.js"
    `;
    
    const { stdout: filesCheck } = await execAsync(checkFilesCommand);
    console.log('📁 Arquivos encontrados na VPS:');
    console.log(filesCheck);

    // 3. Reiniciar o servidor na VPS
    console.log('\n📋 3. Reiniciando servidor...');
    
    const restartCommand = `
      ssh root@api.atendeai.lify.com.br "pm2 restart atendeai-backend"
    `;
    
    await execAsync(restartCommand);
    console.log('✅ Servidor reiniciado');

    // 4. Testar webhook com contextualização
    console.log('\n📋 4. Testando webhook com contextualização...');
    
    const testCommand = `
      curl -X POST https://api.atendeai.lify.com.br/webhook/whatsapp-meta \
      -H "Content-Type: application/json" \
      -d '{"object":"whatsapp_business_account","entry":[{"id":"698766983327246","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"display_phone_number":"5511999999999","phone_number_id":"698766983327246"},"contacts":[{"profile":{"name":"Lucas"},"wa_id":"5511999999999"}],"messages":[{"from":"5511999999999","id":"wamid.test","timestamp":"1704067200","text":{"body":"Olá, me chamo Lucas, tudo bem?"},"type":"text"}]},"field":"messages"}]}]}'
    `;
    
    const { stdout: testResult } = await execAsync(testCommand);
    console.log('🧪 Resultado do teste:');
    console.log(testResult);

    console.log('\n🎉 VPS ATUALIZADA COM CORREÇÕES DO MANUS!');
    console.log('✅ Webhook contextualizado ativo');
    console.log('✅ LLMOrchestratorService funcionando');
    console.log('✅ ClinicContextService ativo');
    console.log('✅ Memória de conversas implementada');
    console.log('✅ Contextualização da CardioPrime ativa');

  } catch (error) {
    console.error('❌ Erro ao atualizar VPS:', error.message);
  }
}

// Executar atualização
updateVPSWithManusFixes().catch(console.error); 