
import { HumanizedResponseGenerator } from './humanized-response-generator.ts';
import { MCPTools } from './mcp-tools.ts';
import { LiaPersonality } from './lia-personality.ts';

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
  console.log('🤖 === SISTEMA DE IA DA LIA INICIADO ===');
  
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key não configurada, usando fallback da Lia');
      return this.generateLiaFallbackResponse(userMessage, contextData);
    }

    // Gerar prompt humanizado da Lia
    console.log('🧠 Gerando prompt da Lia...');
    const liaPrompt = await HumanizedResponseGenerator.generateHumanizedResponse(
      userMessage,
      phoneNumber,
      null, // Supabase será mockado internamente se necessário
      contextData,
      conversationHistory
    );

    console.log('📝 Prompt da Lia gerado com sucesso');

    // Verificar se precisa usar ferramentas MCP
    let mcpResponse = '';
    try {
      mcpResponse = await MCPTools.processWithMCP(userMessage, userIntent, phoneNumber);
    } catch (mcpError) {
      console.warn('⚠️ Erro no MCP, continuando sem:', mcpError);
    }
    
    let systemPrompt = liaPrompt;
    if (mcpResponse) {
      systemPrompt += `\n\nINFORMAÇÕES ATUALIZADAS DO SISTEMA:\n${mcpResponse}`;
      console.log('🔧 Informações MCP integradas ao prompt da Lia');
    }

    // Construir histórico de mensagens para OpenAI
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Adicionar histórico recente (últimas 4 mensagens para contexto)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-4);
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

    console.log('📤 Enviando requisição para OpenAI GPT-4o-mini (Lia)...');

    // Chamar OpenAI API com configurações otimizadas para a personalidade da Lia
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 400, // Reduzido para respostas mais concisas da Lia
        temperature: 0.8, // Mais criativo para personalidade natural
        top_p: 0.9,
        frequency_penalty: 0.4, // Reduz repetições
        presence_penalty: 0.3, // Encoraja variação
        response_format: { type: "text" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Erro na API OpenAI:', errorData);
      return this.generateLiaFallbackResponse(userMessage, contextData);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      console.error('❌ Resposta inválida da OpenAI');
      return this.generateLiaFallbackResponse(userMessage, contextData);
    }

    let aiResponse = data.choices[0].message.content.trim();
    
    // Aplicar filtros da personalidade da Lia
    aiResponse = this.applyLiaPersonalityFilters(aiResponse);
    
    console.log(`✅ Resposta da Lia gerada: ${aiResponse.substring(0, 100)}...`);
    console.log(`📊 Tokens utilizados: ${data.usage?.total_tokens || 'N/A'}`);

    return aiResponse;

  } catch (error) {
    console.error('❌ Erro crítico no sistema da Lia:', error);
    return this.generateLiaFallbackResponse(userMessage, contextData);
  }
}

function applyLiaPersonalityFilters(response: string): string {
  // Filtros para garantir que a resposta está no estilo da Lia
  let filtered = response;
  
  // Remover referências à IA
  filtered = filtered.replace(/como (?:uma )?(?:IA|inteligência artificial|assistente virtual)/gi, 'como assistente');
  filtered = filtered.replace(/sou (?:uma )?(?:IA|inteligência artificial)/gi, 'sou a Lia');
  
  // Garantir tom mais pessoal
  filtered = filtered.replace(/posso auxiliá-lo/gi, 'posso te ajudar');
  filtered = filtered.replace(/à disposição/gi, 'estou aqui para te ajudar');
  
  // Limitar emojis excessivos
  filtered = filtered.replace(/(😊|💙|🙏){3,}/g, '$1');
  
  return filtered;
}

function generateLiaFallbackResponse(userMessage: string, contextData: any[]): string {
  console.log('🔄 Gerando resposta de fallback da Lia');
  
  const lowerMessage = userMessage.toLowerCase();
  
  // Respostas contextuais da Lia baseadas na mensagem
  if (lowerMessage.includes('ola') || lowerMessage.includes('oi') || lowerMessage.includes('olá')) {
    return `Oi! Que bom ter você aqui! 😊\nSou a Lia, assistente aqui da clínica.\nCom quem eu tenho o prazer de falar? E como você está hoje? 💙\nMe conta como posso te ajudar!`;
  }
  
  if (lowerMessage.includes('agend')) {
    return `Claro! Vou te ajudar com o agendamento 😊\nPara qual especialidade você gostaria?\nE que dia seria melhor para você? 💙`;
  }
  
  if (lowerMessage.includes('horario') || lowerMessage.includes('horário')) {
    return `Nossos horários são de segunda a sexta, das 8h às 18h 😊\nQual dia seria melhor para você?\nVou verificar nossa disponibilidade! 💙`;
  }
  
  if (lowerMessage.includes('doutor') || lowerMessage.includes('medico') || lowerMessage.includes('médico')) {
    return `Temos profissionais excelentes! 😊\nPara qual especialidade você precisa?\nVou verificar qual médico está disponível 💙`;
  }

  if (lowerMessage.includes('obrigad') || lowerMessage.includes('valeu')) {
    return `Fico muito feliz em ajudar! 😊\nSe precisar de mais alguma coisa, é só me chamar.\nEstou sempre aqui para você! 💙`;
  }
  
  // Resposta padrão empática da Lia
  return `Entendi! 😊\nMe conta um pouquinho mais sobre o que você precisa?\nAssim posso te ajudar da melhor forma possível 💙`;
}
