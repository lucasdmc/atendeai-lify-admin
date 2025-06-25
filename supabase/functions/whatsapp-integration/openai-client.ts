
import { MCPToolsProcessor } from './mcp-tools.ts';
import { detectAppointmentIntent } from './message-analysis.ts';

export async function callOpenAI(
  systemPrompt: string,
  message: string,
  supabase: any
): Promise<string> {
  console.log('📤 Enviando para OpenAI com personalidade Lia...');
  
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    console.error('❌ OPENAI_API_KEY não configurada');
    throw new Error('OpenAI API key not configured');
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
    throw new Error(`OpenAI API error: ${response.status}`);
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
      return toolResults[0]; // Usar o primeiro resultado
    }
  }

  // Resposta normal da OpenAI
  const aiResponse = choice?.message?.content;
  if (aiResponse) {
    return aiResponse;
  }

  throw new Error('Resposta vazia da OpenAI');
}
