import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Configuração do servidor WhatsApp - aceita IP direto ou domínio
const WHATSAPP_SERVER_URL = Deno.env.get('WHATSAPP_SERVER_URL');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`WhatsApp Integration - Endpoint called: ${path}`);
    console.log(`WHATSAPP_SERVER_URL configured as: ${WHATSAPP_SERVER_URL || 'NOT SET'}`);

    switch (path) {
      case 'initialize':
        return await initializeWhatsApp();
      
      case 'status':
        return await getConnectionStatus();
      
      case 'send-message':
        const { to, message } = await req.json();
        return await sendMessage(to, message, supabase);
      
      case 'webhook':
        const webhookData = await req.json();
        return await handleWebhook(webhookData, supabase);
      
      case 'disconnect':
        return await disconnectWhatsApp();
      
      default:
        return new Response('Not found', { status: 404, headers: corsHeaders });
    }
  } catch (error) {
    console.error('Error in whatsapp-integration:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function initializeWhatsApp() {
  // Verificar se o servidor WhatsApp está configurado
  if (!WHATSAPP_SERVER_URL) {
    console.log('WhatsApp server not configured, returning demo response');
    return new Response(JSON.stringify({
      success: true,
      message: 'WhatsApp server not configured. Configure WHATSAPP_SERVER_URL environment variable.',
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      status: 'demo'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const initUrl = `${WHATSAPP_SERVER_URL}/api/whatsapp/initialize`;
    console.log(`Trying to initialize WhatsApp via: ${initUrl}`);
    
    // Adicionar timeout para evitar travamento
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
    
    const response = await fetch(initUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log(`Initialize response status: ${response.status}`);
    console.log(`Initialize response ok: ${response.ok}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Server response error (${response.status}):`, errorText);
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Initialize result:', result);

    return new Response(JSON.stringify({
      success: true,
      message: 'WhatsApp initialization started successfully.',
      data: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error initializing WhatsApp:', error);
    
    if (error.name === 'AbortError') {
      return new Response(JSON.stringify({
        success: false,
        error: `Connection timeout to WhatsApp server at ${WHATSAPP_SERVER_URL}. The server may be down or unreachable.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: `Failed to connect to WhatsApp server at ${WHATSAPP_SERVER_URL}. Error: ${error.message}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

async function getConnectionStatus() {
  // Se não há servidor configurado, retornar status de demo
  if (!WHATSAPP_SERVER_URL) {
    return new Response(JSON.stringify({
      status: 'demo',
      message: 'WhatsApp server not configured - configure WHATSAPP_SERVER_URL'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const statusUrl = `${WHATSAPP_SERVER_URL}/api/whatsapp/status`;
    console.log(`Checking WhatsApp status at: ${statusUrl}`);
    
    // Adicionar timeout para evitar travamento
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
    
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`Status response status: ${response.status}`);
    console.log(`Status response ok: ${response.ok}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Status check failed (${response.status}):`, errorText);
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const status = await response.json();
    console.log('Status received:', status);

    return new Response(JSON.stringify(status), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting status:', error);
    
    if (error.name === 'AbortError') {
      return new Response(JSON.stringify({
        status: 'disconnected',
        error: `Connection timeout to WhatsApp server at ${WHATSAPP_SERVER_URL}. The server may be down or unreachable.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({
      status: 'disconnected',
      error: `Cannot reach WhatsApp server at ${WHATSAPP_SERVER_URL}. Error: ${error.message}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function sendMessage(to: string, message: string, supabase: any) {
  // Verificar se o servidor WhatsApp está configurado
  if (!WHATSAPP_SERVER_URL) {
    throw new Error('WhatsApp server not configured');
  }

  try {
    console.log(`Sending WhatsApp message to ${to}: ${message}`);
    
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/whatsapp/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: to,
        message: message
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }

    const result = await response.json();
    console.log('Message sent successfully:', result);

    // Salvar mensagem no banco
    const { error } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: `conv_${to.replace(/\D/g, '')}`,
        content: message,
        message_type: 'outbound',
        whatsapp_message_id: result.messageId || `msg_${Date.now()}`
      });

    if (error) {
      console.error('Error saving message to database:', error);
    }

    // Atualizar conversa
    await supabase
      .from('whatsapp_conversations')
      .upsert({
        phone_number: to,
        name: to,
        updated_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({
      success: true,
      messageId: result.messageId,
      status: 'sent'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

async function handleWebhook(data: any, supabase: any) {
  console.log('WhatsApp webhook received:', data);

  try {
    if (data.event === 'message.received' && data.data) {
      console.log('Processing incoming message:', data.data);
      
      const messageContent = data.data.message || 'Mensagem não suportada';
      const fromNumber = data.data.from;
      
      // Salvar mensagem recebida
      const { error: messageError } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: `conv_${fromNumber.replace(/\D/g, '')}`,
          content: messageContent,
          message_type: 'inbound',
          whatsapp_message_id: `msg_${data.data.timestamp || Date.now()}`
        });

      if (messageError) {
        console.error('Error saving incoming message:', messageError);
      }

      // Criar ou atualizar conversa
      const { error: conversationError } = await supabase
        .from('whatsapp_conversations')
        .upsert({
          phone_number: fromNumber,
          name: fromNumber,
          updated_at: new Date().toISOString()
        });

      if (conversationError) {
        console.error('Error updating conversation:', conversationError);
      }

      // NOVA FUNCIONALIDADE: Processar mensagem com IA e responder automaticamente
      await processAndRespondWithAI(fromNumber, messageContent, supabase);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function processAndRespondWithAI(phoneNumber: string, message: string, supabase: any) {
  console.log(`Processando mensagem com IA para ${phoneNumber}: ${message}`);
  
  try {
    // Buscar contexto da clínica
    const { data: contextData } = await supabase
      .from('contextualization_data')
      .select('question, answer')
      .order('order_number');

    // Buscar histórico recente da conversa
    const { data: recentMessages } = await supabase
      .from('whatsapp_messages')
      .select('content, message_type, timestamp')
      .eq('conversation_id', `conv_${phoneNumber.replace(/\D/g, '')}`)
      .order('timestamp', { ascending: false })
      .limit(10);

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
              role: msg.message_type === 'inbound' ? 'user' : 'assistant',
              content: msg.content
            });
          }
        });
    }

    // Adicionar mensagem atual
    messages.push({ role: 'user', content: message });

    // Chamar a OpenAI se a chave estiver configurada
    let aiResponse = 'Olá! Obrigado por entrar em contato. Como posso ajudá-lo hoje?';
    
    if (openAIApiKey) {
      try {
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

        if (response.ok) {
          const data = await response.json();
          aiResponse = data.choices[0].message.content;
          console.log('Resposta IA gerada:', aiResponse.substring(0, 100) + '...');
        } else {
          console.error('Erro na OpenAI API:', response.status);
        }
      } catch (error) {
        console.error('Erro ao chamar OpenAI:', error);
      }
    }

    // Enviar resposta de volta via WhatsApp
    await sendMessage(phoneNumber, aiResponse, supabase);
    
    console.log(`Resposta automática enviada para ${phoneNumber}`);
    
  } catch (error) {
    console.error('Erro ao processar mensagem com IA:', error);
    
    // Enviar mensagem de erro genérica
    try {
      await sendMessage(phoneNumber, 'Desculpe, estou com dificuldades no momento. Tente novamente em alguns minutos ou entre em contato por telefone.', supabase);
    } catch (sendError) {
      console.error('Erro ao enviar mensagem de erro:', sendError);
    }
  }
}

async function disconnectWhatsApp() {
  // Se não há servidor configurado, retornar sucesso
  if (!WHATSAPP_SERVER_URL) {
    return new Response(JSON.stringify({
      success: true,
      status: 'disconnected',
      message: 'WhatsApp server not configured.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Disconnecting WhatsApp client...');
    
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/whatsapp/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = response.ok ? await response.json() : null;

    return new Response(JSON.stringify({
      success: true,
      status: 'disconnected',
      message: 'WhatsApp client disconnected successfully.',
      data: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error);
    return new Response(JSON.stringify({
      success: true,
      status: 'disconnected',
      message: 'WhatsApp client disconnected.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
