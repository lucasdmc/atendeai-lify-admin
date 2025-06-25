
import { SmartConversationHandler } from './smart-conversation-handler.ts';
import { LiaPersonality } from './lia-personality.ts';
import { shouldRespondQuickly } from './message-analysis.ts';
import { buildContextualPrompt } from './prompt-builder.ts';
import { callOpenAI } from './openai-client.ts';

export async function generateEnhancedAIResponse(
  contextData: any[], 
  recentMessages: any[], 
  message: string, 
  phoneNumber: string,
  userIntent: any,
  supabase: any
): Promise<string> {
  console.log('🤖 === GERAÇÃO DE RESPOSTA IA HUMANIZADA (LIA) ===');
  console.log(`📞 Número: ${phoneNumber}`);
  console.log(`💬 Mensagem: ${message}`);

  // PRIORIDADE ABSOLUTA: Smart Conversation Handler para TODAS as mensagens
  try {
    console.log('🎯 Processando com Smart Conversation Handler (PRIORIDADE ABSOLUTA)...');
    const smartResponse = await SmartConversationHandler.processMessage(phoneNumber, message, supabase);
    
    // O Smart Handler sempre retorna uma resposta válida
    if (smartResponse && smartResponse.length > 5) {
      console.log('✅ Smart Conversation Handler processou com sucesso');
      return smartResponse;
    }
  } catch (error) {
    console.error('❌ Erro no Smart Conversation Handler:', error);
  }

  // FALLBACK: Se Smart Handler falhar completamente, usar sistema antigo
  console.log('⚠️ Smart Handler falhou, usando sistema de fallback');
  
  const isFirstContact = LiaPersonality.isFirstContact(recentMessages);
  console.log(`👋 Primeiro contato: ${isFirstContact ? 'SIM' : 'NÃO'}`);

  // Se é primeiro contato, usar saudação da Lia
  if (isFirstContact) {
    console.log('🎯 Gerando saudação de primeiro contato');
    return LiaPersonality.getGreetingMessage();
  }

  // Para respostas rápidas, usar personality direta
  if (shouldRespondQuickly(message, recentMessages)) {
    console.log('⚡ Resposta rápida detectada');
    return LiaPersonality.getFollowUpResponse(message);
  }

  try {
    const systemPrompt = buildContextualPrompt(contextData, recentMessages, message, phoneNumber);
    const aiResponse = await callOpenAI(systemPrompt, message, supabase);
    
    console.log('✅ Resposta final da Lia:', aiResponse);
    return aiResponse;

  } catch (error) {
    console.error('❌ Erro ao gerar resposta IA:', error);
    return LiaPersonality.getFallbackResponse();
  }
}
