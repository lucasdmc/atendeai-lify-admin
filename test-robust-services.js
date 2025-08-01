// ========================================
// TESTE DOS SERVIÇOS ROBUSTOS AI
// ========================================

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

console.log('🔧 TESTANDO SERVIÇOS ROBUSTOS AI');
console.log('====================================');

// Verificar configurações
console.log('📋 1. VERIFICANDO CONFIGURAÇÕES');
console.log('─'.repeat(50));

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Configurado' : '❌ Não configurado');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅ Configurado' : '❌ Não configurado');
console.log('WHATSAPP_META_ACCESS_TOKEN:', process.env.WHATSAPP_META_ACCESS_TOKEN ? '✅ Configurado' : '❌ Não configurado');

// Testar importação dos serviços robustos
console.log('');
console.log('📋 2. TESTANDO IMPORTAÇÃO DOS SERVIÇOS');
console.log('─'.repeat(50));

try {
  // Testar importação do LLMOrchestratorService
  const { LLMOrchestratorService } = await import('./src/services/ai/llmOrchestratorService.js');
  console.log('✅ LLMOrchestratorService importado com sucesso');
  
  // Testar importação do AIOrchestrator
  const { AIOrchestrator } = await import('./src/services/ai/ai-orchestrator.js');
  console.log('✅ AIOrchestrator importado com sucesso');
  
  // Testar importação dos outros serviços
  const { IntentRecognitionService } = await import('./src/services/ai/intentRecognitionService.js');
  console.log('✅ IntentRecognitionService importado com sucesso');
  
  const { RAGEngineService } = await import('./src/services/ai/ragEngineService.js');
  console.log('✅ RAGEngineService importado com sucesso');
  
  const { ConversationMemoryService } = await import('./src/services/ai/conversationMemoryService.js');
  console.log('✅ ConversationMemoryService importado com sucesso');
  
} catch (error) {
  console.error('❌ Erro ao importar serviços robustos:', error.message);
  console.error('Stack:', error.stack);
}

// Testar processamento de mensagem
console.log('');
console.log('📋 3. TESTANDO PROCESSAMENTO DE MENSAGEM');
console.log('─'.repeat(50));

try {
  const { LLMOrchestratorService } = await import('./src/services/ai/llmOrchestratorService.js');
  
  const testRequest = {
    phoneNumber: '5511999999999',
    message: 'Olá, gostaria de agendar uma consulta',
    conversationId: 'test-conversation-123',
    userId: 'test-user'
  };
  
  console.log('🧪 Testando processamento de mensagem...');
  const response = await LLMOrchestratorService.processMessage(testRequest);
  
  console.log('✅ Processamento bem-sucedido!');
  console.log('Resposta:', response.response);
  console.log('Intent:', response.intent);
  console.log('Tools used:', response.toolsUsed);
  
} catch (error) {
  console.error('❌ Erro no processamento:', error.message);
  console.error('Stack:', error.stack);
}

// Testar webhook atual
console.log('');
console.log('📋 4. VERIFICANDO WEBHOOK ATUAL');
console.log('─'.repeat(50));

const webhookContent = await import('fs').then(fs => fs.readFileSync('./routes/webhook.js', 'utf8'));

if (webhookContent.includes('processMessageWithAIDirect')) {
  console.log('⚠️  WEBHOOK ESTÁ USANDO IMPLEMENTAÇÃO SIMPLIFICADA!');
  console.log('   O webhook não está usando os serviços robustos.');
  console.log('   Está usando processMessageWithAIDirect (versão mockada)');
} else {
  console.log('✅ Webhook parece estar usando serviços robustos');
}

if (webhookContent.includes('LLMOrchestratorService.processMessage')) {
  console.log('✅ Webhook está usando LLMOrchestratorService');
} else {
  console.log('❌ Webhook NÃO está usando LLMOrchestratorService');
}

console.log('');
console.log('📋 5. RECOMENDAÇÕES');
console.log('─'.repeat(50));

console.log('🔧 Para corrigir o problema:');
console.log('1. Modificar routes/webhook.js para usar LLMOrchestratorService');
console.log('2. Remover as funções processMessageWithAIDirect e processMessageWithAIRobust');
console.log('3. Importar e usar os serviços robustos diretamente');
console.log('4. Verificar se todas as dependências estão instaladas');

console.log('');
console.log('✅ Teste concluído!'); 