
import { HumanizedResponseGenerator } from './humanized-response-generator.ts';
import { MCPTools } from './mcp-tools.ts';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateEnhancedAIResponse(
  contextData: any[],
  conversationHistory: any[],
  userMessage: string,
  phoneNumber: string,
  userIntent: any
): Promise<string> {
  console.log('🤖 === SISTEMA DE IA HUMANIZADA INICIADO ===');
  
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key não configurada');
    }

    // Gerar prompt contextualizado e humanizado
    const humanizedPrompt = await HumanizedResponseGenerator.generateHumanizedResponse(
      userMessage,
      phoneNumber,
      { from: () => ({ select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }) }) }, // Mock supabase
      contextData,
      conversationHistory
    );

    console.log('📝 Prompt humanizado gerado com sucesso');

    // Verificar se precisa usar ferramentas MCP
    const mcpResponse = await MCPTools.processWithMCP(userMessage, userIntent, phoneNumber);
    
    let systemPrompt = humanizedPrompt;
    if (mcpResponse) {
      systemPrompt += `\n\nINFORMAÇÕES ATUALIZADAS DO SISTEMA:\n${mcpResponse}`;
      console.log('🔧 Informações MCP integradas ao prompt');
    }

    // Construir histórico de mensagens para OpenAI
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Adicionar histórico recente (últimas 6 mensagens para contexto)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-6);
      recentHistory.forEach((msg) => {
        if (msg.content && msg.content.trim()) {
          messages.push({
            role: msg.message_type === 'received' ? 'user' : 'assistant',
            content: msg.content
          });
        }
      });
    }

    // Adicionar mensagem atual do usuário
    messages.push({
      role: 'user',
      content: userMessage
    });

    console.log('📤 Enviando requisição para OpenAI GPT-4o...');

    // Chamar OpenAI API com configurações otimizadas para conversação natural
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 800,
        temperature: 0.8, // Mais criatividade para conversação natural
        top_p: 0.9,
        frequency_penalty: 0.3, // Reduz repetições
        presence_penalty: 0.4, // Encoraja novos tópicos
        response_format: { type: "text" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Erro na API OpenAI:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('Resposta inválida da OpenAI');
    }

    const aiResponse = data.choices[0].message.content.trim();
    
    console.log(`✅ Resposta humanizada gerada: ${aiResponse.substring(0, 100)}...`);
    console.log(`📊 Tokens utilizados: ${data.usage?.total_tokens || 'N/A'}`);

    return aiResponse;

  } catch (error) {
    console.error('❌ Erro crítico no sistema de IA humanizada:', error);
    
    // Fallback empático em caso de erro
    return `Ops! Parece que tive um pequeno problema técnico. 😅 Pode repetir sua mensagem? Prometo que vou conseguir te ajudar melhor desta vez!`;
  }
}
