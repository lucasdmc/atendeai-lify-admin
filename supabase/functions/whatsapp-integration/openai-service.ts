
import { openAIApiKey } from './config.ts';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateAIResponse(
  contextData: any[], 
  recentMessages: any[], 
  currentMessage: string
): Promise<string> {
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

  systemPrompt += `\n\nFUNCIONALIDADES DE AGENDAMENTO:
Você pode ajudar os pacientes com agendamentos. Quando detectar solicitações de agendamento completas:
- Para CRIAR: precisa de data, horário, tipo de consulta e email
- Para CANCELAR: precisa de data e horário da consulta existente
- Para REAGENDAR: precisa de dados atuais e novos dados desejados
- Para LISTAR: mostre os agendamentos do paciente

INSTRUÇÕES:
- Responda de forma clara e objetiva
- Para agendamentos, seja específico sobre as informações necessárias
- Sempre confirme detalhes antes de finalizar agendamentos
- Mantenha um tom profissional e acolhedor
- Respostas devem ser concisas (máximo 2-3 parágrafos)
- Quando tiver todas as informações necessárias, confirme que o agendamento foi criado`;

  // Construir histórico da conversa
  const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

  if (recentMessages && recentMessages.length > 0) {
    // Adicionar mensagens recentes ao contexto (em ordem cronológica)
    recentMessages
      .reverse()
      .slice(0, 8)
      .forEach((msg) => {
        if (msg.content && msg.content !== currentMessage) {
          messages.push({
            role: msg.message_type === 'received' ? 'user' : 'assistant',
            content: msg.content
          });
        }
      });
  }

  // Adicionar mensagem atual
  messages.push({ role: 'user', content: currentMessage });

  console.log(`💭 Prompt construído com ${messages.length} mensagens`);

  // Chamar a OpenAI se a chave estiver configurada
  let aiResponse = 'Olá! Obrigado por entrar em contato. Como posso ajudá-lo hoje?';
  
  if (openAIApiKey) {
    try {
      console.log('🔄 Chamando OpenAI API...');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      console.log(`📡 OpenAI response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.choices[0].message.content;
        console.log('✅ Resposta IA gerada com sucesso');
        console.log(`💬 Resposta: ${aiResponse.substring(0, 100)}...`);
      } else {
        const errorText = await response.text();
        console.error('❌ Erro na OpenAI API:', response.status, errorText);
        aiResponse = 'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns minutos ou entre em contato por telefone.';
      }
    } catch (error) {
      console.error('❌ Erro ao chamar OpenAI:', error);
      aiResponse = 'Desculpe, estou temporariamente indisponível. Por favor, tente novamente em alguns minutos.';
    }
  } else {
    console.log('⚠️ OpenAI Key não configurada, usando resposta padrão');
  }

  return aiResponse;
}
