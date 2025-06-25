
import { MCPToolsProcessor } from './mcp-tools.ts';
import { LiaPersonality } from './lia-personality.ts';

// Utility functions (previously private static methods)
function shouldRespondQuickly(message: string, recentMessages: any[]): boolean {
  const quickKeywords = ['oi', 'olá', 'sim', 'não', 'ok', 'obrigado', 'tchau'];
  const lowerMessage = message.toLowerCase();
  
  if (quickKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return true;
  }
  
  // Se é uma resposta muito curta
  if (message.length < 10) {
    return true;
  }
  
  return false;
}

function detectAppointmentIntent(message: string): any {
  const lowerMessage = message.toLowerCase();
  
  // Keywords para agendamento
  const appointmentKeywords = [
    'agendar', 'agendamento', 'marcar', 'consulta', 'horário',
    'disponibilidade', 'psicolog', 'cardio', 'dermat', 'gineco'
  ];
  
  const hasAppointmentKeyword = appointmentKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  // Detectar especialidade
  let specialty = null;
  if (lowerMessage.includes('psicolog')) specialty = 'Psicologia';
  if (lowerMessage.includes('cardio')) specialty = 'Cardiologia';
  if (lowerMessage.includes('dermat')) specialty = 'Dermatologia';
  if (lowerMessage.includes('gineco')) specialty = 'Ginecologia';
  if (lowerMessage.includes('pediatr')) specialty = 'Pediatria';
  if (lowerMessage.includes('geral') || lowerMessage.includes('clínic')) specialty = 'Clínica Geral';
  
  // Detectar data
  const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?/;
  const dateMatch = message.match(datePattern);
  
  // Detectar horário
  const timePattern = /(\d{1,2}):?(\d{2})|(\d{1,2})h/;
  const timeMatch = message.match(timePattern);
  
  return {
    isAppointmentRelated: hasAppointmentKeyword,
    specialty,
    date: dateMatch ? dateMatch[0] : null,
    time: timeMatch ? timeMatch[0] : null,
    confidence: hasAppointmentKeyword ? 0.8 : 0.2
  };
}

function buildContextualPrompt(
  contextData: any[], 
  recentMessages: any[], 
  message: string, 
  phoneNumber: string
): string {
  // Detectar se é primeiro contato
  const isFirstContact = LiaPersonality.isFirstContact(recentMessages);
  
  let systemPrompt = `Você é a Lia, assistente virtual da clínica médica.

PERSONALIDADE DA LIA:
- Empática, amigável e acolhedora
- Fala de forma natural e humana, como uma pessoa real
- Usa emojis adequadamente (💙 😊 📅 👨‍⚕️)
- NUNCA pede desculpas desnecessariamente
- Só se desculpa quando realmente houve demora ou problema

REGRAS IMPORTANTES:
- Seja natural e conversacional
- Não seja robótica ou repetitiva
- Varie suas respostas mesmo para situações similares
- Mantenha o contexto da conversa
- Para agendamentos, use as ferramentas MCP disponíveis

INFORMAÇÕES DA CLÍNICA:`;

  if (contextData && contextData.length > 0) {
    contextData.forEach((item) => {
      if (item.answer) {
        systemPrompt += `\n- ${item.question}: ${item.answer}`;
      }
    });
  }

  systemPrompt += `\n\nHISTÓRICO DA CONVERSA:`;
  
  if (recentMessages && recentMessages.length > 0) {
    const lastMessages = recentMessages.slice(-6).reverse();
    lastMessages.forEach((msg) => {
      const type = msg.message_type === 'received' ? 'Usuario' : 'Lia';
      systemPrompt += `\n${type}: ${msg.content}`;
    });
  }

  systemPrompt += `\n\nMENSAGEM ATUAL: ${message}`;

  // Adicionar instruções específicas baseado no contexto
  if (isFirstContact) {
    systemPrompt += `\n\nEsta é a primeira mensagem do usuário. Seja acolhedora e se apresente naturalmente.`;
  }

  const appointmentIntent = detectAppointmentIntent(message);
  if (appointmentIntent.isAppointmentRelated) {
    systemPrompt += `\n\nO usuário está interessado em agendamento. Use as ferramentas MCP para ajudar com:
- check_availability: para verificar horários disponíveis
- schedule_appointment: para criar agendamentos reais
- get_clinic_info: para informações da clínica`;
  }

  return systemPrompt;
}

export async function generateEnhancedAIResponse(
  contextData: any[], 
  recentMessages: any[], 
  message: string, 
  phoneNumber: string,
  userIntent: any,
  supabase: any
): Promise<string> {
  console.log('🤖 === GERAÇÃO DE RESPOSTA IA HUMANIZADA (LIA) ===');
  console.log(`📞 Número: ${phoneNumber}`);
  console.log(`💬 Mensagem: ${message}`);

  const isFirstContact = LiaPersonality.isFirstContact(recentMessages);
  console.log(`👋 Primeiro contato: ${isFirstContact ? 'SIM' : 'NÃO'}`);

  // Se é primeiro contato, usar saudação da Lia
  if (isFirstContact) {
    console.log('🎯 Gerando saudação de primeiro contato');
    return LiaPersonality.getGreetingMessage();
  }

  // Para respostas rápidas, usar personality direta
  if (shouldRespondQuickly(message, recentMessages)) {
    console.log('⚡ Resposta rápida detectada');
    return LiaPersonality.getFollowUpResponse(message);
  }

  try {
    console.log('📤 Enviando para OpenAI com personalidade Lia...');
    
    const systemPrompt = buildContextualPrompt(contextData, recentMessages, message, phoneNumber);
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('❌ OPENAI_API_KEY não configurada');
      return LiaPersonality.getFallbackResponse();
    }

    // Detectar se precisa usar ferramentas MCP
    const appointmentIntent = detectAppointmentIntent(message);
    const tools = appointmentIntent.isAppointmentRelated ? MCPToolsProcessor.getMCPTools() : undefined;

    const requestBody: any = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 300
    };

    if (tools) {
      requestBody.tools = tools;
      requestBody.tool_choice = 'auto';
      console.log('🔧 MCP tools habilitadas para esta resposta');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('❌ Erro na API OpenAI:', response.status, response.statusText);
      return LiaPersonality.getFallbackResponse();
    }

    const data = await response.json();
    console.log('📥 Resposta OpenAI recebida');
    
    // Verificar se OpenAI quer usar ferramentas
    const choice = data.choices?.[0];
    if (choice?.message?.tool_calls) {
      console.log('🔧 OpenAI solicitou uso de ferramentas MCP');
      
      // Processar chamadas de ferramentas
      const toolResults = [];
      for (const toolCall of choice.message.tool_calls) {
        const { name, arguments: args } = toolCall.function;
        console.log(`🛠️ Executando ferramenta: ${name}`);
        
        try {
          const parsedArgs = JSON.parse(args);
          const result = await MCPToolsProcessor.processToolCall(name, parsedArgs, supabase);
          toolResults.push(result);
          console.log(`✅ Ferramenta ${name} executada com sucesso`);
        } catch (error) {
          console.error(`❌ Erro ao executar ferramenta ${name}:`, error);
          toolResults.push(`Erro ao executar ${name}`);
        }
      }
      
      // Se ferramentas foram executadas, retornar o resultado
      if (toolResults.length > 0) {
        const result = toolResults[0]; // Usar o primeiro resultado
        console.log('✅ Resposta final da Lia:', result);
        return result;
      }
    }

    // Resposta normal da OpenAI
    const aiResponse = choice?.message?.content;
    if (aiResponse) {
      console.log('✅ Resposta final da Lia:', aiResponse);
      return aiResponse;
    }

    console.error('❌ Resposta vazia da OpenAI');
    return LiaPersonality.getFallbackResponse();

  } catch (error) {
    console.error('❌ Erro ao gerar resposta IA:', error);
    return LiaPersonality.getFallbackResponse();
  }
}
