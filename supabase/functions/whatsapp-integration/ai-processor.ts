
import { openAIApiKey } from './config.ts';
import { sendMessage } from './message-handler.ts';

export async function processAndRespondWithAI(phoneNumber: string, message: string, supabase: any) {
  console.log(`🤖 === PROCESSAMENTO IA INICIADO ===`);
  console.log(`📞 Número: ${phoneNumber}`);
  console.log(`💬 Mensagem: ${message}`);
  console.log(`🔑 OpenAI Key configurada: ${openAIApiKey ? 'SIM' : 'NÃO'}`);
  
  try {
    // Buscar contexto da clínica
    console.log('🏥 Buscando contexto da clínica...');
    const { data: contextData, error: contextError } = await supabase
      .from('contextualization_data')
      .select('question, answer')
      .order('order_number');

    if (contextError) {
      console.error('❌ Erro ao buscar contexto:', contextError);
    } else {
      console.log(`✅ Contexto encontrado: ${contextData?.length || 0} itens`);
    }

    // Buscar histórico recente da conversa usando o número de telefone
    console.log('📝 Buscando histórico da conversa...');
    
    const { data: conversationData, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single();

    let recentMessages = [];
    if (!convError && conversationData) {
      const { data: messages, error: messagesError } = await supabase
        .from('whatsapp_messages')
        .select('content, message_type, timestamp')
        .eq('conversation_id', conversationData.id)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (messagesError) {
        console.error('❌ Erro ao buscar histórico:', messagesError);
      } else {
        recentMessages = messages || [];
        console.log(`✅ Histórico encontrado: ${recentMessages.length} mensagens`);
      }
    }

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

    systemPrompt += `\n\nINSTRUÇÕES:
- Responda de forma clara e objetiva
- Se não souber uma informação específica, seja honesto e ofereça alternativas
- Para agendamentos ou informações específicas, oriente o paciente a entrar em contato por telefone
- Mantenha sempre um tom profissional e acolhedor
- Respostas devem ser concisas (máximo 2-3 parágrafos)`;

    // Construir histórico da conversa
    const messages = [{ role: 'system', content: systemPrompt }];

    if (recentMessages && recentMessages.length > 0) {
      // Adicionar mensagens recentes ao contexto (em ordem cronológica)
      recentMessages
        .reverse()
        .slice(0, 8)
        .forEach((msg) => {
          if (msg.content && msg.content !== message) { // Evitar duplicar a mensagem atual
            messages.push({
              role: msg.message_type === 'received' ? 'user' : 'assistant',
              content: msg.content
            });
          }
        });
    }

    // Adicionar mensagem atual
    messages.push({ role: 'user', content: message });

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
        }
      } catch (error) {
        console.error('❌ Erro ao chamar OpenAI:', error);
      }
    } else {
      console.log('⚠️ OpenAI Key não configurada, usando resposta padrão');
    }

    // Enviar resposta de volta via WhatsApp
    console.log('📤 Enviando resposta via WhatsApp...');
    await sendMessage(phoneNumber, aiResponse, supabase);
    
    console.log(`✅ Resposta automática enviada para ${phoneNumber}`);
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem com IA:', error);
    
    // Enviar mensagem de erro genérica
    try {
      console.log('📤 Enviando mensagem de erro...');
      await sendMessage(phoneNumber, 'Desculpe, estou com dificuldades no momento. Tente novamente em alguns minutos ou entre em contato por telefone.', supabase);
    } catch (sendError) {
      console.error('❌ Erro ao enviar mensagem de erro:', sendError);
    }
  }
}
