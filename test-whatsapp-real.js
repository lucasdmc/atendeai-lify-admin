// ========================================
// TESTE WHATSAPP REAL COM SERVIÇOS ROBUSTOS
// ========================================

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

console.log('📱 TESTANDO WHATSAPP REAL COM SERVIÇOS ROBUSTOS');
console.log('================================================');

// Verificar configurações
console.log('📋 1. Verificando configurações...');
console.log('WHATSAPP_META_ACCESS_TOKEN:', process.env.WHATSAPP_META_ACCESS_TOKEN ? '✅ Configurado' : '❌ Não configurado');
console.log('WHATSAPP_META_PHONE_NUMBER_ID:', process.env.WHATSAPP_META_PHONE_NUMBER_ID ? '✅ Configurado' : '❌ Não configurado');

// Importar função de envio do WhatsApp
const { sendWhatsAppTextMessage } = await import('./services/whatsappMetaService.js');

// Testar envio de mensagem
console.log('');
console.log('📋 2. Testando envio de mensagem...');

try {
  // Números corretos
  const chatbotNumber = '554730915628'; // Número do chatbot configurado na Meta
  const userNumber = '5547997192447';   // Seu número pessoal
  
  const messageData = {
    accessToken: process.env.WHATSAPP_META_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_META_PHONE_NUMBER_ID,
    to: userNumber, // Enviando para seu número pessoal
    text: '🧪 Teste dos Serviços Robustos - Se você recebeu esta mensagem, os serviços robustos estão funcionando!'
  };

  console.log('📤 Enviando mensagem de teste...');
  console.log('De:', chatbotNumber);
  console.log('Para:', userNumber);
  const response = await sendWhatsAppTextMessage(messageData);
  
  console.log('✅ Mensagem enviada com sucesso!');
  console.log('Message ID:', response.messages?.[0]?.id);
  console.log('Status:', response.status);
  
} catch (error) {
  console.error('❌ Erro ao enviar mensagem:', error.message);
  console.error('Stack:', error.stack);
}

// Testar processamento com serviços robustos
console.log('');
console.log('📋 3. Testando processamento com serviços robustos...');

try {
  const { LLMOrchestratorService } = await import('./src/services/ai/llmOrchestratorService.ts');
  
  const testRequest = {
    phoneNumber: '5547997192447', // Seu número pessoal
    message: 'Olá, gostaria de agendar uma consulta para amanhã',
    conversationId: 'test-real-123',
    userId: 'test-user'
  };
  
  console.log('🤖 Processando mensagem com LLMOrchestratorService...');
  const response = await LLMOrchestratorService.processMessage(testRequest);
  
  console.log('✅ Processamento concluído!');
  console.log('Resposta:', response.response);
  console.log('Intent:', response.intent?.name);
  console.log('Confiança:', response.intent?.confidence);
  
  // Enviar resposta processada
  if (response.response) {
    console.log('');
    console.log('📤 Enviando resposta processada...');
    
    const responseData = {
      accessToken: process.env.WHATSAPP_META_ACCESS_TOKEN,
      phoneNumberId: process.env.WHATSAPP_META_PHONE_NUMBER_ID,
      to: '5547997192447', // Seu número pessoal
      text: response.response
    };
    
    const sendResponse = await sendWhatsAppTextMessage(responseData);
    console.log('✅ Resposta processada enviada!');
    console.log('Message ID:', sendResponse.messages?.[0]?.id);
  }
  
} catch (error) {
  console.error('❌ Erro no processamento:', error.message);
  console.error('Stack:', error.stack);
}

console.log('');
console.log('🎉 TESTE WHATSAPP REAL CONCLUÍDO!');
console.log('Verifique se você recebeu as mensagens no WhatsApp.'); 