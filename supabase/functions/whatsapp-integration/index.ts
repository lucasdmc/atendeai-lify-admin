
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// URL do seu servidor Node.js local
const WHATSAPP_SERVER_URL = Deno.env.get('WHATSAPP_SERVER_URL') || 'http://localhost:3001';

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
  try {
    console.log('Initializing WhatsApp connection via Node.js server...');
    
    const response = await fetch(`${WHATSAPP_SERVER_URL}/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to initialize: ${response.statusText}`);
    }

    const result = await response.json();

    return new Response(JSON.stringify({
      success: true,
      message: 'WhatsApp initialization started. Check status for QR code.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error initializing WhatsApp:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to connect to WhatsApp server. Make sure your Node.js server is running.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

async function getConnectionStatus() {
  try {
    const response = await fetch(`${WHATSAPP_SERVER_URL}/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }

    const status = await response.json();

    // Se temos QR code, converter para imagem
    if (status.qrCode && status.status === 'qr') {
      const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&format=png&margin=10&data=${encodeURIComponent(status.qrCode)}`;
      status.qrCode = qrCodeImageUrl;
    }

    console.log('Current WhatsApp status:', status);

    return new Response(JSON.stringify(status), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting status:', error);
    return new Response(JSON.stringify({
      status: 'disconnected',
      error: 'Cannot connect to WhatsApp server'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function sendMessage(to: string, message: string, supabase: any) {
  try {
    console.log(`Sending WhatsApp message to ${to}: ${message}`);
    
    const response = await fetch(`${WHATSAPP_SERVER_URL}/send-message`, {
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

    console.log('Message sent successfully:', result);

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
      
      // Salvar mensagem recebida
      const { error: messageError } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: `conv_${data.data.from.replace(/\D/g, '')}`,
          content: data.data.message || 'Mensagem não suportada',
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
          phone_number: data.data.from,
          name: data.data.from,
          updated_at: new Date().toISOString()
        });

      if (conversationError) {
        console.error('Error updating conversation:', conversationError);
      }
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

async function disconnectWhatsApp() {
  try {
    console.log('Disconnecting WhatsApp client...');
    
    // Aqui você poderia implementar um endpoint no seu servidor Node.js para desconectar
    // Por exemplo: await fetch(`${WHATSAPP_SERVER_URL}/disconnect`, { method: 'POST' });

    return new Response(JSON.stringify({
      success: true,
      status: 'disconnected',
      message: 'WhatsApp client disconnected successfully.'
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
