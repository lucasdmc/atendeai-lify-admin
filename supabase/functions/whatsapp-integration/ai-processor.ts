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

    // Verificar se é sobre agendamento e tentar processar
    const isAboutAppointment = isAppointmentRelated(message);
    console.log(`📅 Mensagem sobre agendamento: ${isAboutAppointment ? 'SIM' : 'NÃO'}`);

    if (isAboutAppointment) {
      console.log('🔄 Processando solicitação de agendamento...');
      const appointmentResponse = await handleAppointmentRequest(message, phoneNumber, supabase);
      if (appointmentResponse) {
        console.log('📅 Resposta de agendamento gerada:', appointmentResponse.substring(0, 100) + '...');
        await sendMessageWithRetry(phoneNumber, appointmentResponse, supabase);
        return;
      }
    }

    // Se não conseguiu processar agendamento, usar IA para resposta
    console.log('🤖 Processando com IA...');
    
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
    const messages = [{ role: 'system', content: systemPrompt }];

    if (recentMessages && recentMessages.length > 0) {
      // Adicionar mensagens recentes ao contexto (em ordem cronológica)
      recentMessages
        .reverse()
        .slice(0, 8)
        .forEach((msg) => {
          if (msg.content && msg.content !== message) {
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

    // Enviar resposta de volta via WhatsApp com retry
    console.log('📤 Enviando resposta via WhatsApp...');
    await sendMessageWithRetry(phoneNumber, aiResponse, supabase);
    console.log(`✅ Resposta automática enviada para ${phoneNumber}`);
    
  } catch (error) {
    console.error('❌ Erro crítico no processamento com IA:', error);
    
    // Tentar enviar mensagem de erro básica
    try {
      console.log('📤 Enviando mensagem de erro básica...');
      await sendMessageWithRetry(phoneNumber, 'Desculpe, estou com dificuldades no momento. Tente novamente em alguns minutos.', supabase);
    } catch (sendError) {
      console.error('❌ Falha total ao comunicar com usuário:', sendError);
    }
  }
}

// Nova função com retry para envio de mensagens
async function sendMessageWithRetry(phoneNumber: string, message: string, supabase: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Tentativa ${attempt}/${maxRetries} de envio...`);
      await sendMessage(phoneNumber, message, supabase);
      console.log(`✅ Mensagem enviada com sucesso na tentativa ${attempt}`);
      return; // Sucesso, sair da função
    } catch (error) {
      console.error(`❌ Tentativa ${attempt} falhou:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('❌ Todas as tentativas de envio falharam');
        throw error;
      }
      
      // Aguardar antes da próxima tentativa (backoff exponencial)
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
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
  console.log('🏥 Processando solicitação de agendamento...');
  console.log('📝 Mensagem:', message);
  
  const lowerMessage = message.toLowerCase();

  // Tentar extrair informações de agendamento da mensagem
  const appointmentData = extractAppointmentData(message);
  console.log('📋 Dados extraídos:', appointmentData);

  // Se temos informações suficientes, criar o agendamento
  if (appointmentData.hasRequiredData) {
    console.log('✅ Dados suficientes encontrados, criando agendamento...');
    
    try {
      // Chamar a função de agendamento
      const { data, error } = await supabase.functions.invoke('appointment-manager', {
        body: {
          action: 'create',
          appointmentData: {
            title: appointmentData.title,
            description: appointmentData.description,
            date: appointmentData.date,
            startTime: appointmentData.startTime,
            endTime: appointmentData.endTime,
            patientEmail: appointmentData.email,
            location: appointmentData.location
          }
        }
      });

      if (error) {
        console.error('❌ Erro ao criar agendamento:', error);
        return `Desculpe, houve um erro ao criar seu agendamento. Tente novamente ou entre em contato por telefone.`;
      }

      console.log('✅ Agendamento criado com sucesso!');
      return `✅ **Agendamento confirmado!**

📅 **Data:** ${appointmentData.displayDate}
🕐 **Horário:** ${appointmentData.startTime} às ${appointmentData.endTime}
👨‍⚕️ **Consulta:** ${appointmentData.title}
📧 **Email:** ${appointmentData.email}

Seu agendamento foi criado com sucesso! Você receberá uma confirmação por email em breve.

Se precisar cancelar ou reagendar, me avise!`;

    } catch (error) {
      console.error('❌ Erro ao processar agendamento:', error);
      return `Desculpe, houve um erro técnico. Tente novamente em alguns minutos.`;
    }
  }

  // Se não temos dados suficientes, solicitar mais informações
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

function extractAppointmentData(message: string): any {
  console.log('🔍 Extraindo dados de agendamento da mensagem...');
  
  const result = {
    hasRequiredData: false,
    title: '',
    description: '',
    date: '',
    displayDate: '',
    startTime: '',
    endTime: '',
    email: '',
    location: 'Clínica'
  };

  const lowerMessage = message.toLowerCase();
  
  // Extrair email
  const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
  const emailMatch = message.match(emailRegex);
  if (emailMatch) {
    result.email = emailMatch[0];
    console.log('📧 Email encontrado:', result.email);
  }

  // Extrair data (formatos: DD/MM/YYYY, DD/MM, DD de MMMM)
  const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
  const dateMatch = message.match(dateRegex);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    const year = dateMatch[3];
    result.date = `${year}-${month}-${day}`;
    result.displayDate = `${day}/${month}/${year}`;
    console.log('📅 Data encontrada:', result.date);
  } else {
    // Tentar formato "DD de MMMM"
    const monthNames = {
      'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
      'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
      'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
    };
    
    const textDateRegex = /(\d{1,2})\s+de\s+(\w+)/i;
    const textDateMatch = message.match(textDateRegex);
    if (textDateMatch) {
      const day = textDateMatch[1].padStart(2, '0');
      const monthName = textDateMatch[2].toLowerCase();
      const monthNum = monthNames[monthName];
      if (monthNum) {
        const currentYear = new Date().getFullYear();
        result.date = `${currentYear}-${monthNum}-${day}`;
        result.displayDate = `${day}/${monthNum}/${currentYear}`;
        console.log('📅 Data em texto encontrada:', result.date);
      }
    }
  }

  // Extrair horário
  const timeRegex = /(\d{1,2}):?(\d{0,2})\s*h?(?:oras?)?(?:\s*(?:às?|até)\s*(\d{1,2}):?(\d{0,2})\s*h?(?:oras?)?)?/g;
  const timeMatches = [...message.matchAll(timeRegex)];
  
  if (timeMatches.length > 0) {
    const firstTime = timeMatches[0];
    const startHour = firstTime[1].padStart(2, '0');
    const startMin = (firstTime[2] || '00').padStart(2, '0');
    result.startTime = `${startHour}:${startMin}`;
    
    // Se há horário de fim especificado
    if (firstTime[3]) {
      const endHour = firstTime[3].padStart(2, '0');
      const endMin = (firstTime[4] || '00').padStart(2, '0');
      result.endTime = `${endHour}:${endMin}`;
    } else {
      // Assumir 1 hora de duração
      const endHour = (parseInt(startHour) + 1).toString().padStart(2, '0');
      result.endTime = `${endHour}:${startMin}`;
    }
    
    console.log('🕐 Horário encontrado:', result.startTime, '-', result.endTime);
  }

  // Extrair tipo de consulta
  const consultationTypes = [
    'dermatologia', 'cardiologia', 'neurologia', 'ortopedia',
    'ginecologia', 'pediatria', 'consulta geral', 'retorno',
    'check-up', 'exame'
  ];
  
  for (const type of consultationTypes) {
    if (lowerMessage.includes(type)) {
      result.title = type.charAt(0).toUpperCase() + type.slice(1);
      console.log('👨‍⚕️ Tipo de consulta encontrado:', result.title);
      break;
    }
  }

  // Se não encontrou tipo específico, usar padrão
  if (!result.title) {
    result.title = 'Consulta Médica';
  }

  // Verificar se temos dados suficientes
  result.hasRequiredData = !!(result.date && result.startTime && result.endTime && result.email);
  
  console.log('✅ Dados extraídos:', {
    hasRequiredData: result.hasRequiredData,
    title: result.title,
    date: result.date,
    startTime: result.startTime,
    endTime: result.endTime,
    email: result.email
  });

  return result;
}
