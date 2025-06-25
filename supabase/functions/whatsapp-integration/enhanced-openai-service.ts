
import { ConversationMemoryManager } from './conversation-memory.ts';
import { HumanizedResponseGenerator } from './humanized-response-generator.ts';
import { LiaPersonality } from './lia-personality.ts';
import { MCPToolsProcessor } from './mcp-tools.ts';
import { TimeContextManager } from './time-context-manager.ts';

export async function generateEnhancedAIResponse(
  contextData: any[],
  recentMessages: any[],
  message: string,
  phoneNumber: string,
  userIntent?: any
): Promise<string> {
  try {
    console.log('🤖 === SISTEMA DE IA DA LIA INICIADO ===');
    
    // Usar o sistema humanizado da Lia como principal
    console.log('🧠 Gerando prompt da Lia...');
    
    try {
      const liaResponse = await HumanizedResponseGenerator.generateHumanizedResponse(
        message,
        phoneNumber,
        null, // supabase será criado internamente
        contextData,
        recentMessages
      );
      
      // Se recebemos um prompt contextual, processar com OpenAI
      if (liaResponse && liaResponse.includes('CONTEXTO PESSOAL DO PACIENTE')) {
        console.log('📝 Prompt da Lia gerado com sucesso');
        
        // Processar com MCP Tools
        console.log('🔧 === PROCESSAMENTO MCP INICIADO ===');
        const mcpResult = await MCPToolsProcessor.processUserMessage(message, contextData);
        console.log('🔧 MCP processamento concluído. Resposta:', mcpResult.shouldRespond ? 'Sim' : 'Não');
        
        // Aplicar contexto temporal
        const timeContext = TimeContextManager.getCurrentTimeContext();
        console.log('✅ Contexto temporal aplicado');
        
        // Integrar informações do MCP ao prompt
        let enhancedPrompt = liaResponse;
        if (mcpResult.toolsData && Object.keys(mcpResult.toolsData).length > 0) {
          enhancedPrompt += `\n\nINFORMAÇÕES ADICIONAIS DO SISTEMA:\n${JSON.stringify(mcpResult.toolsData, null, 2)}`;
        }
        console.log('🔧 Informações MCP integradas ao prompt da Lia');
        
        // Processar com OpenAI
        const openaiResponse = await processWithOpenAI(enhancedPrompt, message);
        
        if (openaiResponse) {
          // Aplicar filtros da personalidade da Lia
          const finalResponse = applyLiaPersonalityFilters(openaiResponse, message);
          console.log('✅ Resposta processada e filtros da Lia aplicados');
          return finalResponse;
        }
      }
      
      // Se é uma saudação direta da Lia (primeiro contato)
      if (liaResponse && !liaResponse.includes('CONTEXTO PESSOAL DO PACIENTE')) {
        console.log('✅ Saudação da Lia retornada diretamente');
        return liaResponse;
      }
      
    } catch (liaError) {
      console.error('❌ Erro crítico no sistema da Lia:', liaError);
    }
    
    // Fallback para resposta da Lia
    console.log('🔄 Usando fallback da Lia');
    return generateLiaFallbackResponse(message, contextData);
    
  } catch (error) {
    console.error('❌ Erro crítico no processamento humanizado:', error);
    return generateLiaFallbackResponse(message, contextData);
  }
}

async function processWithOpenAI(prompt: string, userMessage: string): Promise<string | null> {
  try {
    console.log('📤 Enviando requisição para OpenAI GPT-4o-mini (Lia)...');
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY não configurada');
      return null;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: `${prompt}\n\nMensagem do paciente: "${userMessage}"` }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('❌ Erro na resposta da OpenAI:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (aiResponse) {
      console.log('✅ Resposta da OpenAI recebida com sucesso');
      return aiResponse.trim();
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao chamar OpenAI:', error);
    return null;
  }
}

function applyLiaPersonalityFilters(response: string, userMessage: string): string {
  // Aplicar filtros da Lia para garantir personalidade consistente
  let filteredResponse = response;
  
  // Remover linguagem muito técnica ou formal
  filteredResponse = filteredResponse.replace(/Prezado\(a\) usuário\(a\)/gi, 'Oi!');
  filteredResponse = filteredResponse.replace(/Como posso auxiliá-lo\(a\)/gi, 'Como posso te ajudar');
  filteredResponse = filteredResponse.replace(/À disposição/gi, 'Estou aqui para te ajudar');
  filteredResponse = filteredResponse.replace(/Atenciosamente/gi, '');
  
  // Garantir que não mencione ser IA
  filteredResponse = filteredResponse.replace(/Como uma IA/gi, 'Como assistente');
  filteredResponse = filteredResponse.replace(/sou uma inteligência artificial/gi, 'sou a assistente da clínica');
  filteredResponse = filteredResponse.replace(/sistema de IA/gi, 'sistema da clínica');
  
  // Adicionar toque pessoal se não tiver emoji
  if (!filteredResponse.includes('😊') && !filteredResponse.includes('💙') && Math.random() > 0.6) {
    const emojis = ['😊', '💙', '🙏'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    filteredResponse += ` ${randomEmoji}`;
  }
  
  // Garantir que termina de forma acolhedora
  if (!filteredResponse.includes('qualquer coisa') && !filteredResponse.includes('mais alguma coisa')) {
    if (Math.random() > 0.7) {
      filteredResponse += '\n\nSe precisar de mais alguma coisa, é só me chamar!';
    }
  }
  
  return filteredResponse;
}

function generateLiaFallbackResponse(userMessage: string, contextData: any[]): string {
  console.log('🔄 Usando resposta de fallback da Lia');
  
  const lowerMessage = userMessage.toLowerCase();
  
  // Respostas da Lia baseadas na mensagem
  if (lowerMessage.includes('ola') || lowerMessage.includes('oi') || lowerMessage.includes('olá')) {
    return LiaPersonality.getGreetingMessage();
  }
  
  if (lowerMessage.includes('agend')) {
    return `Claro! Vou te ajudar com o agendamento 😊\nPara qual especialidade você gostaria de agendar?\nE qual data seria melhor para você? 💙`;
  }
  
  if (lowerMessage.includes('horario') || lowerMessage.includes('horário')) {
    return `Nossos horários são de segunda a sexta, das 8h às 18h 😊\nQual dia seria melhor para você?\nVou verificar nossa disponibilidade! 💙`;
  }
  
  if (lowerMessage.includes('doutor') || lowerMessage.includes('medico') || lowerMessage.includes('médico')) {
    return `Temos profissionais excelentes! 😊\nPara qual especialidade você precisa?\nVou verificar qual médico está disponível para você 💙`;
  }

  if (lowerMessage.includes('obrigad') || lowerMessage.includes('valeu')) {
    return `Fico muito feliz em ajudar! 😊\nSe precisar de mais alguma coisa, é só me chamar.\nEstou sempre aqui para você! 💙`;
  }
  
  // Resposta padrão da Lia
  return `Entendi! 😊\nMe conta um pouquinho mais sobre o que você precisa?\nAssim posso te ajudar da melhor forma possível 💙`;
}
