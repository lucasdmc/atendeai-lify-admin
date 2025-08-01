const fs = require('fs');
const path = require('path');

async function updateServerWithEnhancedAI() {
  try {
    console.log('🔧 ATUALIZANDO SERVER.JS COM ENHANCED AI SERVICE');
    console.log('================================================');

    // Ler o server.js atual
    const serverPath = '/root/atendeai-lify-backend/server.js';
    let serverContent = fs.readFileSync(serverPath, 'utf8');

    console.log('📋 Server.js atual carregado');

    // Verificar se já tem EnhancedAIService
    if (serverContent.includes('EnhancedAIService')) {
      console.log('⚠️ EnhancedAIService já está sendo usado');
      return;
    }

    // Substituir import do AIService
    const oldImport = "const AIService = require('./src/services/ai/aiService');";
    const newImport = `const AIService = require('./src/services/ai/aiService');
const { EnhancedAIService } = require('./src/services/ai/enhancedAIService');`;

    if (serverContent.includes(oldImport)) {
      serverContent = serverContent.replace(oldImport, newImport);
      console.log('✅ Import do EnhancedAIService adicionado');
    }

    // Substituir chamada do processMessage
    const oldProcessCall = `const aiResponse = await AIService.processMessage(
              userMessage,
              userPhone,
              process.env.DEFAULT_CLINIC_ID || 'default-clinic'
            );`;

    const newProcessCall = `// Usar EnhancedAIService para melhor qualidade
            const enhancedAI = new EnhancedAIService();
            const aiResponse = await enhancedAI.processMessage(
              userMessage,
              userPhone,
              process.env.DEFAULT_CLINIC_ID || 'default-clinic',
              {
                systemPrompt: 'Você é o Dr. Carlos, assistente virtual da CardioPrime. Seja acolhedor, profissional e útil.',
                enableRAG: true,
                enableMemory: true,
                enablePersonalization: true,
                enableIntentRecognition: true
              }
            );`;

    if (serverContent.includes(oldProcessCall)) {
      serverContent = serverContent.replace(oldProcessCall, newProcessCall);
      console.log('✅ Chamada do EnhancedAIService implementada');
    }

    // Salvar o arquivo atualizado
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Server.js atualizado com EnhancedAIService');

    // Verificar se a atualização foi bem-sucedida
    const updatedContent = fs.readFileSync(serverPath, 'utf8');
    if (updatedContent.includes('EnhancedAIService')) {
      console.log('✅ Verificação: EnhancedAIService encontrado no arquivo');
    } else {
      console.log('❌ Erro: EnhancedAIService não foi adicionado corretamente');
    }

    console.log('\n🎯 ATUALIZAÇÃO CONCLUÍDA!');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Reiniciar o backend');
    console.log('2. Testar com mensagem real');
    console.log('3. Verificar logs para confirmar funcionamento');

  } catch (error) {
    console.error('❌ Erro crítico:', error);
  }
}

updateServerWithEnhancedAI(); 