
import { openAIApiKey } from './config.ts';
import { LiaPersonality } from './lia-personality.ts';
import { MCPToolsProcessor } from './mcp-tools.ts';

// Função utilitária para verificar se deve responder rapidamente
function shouldRespondQuickly(message: string, recentMessages: any[]): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Respostas rápidas para mensagens simples
  const quickResponseTriggers = [
    'oi', 'olá', 'hi', 'hello',
    'agend', 'consulta', 'marcar',
    'psicolog', 'cardio', 'dermat',
    'obrigad', 'valeu', 'ok'
  ];
  
  return quickResponseTriggers.some(trigger => lowerMessage.includes(trigger));
}

export async function generateEnhancedAIResponse(
  contextData: any[],
  recentMessages: any[],
  message: string,
  phoneNumber: string,
  userIntent?: any,
  supabase?: any
): Promise<string> {
  console.log('🤖 === GERAÇÃO DE RESPOSTA IA HUMANIZADA (LIA) ===');
  console.log(`📞 Número: ${phoneNumber}`);
  console.log(`💬 Mensagem: ${message}`);
  
  if (!openAIApiKey) {
    console.error('❌ OPENAI_API_KEY não configurada');
    return LiaPersonality.getFallbackResponse();
  }

  try {
    // Verificar se é primeira mensagem baseado no histórico real
    const isFirstContact = !recentMessages || recentMessages.length === 0 || 
                          recentMessages.every(msg => msg.message_type === 'received');
    console.log(`👋 Primeiro contato: ${isFirstContact ? 'SIM' : 'NÃO'}`);

    // Se é primeiro contato, responder diretamente com saudação
    if (isFirstContact) {
      console.log('🎯 Retornando saudação inicial da Lia...');
      return LiaPersonality.getGreetingMessage();
    }

    // Analisar histórico para evitar repetições
    const lastBotMessages = recentMessages
      .filter(msg => msg.message_type === 'sent')
      .slice(0, 3)
      .map(msg => msg.content);

    // Verificar se é agendamento e usar MCP se necessário
    const isAppointmentRequest = message.toLowerCase().includes('agend') || 
                                message.toLowerCase().includes('consulta') || 
                                message.toLowerCase().includes('marcar');

    // Gerar prompt contextual da Lia com histórico
    const conversationContext = recentMessages.slice(-6).map(msg => 
      `${msg.message_type === 'received' ? 'Usuário' : 'Lia'}: ${msg.content}`
    ).join('\n');

    const liaPrompt = `Você é a Lia, assistente virtual da clínica médica. 

PERSONALIDADE:
- Natural, empática e acolhedora como uma secretária experiente
- Conversa de forma fluida sem robotização
- Só se desculpa quando realmente houve demora ou problema
- Mantém continuidade na conversa

CONTEXTO DA CONVERSA:
${conversationContext}

MENSAGEM ATUAL: ${message}

INSTRUÇÕES:
- Continue a conversa de forma natural baseada no contexto
- ${isAppointmentRequest ? 'IMPORTANTE: Esta mensagem é sobre agendamento. Use as ferramentas disponíveis para verificar disponibilidade e agendar.' : ''}
- Não repita informações já ditas
- Seja específica e útil
- Use emojis moderadamente (😊, 💙, 📅)
- NÃO peça desculpas desnecessariamente`;

    // Configuração da chamada OpenAI com ferramentas MCP
    const openAIPayload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: liaPrompt
        },
        {
          role: "user", 
          content: message
        }
      ],
      tools: MCPToolsProcessor.getMCPTools(),
      tool_choice: isAppointmentRequest ? "auto" : "none",
      max_tokens: 300,
      temperature: 0.8,
      presence_penalty: 0.3,
      frequency_penalty: 0.4
    };

    console.log('📤 Enviando para OpenAI com personalidade Lia...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(openAIPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro OpenAI (${response.status}):`, errorText);
      return LiaPersonality.getFollowUpResponse(message);
    }

    const result = await response.json();
    console.log('📥 Resposta OpenAI recebida');

    if (!result.choices || result.choices.length === 0) {
      console.error('❌ Resposta OpenAI vazia');
      return LiaPersonality.getFollowUpResponse(message);
    }

    const choice = result.choices[0];
    let finalResponse = '';

    // Processar tool calls se houver (usando supabase real)
    if (choice.message?.tool_calls && choice.message.tool_calls.length > 0 && supabase) {
      console.log('🔧 Processando tool calls com Supabase real...');
      const toolCall = choice.message.tool_calls[0];
      
      const toolResult = await MCPToolsProcessor.processToolCall(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments || '{}'),
        supabase
      );
      
      finalResponse = toolResult;
    } else {
      finalResponse = choice.message?.content || '';
    }

    if (!finalResponse || finalResponse.trim().length === 0) {
      console.log('⚠️ Resposta vazia, usando fallback da Lia');
      return LiaPersonality.getFollowUpResponse(message);
    }

    // Verificar se está repetindo resposta anterior
    if (lastBotMessages.some(lastMsg => 
        lastMsg && finalResponse.includes(lastMsg.substring(0, 50)))) {
      console.log('🔄 Detectada repetição, variando resposta...');
      finalResponse = LiaPersonality.generateVariedResponse(finalResponse, message);
    }

    console.log('✅ Resposta final da Lia:', finalResponse);
    return finalResponse;

  } catch (error) {
    console.error('❌ Erro crítico na geração de resposta:', error);
    return LiaPersonality.getFollowUpResponse(message);
  }
}

// Função para validar resposta da Lia
export function validateLiaResponse(response: string): boolean {
  if (!response || response.trim().length === 0) {
    return false;
  }
  
  // Verificar se não contém termos técnicos ou de IA
  const forbiddenTerms = ['ia', 'artificial', 'bot', 'sistema', 'algoritmo', 'programada'];
  const lowerResponse = response.toLowerCase();
  
  for (const term of forbiddenTerms) {
    if (lowerResponse.includes(term)) {
      console.log(`⚠️ Resposta contém termo proibido: ${term}`);
      return false;
    }
  }
  
  return true;
}
