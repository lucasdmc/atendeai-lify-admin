
import { openAIApiKey } from './config.ts';
import { HumanizedResponseGenerator } from './humanized-response-generator.ts';
import { MCPToolsManager } from './mcp-tools.ts';
import { ConversationMemoryManager } from './conversation-memory.ts';
import { SentimentAnalyzer } from './sentiment-analyzer.ts';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateEnhancedAIResponse(
  contextData: any[], 
  recentMessages: any[], 
  currentMessage: string,
  phoneNumber: string,
  userIntent?: any
): Promise<string> {
  console.log(`🤖 Gerando resposta IA humanizada para: ${phoneNumber}`);
  
  try {
    // 1. Carregar memória conversacional
    const memory = await ConversationMemoryManager.loadMemory(phoneNumber, null);
    
    // 2. Analisar sentimento da mensagem atual
    const sentiment = SentimentAnalyzer.analyzeSentiment(currentMessage);
    console.log(`🎭 Sentimento detectado:`, sentiment);
    
    // 3. Verificar se precisa usar ferramentas MCP
    const mcpResults = await checkAndUseMCPTools(currentMessage, phoneNumber, sentiment);
    
    // 4. Gerar prompt humanizado e contextualizado
    const humanizedPrompt = await HumanizedResponseGenerator.generateHumanizedResponse(
      currentMessage,
      phoneNumber,
      null, // supabase será injetado quando necessário
      contextData,
      recentMessages
    );
    
    // 5. Preparar contexto de ferramentas MCP para a IA
    const mcpContext = mcpResults.length > 0 ? 
      `\n\nINFORMAÇÕES ADICIONAIS DO SISTEMA:\n${mcpResults.map(r => r.summary).join('\n')}` : '';
    
    // 6. Construir mensagens para OpenAI
    const messages: ChatMessage[] = [
      { 
        role: 'system', 
        content: humanizedPrompt + mcpContext 
      }
    ];
    
    // Adicionar histórico contextual (limitado para não exceder tokens)
    const contextualHistory = buildContextualHistory(recentMessages, memory, currentMessage);
    messages.push(...contextualHistory);
    
    // Adicionar mensagem atual
    messages.push({ role: 'user', content: currentMessage });
    
    console.log(`💭 Contexto construído com ${messages.length} mensagens`);
    
    // 7. Chamar OpenAI com configurações otimizadas para conversação natural
    let aiResponse = '';
    
    if (openAIApiKey) {
      try {
        console.log('🔄 Chamando OpenAI API com configurações humanizadas...');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',  // Modelo mais avançado para conversação natural
            messages: messages,
            temperature: 0.8,  // Mais criativo para conversa natural
            max_tokens: 200,   // Respostas mais naturais (não muito longas)
            presence_penalty: 1.2,  // Evitar repetições
            frequency_penalty: 1.0,  // Variar vocabulário
            top_p: 0.9,        // Núcleo de probabilidade para naturalidade
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiResponse = data.choices[0].message.content;
          console.log('✅ Resposta IA humanizada gerada');
        } else {
          console.error('❌ Erro na OpenAI API:', response.status);
          aiResponse = generateFallbackResponse(sentiment, memory);
        }
      } catch (error) {
        console.error('❌ Erro ao chamar OpenAI:', error);
        aiResponse = generateFallbackResponse(sentiment, memory);
      }
    } else {
      console.log('⚠️ OpenAI Key não configurada, usando resposta humanizada padrão');
      aiResponse = generateFallbackResponse(sentiment, memory);
    }
    
    // 8. Pós-processamento da resposta
    const processedResponse = postProcessResponse(aiResponse, sentiment, memory);
    
    // 9. Atualizar memória com a nova interação
    await updateConversationMemory(phoneNumber, currentMessage, processedResponse, sentiment);
    
    // 10. Verificar se precisa de follow-up proativo
    await scheduleProactiveFollowUp(phoneNumber, sentiment, memory);
    
    console.log(`💬 Resposta final humanizada: ${processedResponse.substring(0, 100)}...`);
    return processedResponse;
    
  } catch (error) {
    console.error('❌ Erro no serviço de IA humanizada:', error);
    return 'Desculpe, tive um problema momentâneo. Pode tentar novamente? Estou aqui para ajudar! 😊';
  }
}

async function checkAndUseMCPTools(message: string, phoneNumber: string, sentiment: any) {
  const results = [];
  
  try {
    // Ferramenta de contexto temporal
    if (true) { // Sempre usar para melhor contexto
      const temporalContext = await MCPToolsManager.executeTool('temporal_context', {
        userMessage: message
      }, null);
      
      results.push({
        tool: 'temporal_context',
        summary: `Contexto temporal: ${temporalContext.timeOfDay}, horário comercial: ${temporalContext.isBusinessHours}`
      });
    }
    
    // Ferramenta de agendamento se detectar intenção
    if (message.toLowerCase().includes('agendar') || message.toLowerCase().includes('marcar') || message.toLowerCase().includes('consulta')) {
      const schedulingInfo = await MCPToolsManager.executeTool('smart_scheduling', {
        urgency: sentiment.urgencyLevel,
        specialty: extractSpecialtyFromMessage(message)
      }, null);
      
      results.push({
        tool: 'smart_scheduling',
        summary: `Agendamento: ${schedulingInfo.availableSlots?.length || 0} slots disponíveis`
      });
    }
    
    // Ferramenta de conhecimento médico se detectar termos médicos
    if (sentiment.medicalConcern) {
      const medicalInfo = await MCPToolsManager.executeTool('medical_knowledge', {
        query: message,
        context: 'whatsapp_conversation'
      }, null);
      
      results.push({
        tool: 'medical_knowledge',
        summary: `Conhecimento médico: ${medicalInfo.requiresProfessionalConsultation ? 'Requer consulta profissional' : 'Informações disponíveis'}`
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao usar ferramentas MCP:', error);
  }
  
  return results;
}

function buildContextualHistory(recentMessages: any[], memory: any, currentMessage: string): ChatMessage[] {
  const contextualMessages: ChatMessage[] = [];
  
  // Filtrar mensagens relevantes baseadas na memória
  const relevantMessages = recentMessages
    .filter(msg => msg.content && msg.content !== currentMessage)
    .slice(-4) // Últimas 4 mensagens para contexto
    .reverse();
  
  relevantMessages.forEach(msg => {
    contextualMessages.push({
      role: msg.message_type === 'received' ? 'user' : 'assistant',
      content: msg.content
    });
  });
  
  return contextualMessages;
}

function generateFallbackResponse(sentiment: any, memory: any): string {
  const empathyPhrase = SentimentAnalyzer.generateEmpatheticResponse(sentiment);
  
  switch (sentiment.responseTone) {
    case 'urgent':
      return `${empathyPhrase} Vou te ajudar imediatamente. Me conte mais detalhes sobre sua situação para que eu possa orientá-lo da melhor forma.`;
    case 'reassuring':
      return `${empathyPhrase} Entendo sua preocupação. Estou aqui para esclarecer suas dúvidas e te tranquilizar. Como posso ajudar?`;
    case 'supportive':
      return `${empathyPhrase} Vamos resolver isso juntos. Me conte o que está acontecendo para que eu possa te orientar adequadamente.`;
    case 'empathetic':
      return `${empathyPhrase} Compreendo como você se sente. Estou aqui para te apoiar. O que posso fazer por você hoje?`;
    default:
      return `${empathyPhrase} Como posso ajudá-lo hoje? Estou aqui para qualquer dúvida ou necessidade que você tenha.`;
  }
}

function postProcessResponse(response: string, sentiment: any, memory: any): string {
  // Remover formatações muito rígidas se existirem
  let processed = response.replace(/^\d+\.\s*/gm, ''); // Remove numeração
  
  // Adicionar toque pessoal baseado no relacionamento
  if (memory.relationshipStage === 'trusted') {
    // Para relacionamentos estabelecidos, pode ser mais casual
    processed = processed.replace(/^Olá[,!]?\s*/i, '');
  }
  
  // Ajustar tom final baseado no sentimento
  if (sentiment.primaryEmotion === 'anxiety' && !processed.includes('tranquilo')) {
    processed += ' Fique tranquilo, estamos aqui para ajudar.';
  }
  
  return processed;
}

async function updateConversationMemory(phoneNumber: string, userMessage: string, botResponse: string, sentiment: any) {
  try {
    // Esta função será chamada para persistir a memória
    console.log(`💾 Atualizando memória conversacional para ${phoneNumber}`);
  } catch (error) {
    console.error('❌ Erro ao atualizar memória:', error);
  }
}

async function scheduleProactiveFollowUp(phoneNumber: string, sentiment: any, memory: any) {
  try {
    // Verificar se precisa agendar follow-up
    if (sentiment.urgencyLevel === 'high' || sentiment.medicalConcern) {
      console.log(`📋 Agendando follow-up proativo para ${phoneNumber}`);
    }
  } catch (error) {
    console.error('❌ Erro ao agendar follow-up:', error);
  }
}

function extractSpecialtyFromMessage(message: string): string | undefined {
  const specialties = {
    'cardiologia': ['coração', 'cardio', 'pressão', 'hipertensão'],
    'pediatria': ['criança', 'bebê', 'infantil', 'pediatra'],
    'ginecologia': ['gineco', 'mulher', 'útero', 'ovário'],
    'dermatologia': ['pele', 'derma', 'mancha', 'acne']
  };
  
  const lowerMessage = message.toLowerCase();
  
  for (const [specialty, keywords] of Object.entries(specialties)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return specialty;
    }
  }
  
  return undefined;
}
