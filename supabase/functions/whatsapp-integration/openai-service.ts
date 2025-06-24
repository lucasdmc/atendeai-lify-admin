import { Configuration, OpenAIApi } from "openai";
import { load } from 'https://deno.land/std@0.218.2/dotenv/mod.ts';

const env = await load();

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateOpenAIResponse(
  messages: any[],
  contextData: any[]
): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || env['OPENAI_API_KEY'];

  if (!openaiApiKey) {
    console.error('Chave da OpenAI não encontrada nas variáveis de ambiente.');
    throw new Error('Chave da OpenAI não encontrada.');
  }

  try {
    // Construir prompt do sistema com contexto da clínica
    let systemPrompt = `Você é um assistente virtual de uma clínica médica. Seja sempre educado, profissional e prestativo.

INFORMAÇÕES DA CLÍNICA:`;

    if (contextData && contextData.length > 0) {
      contextData.forEach((item) => {
        if (item.answer) {
          systemPrompt += `\n- ${item.question}: ${item.answer}`;
        }
      });
    } else {
      systemPrompt += `\n- Esta é uma clínica médica que oferece diversos serviços de saúde.`;
    }

    systemPrompt += `

FUNCIONALIDADES DE AGENDAMENTO VIA WHATSAPP:
• O sistema possui agendamento completo integrado ao WhatsApp
• Para agendar uma consulta, o paciente deve digitar: "/agendar" ou "agendar"
• O sistema mostra um calendário interativo com datas disponíveis
• O paciente seleciona data e horário através de números das opções
• O agendamento é confirmado automaticamente e sincronizado com o Google Calendar
• Horários de funcionamento: Segunda a Sexta 8h às 18h (pausa 12h às 13h), Sábado 8h às 12h

INSTRUÇÕES IMPORTANTES:
• SEMPRE ofereça o comando "/agendar" quando o paciente perguntar sobre agendamentos
• NÃO tente agendar manualmente - use SEMPRE o sistema automatizado
• Explique que o agendamento é feito de forma interativa pelo próprio WhatsApp
• Seja claro que o paciente deve digitar "/agendar" para iniciar o processo
• Mencione que o processo é rápido, seguro e automatizado
• Se o paciente tentar dar dados de agendamento sem usar o comando, redirecione para "/agendar"

OUTRAS INSTRUÇÕES:
• Responda de forma clara e objetiva  
• Mantenha sempre um tom profissional e acolhedor
• Respostas devem ser concisas (máximo 2-3 parágrafos)
• Se não souber algo, seja honesto e direcione para contato telefônico: (47) 99967-2901
• Para urgências, sempre mencione o telefone da clínica`;

    // Construir histórico da conversa
    const messagesForAI: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Erro da OpenAI API:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('Resposta vazia da OpenAI');
    }

    console.log('✅ Resposta IA gerada com sucesso');
    return aiResponse;

  } catch (error) {
    console.error('❌ Erro ao chamar OpenAI:', error);
    throw error;
  }
}
