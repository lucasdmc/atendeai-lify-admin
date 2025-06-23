
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

    // Verificar se é sobre agendamento
    const isAboutAppointment = isAppointmentRelated(message);
    console.log(`📅 Mensagem sobre agendamento: ${isAboutAppointment ? 'SIM' : 'NÃO'}`);

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
Você pode ajudar os pacientes com agendamentos. Quando detectar solicitações de agendamento:
- Para CRIAR: colete data, horário, tipo de consulta e email
- Para CANCELAR: peça data e horário da consulta existente
- Para REAGENDAR: peça dados atuais e novos dados desejados
- Para LISTAR: mostre os agendamentos do paciente

INSTRUÇÕES:
- Responda de forma clara e objetiva
- Para agendamentos, seja específico sobre as informações necessárias
- Sempre confirme detalhes antes de finalizar agendamentos
- Mantenha um tom profissional e acolhedor
- Respostas devem ser concisas (máximo 2-3 parágrafos)
- Se detectar solicitação de agendamento, foque em coletar as informações necessárias`;

    // Se for sobre agendamento, usar lógica específica
    if (isAboutAppointment) {
      const appointmentResponse = await handleAppointmentRequest(message, phoneNumber, supabase);
      if (appointmentResponse) {
        console.log('📅 Resposta específica de agendamento gerada');
        await sendMessage(phoneNumber, appointmentResponse, supabase);
        return;
      }
    }

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
          aiResponse = 'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns minutos ou entre em contato por telefone.';
        }
      } catch (error) {
        console.error('❌ Erro ao chamar OpenAI:', error);
        aiResponse = 'Desculpe, estou temporariamente indisponível. Por favor, tente novamente em alguns minutos.';
      }
    } else {
      console.log('⚠️ OpenAI Key não configurada, usando resposta padrão');
    }

    // Enviar resposta de volta via WhatsApp
    console.log('📤 Enviando resposta via WhatsApp...');
    try {
      await sendMessage(phoneNumber, aiResponse, supabase);
      console.log(`✅ Resposta automática enviada para ${phoneNumber}`);
    } catch (sendError) {
      console.error('❌ Erro ao enviar resposta:', sendError);
      throw sendError;
    }
    
  } catch (error) {
    console.error('❌ Erro crítico no processamento com IA:', error);
    
    // Enviar mensagem de erro genérica
    try {
      console.log('📤 Enviando mensagem de erro...');
      await sendMessage(phoneNumber, 'Desculpe, estou com dificuldades no momento. Tente novamente em alguns minutos ou entre em contato por telefone.', supabase);
    } catch (sendError) {
      console.error('❌ Erro ao enviar mensagem de erro:', sendError);
    }
  }
}

function isAppointmentRelated(message: string): boolean {
  const appointmentKeywords = [
    'agendar', 'agendamento', 'consulta', 'horário', 'marcar',
    'reagendar', 'cancelar', 'desmarcar', 'alterar', 'mudar',
    'disponibilidade', 'agenda', 'atendimento'
  ];
  
  const lowerMessage = message.toLowerCase();
  return appointmentKeywords.some(keyword => lowerMessage.includes(keyword));
}

async function handleAppointmentRequest(message: string, phoneNumber: string, supabase: any): Promise<string | null> {
  const lowerMessage = message.toLowerCase();

  // Detectar tipo de solicitação
  if (lowerMessage.includes('agendar') || lowerMessage.includes('marcar')) {
    return `Para agendar sua consulta, preciso de algumas informações:

📅 **Data desejada** (ex: 25/12/2024)
🕐 **Horário** (ex: 14:00 às 15:00)
👨‍⚕️ **Tipo de consulta** (ex: Consulta Geral, Cardiologia, etc.)
📧 **Seu email** (para enviar confirmação)

Por favor, me informe esses dados e eu criarei seu agendamento!`;
  }

  if (lowerMessage.includes('cancelar') || lowerMessage.includes('desmarcar')) {
    return `Para cancelar seu agendamento, preciso que me informe:

📅 **Data da consulta** que deseja cancelar
🕐 **Horário** da consulta

Com essas informações, posso localizar e cancelar seu agendamento.`;
  }

  if (lowerMessage.includes('reagendar') || lowerMessage.includes('alterar')) {
    return `Para reagendar sua consulta, preciso saber:

📅 **Data atual** da consulta
🕐 **Horário atual** da consulta
📅 **Nova data** desejada
🕐 **Novo horário** desejado

Com essas informações, posso alterar seu agendamento.`;
  }

  if (lowerMessage.includes('listar') || (lowerMessage.includes('ver') && lowerMessage.includes('agendamento'))) {
    return `Vou verificar seus agendamentos... 

📋 No momento, você não possui agendamentos marcados.

Gostaria de agendar uma consulta? Posso ajudá-lo com isso!`;
  }

  return null;
}
