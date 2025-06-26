import { corsHeaders } from './config.ts';
import { ContactManager } from './contact-manager.ts';
import { processAndRespondWithAI } from './ai-processor.ts';
import { ConversationStateManager } from './conversation-state-manager.ts';
import { AgentContextManager } from './agent-context-manager.ts';

export async function handleWebhook(data: any, supabase: any) {
  console.log('🎯 === PROCESSANDO WEBHOOK ===');
  
  try {
    if (!data.messages || !Array.isArray(data.messages) || data.messages.length === 0) {
      console.log('⚠️ Webhook sem mensagens válidas');
      return new Response(JSON.stringify({ success: true, message: 'No messages to process' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const message = data.messages[0];
    console.log('📩 Processando mensagem:', JSON.stringify(message, null, 2));

    if (!message.fromNumber || !message.text) {
      console.log('⚠️ Mensagem incompleta - faltando número ou texto');
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const phoneNumber = message.fromNumber;
    const messageText = message.text;
    const messageId = message.id || `msg_${Date.now()}`;

    console.log(`📞 Número: ${phoneNumber}`);
    console.log(`💬 Mensagem: ${messageText}`);

    // Buscar ou criar conversa com agente específico
    let conversation = await findOrCreateConversation(phoneNumber, supabase);
    
    // Associar agente à conversa se ainda não estiver associado
    if (!conversation.agent_id) {
      const agent = await AgentContextManager.getAgentByPhone(phoneNumber, supabase);
      if (agent) {
        const clinic = await AgentContextManager.getClinicByAgent(agent.id, supabase);
        await AgentContextManager.updateConversationAgent(
          conversation.id, 
          agent.id, 
          clinic?.id || null, 
          supabase
        );
        conversation.agent_id = agent.id;
        conversation.clinic_id = clinic?.id || null;
      }
    }

    // Salvar mensagem recebida
    await saveIncomingMessage(conversation.id, messageText, messageId, supabase);

    // Atualizar estado da conversa
    await ConversationStateManager.updateState(phoneNumber, {
      currentState: 'active'
    }, supabase);

    // Gerar contexto específico do agente
    const agentContext = await ConversationStateManager.getAgentContextForConversation(phoneNumber, supabase);

    // Processar mensagem com contexto do agente
    const aiResponse = await processMessageWithAI(phoneNumber, messageText, agentContext, supabase);

    console.log(`🤖 Resposta da IA: ${aiResponse}`);

    // Enviar resposta
    const sendResponse = await fetch(`${Deno.env.get('WHATSAPP_SERVER_URL')}/api/whatsapp/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phoneNumber,
        message: aiResponse
      })
    });

    if (sendResponse.ok) {
      const responseData = await sendResponse.json();
      await saveSentMessage(conversation.id, aiResponse, responseData.messageId, supabase);
      console.log('✅ Resposta enviada e salva com sucesso');
    } else {
      console.error('❌ Erro ao enviar resposta');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro no processamento do webhook:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function findOrCreateConversation(phoneNumber: string, supabase: any) {
  console.log(`🔍 Buscando conversa para ${phoneNumber}`);
  
  let { data: conversation, error } = await supabase
    .from('whatsapp_conversations')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();

  if (error || !conversation) {
    console.log(`🆕 Criando nova conversa para ${phoneNumber}`);
    
    const cleanNumber = phoneNumber.replace('@s.whatsapp.net', '');
    const formattedNumber = formatPhoneNumber(cleanNumber);
    const countryCode = extractCountryCode(cleanNumber);

    const { data: newConversation, error: createError } = await supabase
      .from('whatsapp_conversations')
      .insert({
        phone_number: phoneNumber,
        formatted_phone_number: formattedNumber,
        country_code: countryCode,
        name: formattedNumber,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar conversa:', createError);
      throw new Error('Failed to create conversation');
    }

    conversation = newConversation;
    console.log(`✅ Conversa criada com ID: ${conversation.id}`);
  } else {
    console.log(`✅ Conversa encontrada com ID: ${conversation.id}`);
  }

  return conversation;
}

async function saveIncomingMessage(conversationId: string, content: string, messageId: string, supabase: any) {
  const { error } = await supabase
    .from('whatsapp_messages')
    .insert({
      conversation_id: conversationId,
      content: content,
      message_type: 'received',
      whatsapp_message_id: messageId,
      timestamp: new Date().toISOString()
    });

  if (error) {
    console.error('❌ Erro ao salvar mensagem recebida:', error);
  } else {
    console.log('✅ Mensagem recebida salva');
  }
}

async function saveSentMessage(conversationId: string, content: string, messageId: string, supabase: any) {
  const { error } = await supabase
    .from('whatsapp_messages')
    .insert({
      conversation_id: conversationId,
      content: content,
      message_type: 'sent',
      whatsapp_message_id: messageId,
      timestamp: new Date().toISOString()
    });

  if (error) {
    console.error('❌ Erro ao salvar mensagem enviada:', error);
  } else {
    console.log('✅ Mensagem enviada salva');
  }
}

async function processMessageWithAI(phoneNumber: string, message: string, agentContext: string, supabase: any): Promise<string> {
  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: agentContext
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    return openaiData.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';
  } catch (error) {
    console.error('❌ Erro ao processar com IA:', error);
    return 'Olá! Obrigado por entrar em contato. Nossa equipe irá te responder em breve! 😊';
  }
}

function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    const ddd = cleaned.substring(2, 4);
    const number = cleaned.substring(4);
    
    if (number.length === 9) {
      return `+55 (${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
    } else if (number.length === 8) {
      return `+55 (${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
    }
  }
  
  return `+${cleaned}`;
}

function extractCountryCode(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.startsWith('55')) return 'BR';
  if (cleaned.startsWith('1')) return 'US';
  if (cleaned.startsWith('44')) return 'GB';
  
  return 'XX';
}
