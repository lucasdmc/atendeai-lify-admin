
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
      console.warn('⚠️ OpenAI API key não configurada, usando fallback');
      return this.generateFallbackResponse(userMessage, contextData);
    }

    // Gerar prompt contextualizado e humanizado
    console.log('🧠 Gerando prompt humanizado...');
    const humanizedPrompt = await HumanizedResponseGenerator.generateHumanizedResponse(
      userMessage,
      phoneNumber,
      null, // Supabase será mockado internamente se necessário
      contextData,
      conversationHistory
    );

    console.log('📝 Prompt humanizado gerado com sucesso');

    // Verificar se precisa usar ferramentas MCP
    let mcpResponse = '';
    try {
      mcpResponse = await MCPTools.processWithMCP(userMessage, userIntent, phoneNumber);
    } catch (mcpError) {
      console.warn('⚠️ Erro no MCP, continuando sem:', mcpError);
    }
    
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

    console.log('📤 Enviando requisição para OpenAI GPT-4o...');

    // Chamar OpenAI API com configurações otimizadas para conversação natural
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 600,
        temperature: 0.7, // Balanceado para naturalidade
        top_p: 0.9,
        frequency_penalty: 0.3, // Reduz repetições
        presence_penalty: 0.2, // Encoraja novos tópicos
        response_format: { type: "text" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Erro na API OpenAI:', errorData);
      return this.generateFallbackResponse(userMessage, contextData);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      console.error('❌ Resposta inválida da OpenAI');
      return this.generateFallbackResponse(userMessage, contextData);
    }

    const aiResponse = data.choices[0].message.content.trim();
    
    console.log(`✅ Resposta humanizada gerada: ${aiResponse.substring(0, 100)}...`);
    console.log(`📊 Tokens utilizados: ${data.usage?.total_tokens || 'N/A'}`);

    return aiResponse;

  } catch (error) {
    console.error('❌ Erro crítico no sistema de IA humanizada:', error);
    return this.generateFallbackResponse(userMessage, contextData);
  }
}

function generateFallbackResponse(userMessage: string, contextData: any[]): string {
  console.log('🔄 Gerando resposta de fallback');
  
  const lowerMessage = userMessage.toLowerCase();
  
  // Respostas contextuais baseadas na mensagem
  if (lowerMessage.includes('ola') || lowerMessage.includes('oi') || lowerMessage.includes('olá')) {
    return `Olá! 😊 Seja muito bem-vindo(a) à nossa clínica! Sou a Dra. Ana, sua assistente virtual. Como posso ajudá-lo(a) hoje? Estou aqui para esclarecer suas dúvidas e auxiliar com agendamentos.`;
  }
  
  if (lowerMessage.includes('agend')) {
    return `Claro! Ficarei feliz em ajudar com seu agendamento. 📅 Para agendar sua consulta, preciso de algumas informações. Qual especialidade você gostaria? E qual data seria melhor para você?`;
  }
  
  if (lowerMessage.includes('horario') || lowerMessage.includes('horário')) {
    return `Nossos horários de atendimento são de segunda a sexta, das 8h às 18h. 🕐 Qual dia seria melhor para sua consulta? Posso verificar nossa disponibilidade!`;
  }
  
  if (lowerMessage.includes('doutor') || lowerMessage.includes('medico') || lowerMessage.includes('médico')) {
    return `Temos excelentes profissionais em nossa equipe! 👨‍⚕️ Para qual especialidade você gostaria de agendar? Posso verificar a disponibilidade dos nossos médicos para você.`;
  }
  
  // Resposta padrão empática
  return `Entendo sua necessidade e estou aqui para ajudar! 😊 Poderia me contar um pouco mais sobre o que você precisa? Assim posso orientá-lo(a) da melhor forma possível. Nossa equipe está sempre pronta para cuidar bem de você!`;
}
