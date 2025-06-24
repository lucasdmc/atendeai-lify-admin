
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
  phoneNumber: string,
  personalizationContext?: string,
  userIntent?: any
): Promise<string> {
  console.log(`🤖 Gerando resposta da IA para: ${phoneNumber}`);
  
  // Gerenciar contexto da conversa
  const context = ConversationContextManager.getContext(phoneNumber);
  const shouldGreet = ConversationContextManager.shouldGreet(phoneNumber);
  
  // Analisar contexto histórico da conversa
  const conversationAnalysis = ConversationContextManager.analyzeConversationContext(phoneNumber);
  
  console.log(`🎯 Intenção: ${userIntent?.primary}, Confiança: ${userIntent?.confidence}, Deve cumprimentar: ${shouldGreet}`);
  console.log(`📊 Análise da conversa:`, conversationAnalysis);
  
  // Adicionar mensagem do usuário ao histórico
  ConversationContextManager.addToHistory(phoneNumber, currentMessage, 'user', userIntent?.primary);
  
  // Atualizar contexto
  ConversationContextManager.updateContext(phoneNumber, {
    lastUserIntent: userIntent?.primary,
    conversationStage: userIntent?.primary === 'scheduling' ? 'scheduling' : 
                      userIntent?.primary === 'greeting' ? 'information' : context.conversationStage
  });

  // Se é uma saudação mas já cumprimentou, não repetir
  if (userIntent?.primary === 'greeting' && !shouldGreet) {
    ConversationContextManager.markAsGreeted(phoneNumber);
    return NaturalResponseGenerator.generateContextualResponse('general', context.conversationStage);
  }

  // Construir prompt mais contextual e personalizado
  let systemPrompt = `Você é uma assistente virtual especializada em atendimento de clínica médica. Seja natural, empática e mantenha sempre o foco na saúde e bem-estar dos pacientes.

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

  // Adicionar personalização
  if (personalizationContext) {
    systemPrompt += `\n\nPERSONALIZAÇÃO DO USUÁRIO:
${personalizationContext}`;
  }

  systemPrompt += `\n\nCOMPORTAMENTO E PERSONALIDADE:
✅ Seja uma atendente profissional de clínica médica
✅ Mantenha tom acolhedor e empático 
✅ Use linguagem clara e acessível sobre saúde
✅ Seja proativa em oferecer ajuda médica
✅ Respostas concisas e relevantes (2-3 linhas máximo)
✅ Use emojis relacionados à saúde moderadamente (🩺👩‍⚕️📅💊)
✅ Não repita informações já mencionadas
✅ Continue conversas naturalmente baseado no histórico
✅ Valide dados fornecidos pelo usuário
✅ Ofereça sugestões quando necessário

AGENDAMENTOS MÉDICOS:
• Para AGENDAR: colete data, horário, especialidade médica e email
• Para CANCELAR/REAGENDAR: identifique o agendamento primeiro
• Sempre confirme detalhes médicos antes de finalizar
• Ofereça opções de especialidades disponíveis
• Valide dados inseridos (datas, horários, emails)

ANÁLISE DO CONTEXTO ATUAL:
• Usuário já foi cumprimentado: ${context.hasGreeted ? 'SIM' : 'NÃO'}
• Estágio da conversa: ${context.conversationStage}
• Fluxo da conversa: ${conversationAnalysis.conversationFlow}
• Contexto de agendamento: ${conversationAnalysis.hasAppointmentContext ? 'SIM' : 'NÃO'}
• Última intenção: ${context.lastUserIntent}`;

  // Adicionar análise de intenção se disponível
  if (userIntent) {
    systemPrompt += `\n• Intenção atual: ${userIntent.primary} (confiança: ${userIntent.confidence})`;
    
    if (userIntent.entities && Object.keys(userIntent.entities).length > 0) {
      systemPrompt += `\n• Entidades detectadas: ${JSON.stringify(userIntent.entities)}`;
    }
  }

  // Se há contexto de agendamento, adicionar ao prompt
  if (conversationAnalysis.hasAppointmentContext) {
    systemPrompt += `\n• IMPORTANTE: Esta conversa já tem contexto de agendamento médico ativo`;
  }

  // Se há menções anteriores importantes, incluir
  if (conversationAnalysis.userMentions.length > 0) {
    systemPrompt += `\n• Menções recentes do paciente: ${conversationAnalysis.userMentions.slice(-3).join(', ')}`;
  }

  systemPrompt += `\n\nINSTRUÇÕES CRÍTICAS:
• NÃO repita informações já ditas na conversa
• NÃO cumprimente novamente se já cumprimentou
• Continue a conversa de forma natural baseada no histórico
• Responda progressivamente, construindo sobre o que já foi discutido
• Mantenha sempre o foco na área da saúde e medicina
• Valide sempre os dados fornecidos pelo usuário
• Ofereça alternativas quando algo não for possível
• Seja empática com problemas de saúde`;

  // Construir histórico inteligente
  const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

  // Priorizar histórico do contexto local (mais recente e estruturado)
  const localHistory = ConversationContextManager.getRecentHistory(phoneNumber, 8);
  
  if (localHistory.length > 0) {
    console.log(`💭 Usando histórico local: ${localHistory.length} mensagens`);
    localHistory.forEach((msg) => {
      if (msg.content && msg.content.length > 0) {
        messages.push({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    });
  } else if (recentMessages && recentMessages.length > 0) {
    // Fallback para mensagens do banco se não houver histórico local
    console.log(`💭 Usando histórico do banco: ${recentMessages.length} mensagens`);
    const relevantMessages = recentMessages
      .reverse()
      .slice(0, 6)
      .filter(msg => msg.content && msg.content.length > 0 && msg.content !== currentMessage);
    
    relevantMessages.forEach((msg) => {
      messages.push({
        role: msg.message_type === 'received' ? 'user' : 'assistant',
        content: msg.content
      });
    });
  }

  // Adicionar mensagem atual (se não estiver já no histórico)
  if (!localHistory.some(msg => msg.content === currentMessage)) {
    messages.push({ role: 'user', content: currentMessage });
  }

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
          max_tokens: 150,
          presence_penalty: 0.9, // Aumentar para evitar repetições
          frequency_penalty: 0.8,
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
    
    if (userIntent?.primary === 'greeting' && shouldGreet) {
      aiResponse = NaturalResponseGenerator.generateGreeting(undefined, shouldGreet);
      ConversationContextManager.markAsGreeted(phoneNumber);
    } else if (userIntent?.primary === 'scheduling') {
      aiResponse = NaturalResponseGenerator.generateSchedulingHelp(!context.hasGreeted);
    } else {
      aiResponse = NaturalResponseGenerator.generateContextualResponse(userIntent?.primary || 'general', context.conversationStage);
    }
  }

  // Verificar repetições antes de retornar
  const isRepetitive = ConversationContextManager.checkForRepetition(phoneNumber, aiResponse);
  if (isRepetitive) {
    console.log('🔄 Repetição detectada, gerando variação...');
    aiResponse = ConversationContextManager.generateVariedResponse(phoneNumber, aiResponse);
  }

  // Marcar como cumprimentado se foi uma saudação
  if (userIntent?.primary === 'greeting') {
    ConversationContextManager.markAsGreeted(phoneNumber);
  }

  console.log(`💬 Resposta final: ${aiResponse.substring(0, 100)}...`);
  return aiResponse;
}
