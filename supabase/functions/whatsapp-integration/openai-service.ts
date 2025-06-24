
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
  
  // Atualizar contexto da conversa
  const userIntent = ConversationContextManager.detectUserIntent(currentMessage);
  const context = ConversationContextManager.getContext(phoneNumber);
  
  ConversationContextManager.updateContext(phoneNumber, {
    lastUserIntent: userIntent
  });

  // Construir prompt mais natural e humano
  let systemPrompt = `Você é um assistente virtual amigável da nossa clínica médica. Seja natural, empático e prestativo. Use uma linguagem conversacional e humana.

SOBRE A CLÍNICA:`;

  if (contextData && contextData.length > 0) {
    contextData.forEach((item) => {
      if (item.answer) {
        systemPrompt += `\n• ${item.question}: ${item.answer}`;
      }
    });
  } else {
    systemPrompt += `\n• Somos uma clínica médica comprometida com o cuidado e bem-estar dos nossos pacientes.`;
  }

  systemPrompt += `\n\nCOMO VOCÊ DEVE SE COMPORTAR:
✅ Seja natural e conversacional
✅ Use emojis com moderação (1-2 por mensagem)
✅ Seja conciso mas completo
✅ Mostre empatia e interesse genuíno
✅ Varie suas respostas para não repetir
✅ Mantenha um tom acolhedor e profissional

AGENDAMENTOS:
• Para AGENDAR: colete data, horário, tipo de consulta e email
• Para CANCELAR/REAGENDAR: identifique o agendamento existente primeiro
• Para INFORMAÇÕES: seja específico e útil
• Sempre confirme detalhes antes de finalizar

INSTRUÇÕES IMPORTANTES:
• Respostas máximo 3 linhas
• Não repita informações desnecessariamente
• Adapte-se ao contexto da conversa
• Se o usuário está confuso, simplifique
• Seja humano, não robótico`;

  // Construir histórico mais inteligente
  const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

  if (recentMessages && recentMessages.length > 0) {
    // Pegar apenas mensagens relevantes e recentes
    const relevantMessages = recentMessages
      .reverse()
      .slice(0, 6) // Reduzir para manter contexto mais focado
      .filter(msg => msg.content && msg.content.length > 0);
    
    relevantMessages.forEach((msg) => {
      if (msg.content !== currentMessage) {
        messages.push({
          role: msg.message_type === 'received' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    });
  }

  // Adicionar mensagem atual
  messages.push({ role: 'user', content: currentMessage });

  console.log(`💭 Contexto: ${userIntent}, Stage: ${context.conversationStage}`);

  // Gerar resposta com IA
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
          temperature: 0.8, // Aumentar criatividade
          max_tokens: 300, // Reduzir para respostas mais concisas
          presence_penalty: 0.6, // Evitar repetições
          frequency_penalty: 0.4, // Variar vocabulário
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
    console.log('⚠️ OpenAI Key não configurada');
    // Usar respostas naturais baseadas no contexto
    if (userIntent === 'greeting') {
      aiResponse = NaturalResponseGenerator.generateGreeting();
    } else if (userIntent === 'scheduling') {
      aiResponse = NaturalResponseGenerator.generateSchedulingHelp();
    } else {
      aiResponse = NaturalResponseGenerator.generateGenericHelp();
    }
  }

  // Verificar e evitar repetições
  const isRepetitive = ConversationContextManager.checkForRepetition(phoneNumber, aiResponse);
  if (isRepetitive) {
    console.log('🔄 Detectada repetição, gerando variação...');
    aiResponse = ConversationContextManager.generateVariedResponse(phoneNumber, aiResponse);
  }

  // Atualizar contexto com a resposta
  ConversationContextManager.updateContext(phoneNumber, {
    lastBotResponse: aiResponse
  });

  console.log(`💬 Resposta final: ${aiResponse.substring(0, 100)}...`);
  return aiResponse;
}
