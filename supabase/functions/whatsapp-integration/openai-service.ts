
import { openAIApiKey } from './config.ts';
import { ConversationContextManager } from './conversation-context.ts';
import { NaturalResponseGenerator } from './natural-responses.ts';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateAIResponse(
  contextData: any[], 
  recentMessages: any[], 
  currentMessage: string,
  phoneNumber: string
): Promise<string> {
  console.log(`🤖 Gerando resposta da IA para: ${phoneNumber}`);
  
  // Gerenciar contexto da conversa
  const userIntent = ConversationContextManager.detectUserIntent(currentMessage);
  const context = ConversationContextManager.getContext(phoneNumber);
  const shouldGreet = ConversationContextManager.shouldGreet(phoneNumber);
  
  console.log(`🎯 Intenção: ${userIntent}, Stage: ${context.conversationStage}, Deve cumprimentar: ${shouldGreet}`);
  
  // Atualizar contexto
  ConversationContextManager.updateContext(phoneNumber, {
    lastUserIntent: userIntent,
    conversationStage: userIntent === 'scheduling' ? 'scheduling' : 
                      userIntent === 'greeting' ? 'information' : context.conversationStage
  });

  // Se é uma saudação mas já cumprimentou, não repetir
  if (userIntent === 'greeting' && !shouldGreet) {
    ConversationContextManager.markAsGreeted(phoneNumber);
    return NaturalResponseGenerator.generateContextualResponse('general', context.conversationStage);
  }

  // Construir prompt mais contextual
  let systemPrompt = `Você é uma assistente virtual da nossa clínica médica. Seja natural, empática e objetiva.

CONTEXTO DA CLÍNICA:`;

  if (contextData && contextData.length > 0) {
    contextData.forEach((item) => {
      if (item.answer) {
        systemPrompt += `\n• ${item.question}: ${item.answer}`;
      }
    });
  } else {
    systemPrompt += `\n• Somos uma clínica médica focada no cuidado e bem-estar dos pacientes.`;
  }

  systemPrompt += `\n\nCOMPORTAMENTO:
✅ Seja natural e conversacional
✅ Não repita saudações se já cumprimentou
✅ Use emojis moderadamente (1-2 por mensagem)
✅ Respostas concisas (máximo 2-3 linhas)
✅ Adapte-se ao contexto da conversa
✅ Evite repetições desnecessárias

AGENDAMENTOS:
• Para AGENDAR: colete data, horário, tipo de consulta e email
• Para CANCELAR/REAGENDAR: identifique o agendamento primeiro
• Sempre confirme detalhes antes de finalizar

CONTEXTO ATUAL:
• Usuário já foi cumprimentado: ${context.hasGreeted ? 'SIM' : 'NÃO'}
• Estágio da conversa: ${context.conversationStage}
• Última intenção: ${context.lastUserIntent}

INSTRUÇÕES CRÍTICAS:
• NÃO repita informações já ditas
• NÃO cumprimente novamente se já cumprimentou
• Seja progressiva na conversa
• Responda apenas ao que foi perguntado`;

  // Construir histórico inteligente
  const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

  if (recentMessages && recentMessages.length > 0) {
    // Pegar apenas 4 mensagens mais recentes para manter contexto focado
    const relevantMessages = recentMessages
      .reverse()
      .slice(0, 4)
      .filter(msg => msg.content && msg.content.length > 0 && msg.content !== currentMessage);
    
    relevantMessages.forEach((msg) => {
      messages.push({
        role: msg.message_type === 'received' ? 'user' : 'assistant',
        content: msg.content
      });
    });
  }

  // Adicionar mensagem atual
  messages.push({ role: 'user', content: currentMessage });

  console.log(`💭 Total de mensagens no contexto: ${messages.length}`);

  let aiResponse = '';
  
  if (openAIApiKey) {
    try {
      console.log('🔄 Chamando OpenAI API...');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
          max_tokens: 200, // Reduzir ainda mais para respostas concisas
          presence_penalty: 0.8, // Aumentar para evitar repetições
          frequency_penalty: 0.6,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.choices[0].message.content;
        console.log('✅ Resposta IA gerada');
      } else {
        console.error('❌ Erro na OpenAI API:', response.status);
        aiResponse = NaturalResponseGenerator.generateErrorResponse();
      }
    } catch (error) {
      console.error('❌ Erro ao chamar OpenAI:', error);
      aiResponse = NaturalResponseGenerator.generateErrorResponse();
    }
  } else {
    console.log('⚠️ OpenAI Key não configurada, usando respostas padrão');
    
    if (userIntent === 'greeting' && shouldGreet) {
      aiResponse = NaturalResponseGenerator.generateGreeting(undefined, shouldGreet);
      ConversationContextManager.markAsGreeted(phoneNumber);
    } else if (userIntent === 'scheduling') {
      aiResponse = NaturalResponseGenerator.generateSchedulingHelp(!context.hasGreeted);
    } else {
      aiResponse = NaturalResponseGenerator.generateContextualResponse(userIntent, context.conversationStage);
    }
  }

  // Verificar repetições antes de retornar
  const isRepetitive = ConversationContextManager.checkForRepetition(phoneNumber, aiResponse);
  if (isRepetitive) {
    console.log('🔄 Repetição detectada, gerando variação...');
    aiResponse = ConversationContextManager.generateVariedResponse(phoneNumber, aiResponse);
  }

  // Marcar como cumprimentado se foi uma saudação
  if (userIntent === 'greeting') {
    ConversationContextManager.markAsGreeted(phoneNumber);
  }

  // Atualizar contexto com a resposta
  ConversationContextManager.updateContext(phoneNumber, {
    lastBotResponse: aiResponse
  });

  console.log(`💬 Resposta final: ${aiResponse.substring(0, 100)}...`);
  return aiResponse;
}
