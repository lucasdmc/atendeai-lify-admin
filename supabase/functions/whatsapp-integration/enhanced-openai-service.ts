
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

// Função utilitária para criar mock do Supabase
function createSupabaseMock() {
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        gte: (column: string, value: any) => ({
          order: (orderColumn: string, options: any) => ({
            limit: (limitValue: number) => Promise.resolve({ 
              data: [], 
              error: null 
            })
          })
        })
      })
    }),
    functions: {
      invoke: (functionName: string, options: any) => Promise.resolve({ 
        data: { success: true }, 
        error: null 
      })
    }
  };
}

export async function generateEnhancedAIResponse(
  contextData: any[],
  recentMessages: any[],
  message: string,
  phoneNumber: string,
  userIntent?: any
): Promise<string> {
  console.log('🤖 === GERAÇÃO DE RESPOSTA IA HUMANIZADA (LIA) ===');
  console.log(`📞 Número: ${phoneNumber}`);
  console.log(`💬 Mensagem: ${message}`);
  
  if (!openAIApiKey) {
    console.error('❌ OPENAI_API_KEY não configurada');
    return LiaPersonality.getFallbackResponse();
  }

  try {
    // Verificar se é primeira mensagem
    const isFirstContact = LiaPersonality.isFirstContact(recentMessages);
    console.log(`👋 Primeiro contato: ${isFirstContact ? 'SIM' : 'NÃO'}`);

    // Se é primeiro contato, responder diretamente com saudação
    if (isFirstContact) {
      console.log('🎯 Retornando saudação inicial da Lia...');
      return LiaPersonality.getGreetingMessage();
    }

    // Verificar se é uma resposta rápida e direta (não precisa de desculpas)
    const isQuickResponse = shouldRespondQuickly(message, recentMessages);

    // Para respostas diretas, usar respostas da Lia sem IA
    if (isQuickResponse) {
      console.log('⚡ Resposta rápida da Lia...');
      return LiaPersonality.getFollowUpResponse(message);
    }

    // Gerar prompt contextual da Lia (sem instruções de desculpas)
    const liaPrompt = LiaPersonality.generateContextualPrompt(
      message,
      contextData,
      recentMessages,
      isFirstContact
    );

    // Configuração da chamada OpenAI com personalidade Lia
    const openAIPayload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `${liaPrompt}

IMPORTANTE: 
- NÃO peça desculpas desnecessariamente
- Seja natural e direta
- Só se desculpe se realmente houve demora ou problema
- Responda de forma fluida e positiva`
        },
        {
          role: "user", 
          content: message
        }
      ],
      tools: MCPToolsProcessor.getMCPTools(),
      tool_choice: "auto",
      max_tokens: 200,
      temperature: 0.7,
      presence_penalty: 0.3,
      frequency_penalty: 0.2
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

    // Processar tool calls se houver
    if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
      console.log('🔧 Processando tool calls...');
      const toolCall = choice.message.tool_calls[0];
      
      // Simular supabase para MCP tools
      const mockSupabase = createSupabaseMock();
      
      const toolResult = await MCPToolsProcessor.processToolCall(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments || '{}'),
        mockSupabase
      );
      
      finalResponse = toolResult;
    } else {
      finalResponse = choice.message?.content || '';
    }

    if (!finalResponse || finalResponse.trim().length === 0) {
      console.log('⚠️ Resposta vazia, usando fallback da Lia');
      return LiaPersonality.getFollowUpResponse(message);
    }

    // Aplicar filtros de personalidade da Lia (sem desculpas desnecessárias)
    finalResponse = LiaPersonality.adaptResponseStyle(finalResponse, false, false);
    
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
