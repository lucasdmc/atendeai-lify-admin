
import { openAIApiKey } from './config.ts';
import { LiaPersonality } from './lia-personality.ts';
import { MCPToolsProcessor } from './mcp-tools.ts';

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

    // Gerar prompt contextual da Lia
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
          content: liaPrompt
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
      return LiaPersonality.getFallbackResponse();
    }

    const result = await response.json();
    console.log('📥 Resposta OpenAI recebida:', JSON.stringify(result, null, 2));

    if (!result.choices || result.choices.length === 0) {
      console.error('❌ Resposta OpenAI vazia');
      return LiaPersonality.getFallbackResponse();
    }

    const choice = result.choices[0];
    let finalResponse = '';

    // Processar tool calls se houver
    if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
      console.log('🔧 Processando tool calls...');
      const toolCall = choice.message.tool_calls[0];
      const toolResult = await MCPToolsProcessor.processToolCall(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments || '{}'),
        null // supabase será passado quando necessário
      );
      
      finalResponse = choice.message.content || toolResult;
    } else {
      finalResponse = choice.message?.content || '';
    }

    if (!finalResponse || finalResponse.trim().length === 0) {
      console.log('⚠️ Resposta vazia, usando fallback da Lia');
      return LiaPersonality.getFallbackResponse();
    }

    // Aplicar filtros de personalidade da Lia
    finalResponse = LiaPersonality.applyPersonalityFilter(finalResponse);
    
    console.log('✅ Resposta final da Lia:', finalResponse);
    return finalResponse;

  } catch (error) {
    console.error('❌ Erro crítico na geração de resposta:', error);
    return LiaPersonality.getFallbackResponse();
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
