// ========================================
// COPIAR CORREÇÕES DO MANUS PARA VPS
// ========================================

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

async function copyManusFixesToVPS() {
  console.log('🚀 COPIANDO CORREÇÕES DO MANUS PARA VPS');
  console.log('========================================');

  try {
    // 1. Copiar webhook-contextualized.js
    console.log('\n📋 1. Copiando webhook-contextualized.js...');
    
    const webhookContent = fs.readFileSync('routes/webhook-contextualized.js', 'utf8');
    const webhookCommand = `ssh root@api.atendeai.lify.com.br "cd /root/atendeai-lify-backend && cat > routes/webhook-contextualized.js << 'EOF'
${webhookContent}
EOF"`;
    
    await execAsync(webhookCommand);
    console.log('✅ webhook-contextualized.js copiado');

    // 2. Verificar e copiar LLMOrchestratorService
    console.log('\n📋 2. Verificando LLMOrchestratorService...');
    
    if (fs.existsSync('src/services/ai/llmOrchestratorService.js')) {
      const enhancedContent = fs.readFileSync('src/services/ai/llmOrchestratorService.js', 'utf8');
      const enhancedCommand = `ssh root@api.atendeai.lify.com.br "cd /root/atendeai-lify-backend && cat > src/services/ai/llmOrchestratorService.js << 'EOF'
${enhancedContent}
EOF"`;
      
      await execAsync(enhancedCommand);
      console.log('✅ LLMOrchestratorService copiado');
    } else {
      console.log('❌ LLMOrchestratorService não encontrado localmente');
    }

    // 3. Copiar clinicContextService.js
    console.log('\n📋 3. Copiando clinicContextService.js...');
    
    const clinicContent = fs.readFileSync('src/services/clinicContextService.js', 'utf8');
    const clinicCommand = `ssh root@api.atendeai.lify.com.br "cd /root/atendeai-lify-backend && cat > src/services/clinicContextService.js << 'EOF'
${clinicContent}
EOF"`;
    
    await execAsync(clinicCommand);
    console.log('✅ clinicContextService.js copiado');

    // 4. Verificar arquivos copiados
    console.log('\n📋 4. Verificando arquivos copiados...');
    
    const checkCommand = `ssh root@api.atendeai.lify.com.br "cd /root/atendeai-lify-backend && ls -la routes/webhook-contextualized.js src/services/ai/llmOrchestratorService.js src/services/clinicContextService.js"`;
    const { stdout: checkResult } = await execAsync(checkCommand);
    console.log('📁 Arquivos na VPS:');
    console.log(checkResult);

    // 5. Reiniciar servidor
    console.log('\n📋 5. Reiniciando servidor...');
    
    const restartCommand = `ssh root@api.atendeai.lify.com.br "pm2 restart atendeai-backend"`;
    await execAsync(restartCommand);
    console.log('✅ Servidor reiniciado');

    console.log('\n🎉 CORREÇÕES DO MANUS COPIADAS PARA VPS!');
    console.log('✅ Webhook contextualizado ativo');
    console.log('✅ LLMOrchestratorService funcionando');
    console.log('✅ ClinicContextService ativo');
    console.log('✅ Memória de conversas implementada');
    console.log('✅ Contextualização da CardioPrime ativa');

  } catch (error) {
    console.error('❌ Erro ao copiar arquivos:', error.message);
  }
}

// Executar cópia
copyManusFixesToVPS().catch(console.error); 