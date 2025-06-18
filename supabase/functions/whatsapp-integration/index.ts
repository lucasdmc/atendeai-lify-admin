
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simulação de uma API confiável do WhatsApp (substitua pela API real)
interface WhatsAppSession {
  id: string;
  qrCode?: string;
  status: 'disconnected' | 'qr' | 'connected';
  clientInfo?: any;
}

let currentSession: WhatsAppSession = {
  id: 'session_1',
  status: 'disconnected'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (path) {
      case 'generate-qr':
        return await generateQRCode();
      
      case 'status':
        return await getConnectionStatus();
      
      case 'send-message':
        const { to, message } = await req.json();
        return await sendMessage(to, message, supabase);
      
      case 'webhook':
        const webhookData = await req.json();
        return await handleWebhook(webhookData, supabase);
      
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

async function generateQRCode() {
  // Simular geração de QR Code (aqui você integraria com whatsapp-web.js ou similar)
  currentSession.status = 'qr';
  
  // QR Code simulado - em produção, seria gerado pela biblioteca real
  const qrCodeData = `whatsapp://qr/${Date.now()}`;
  currentSession.qrCode = `data:image/svg+xml;base64,${btoa(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white"/>
      <rect x="20" y="20" width="20" height="20" fill="black"/>
      <rect x="60" y="20" width="20" height="20" fill="black"/>
      <rect x="100" y="20" width="20" height="20" fill="black"/>
      <rect x="140" y="20" width="20" height="20" fill="black"/>
      <rect x="20" y="60" width="20" height="20" fill="black"/>
      <rect x="140" y="60" width="20" height="20" fill="black"/>
      <rect x="20" y="100" width="20" height="20" fill="black"/>
      <rect x="60" y="100" width="20" height="20" fill="black"/>
      <rect x="100" y="100" width="20" height="20" fill="black"/>
      <rect x="140" y="100" width="20" height="20" fill="black"/>
      <rect x="20" y="140" width="20" height="20" fill="black"/>
      <rect x="60" y="140" width="20" height="20" fill="black"/>
      <rect x="100" y="140" width="20" height="20" fill="black"/>
      <rect x="140" y="140" width="20" height="20" fill="black"/>
      <text x="100" y="190" text-anchor="middle" font-family="Arial" font-size="10" fill="black">Scan with WhatsApp</text>
    </svg>
  `)}`;

  // Simular conexão após 5 segundos
  setTimeout(() => {
    currentSession.status = 'connected';
    currentSession.clientInfo = {
      number: '+5511999999999',
      name: 'WhatsApp Business'
    };
  }, 5000);

  return new Response(JSON.stringify({
    success: true,
    qrCode: currentSession.qrCode,
    sessionId: currentSession.id
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getConnectionStatus() {
  return new Response(JSON.stringify({
    status: currentSession.status,
    clientInfo: currentSession.clientInfo
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function sendMessage(to: string, message: string, supabase: any) {
  if (currentSession.status !== 'connected') {
    throw new Error('WhatsApp not connected');
  }

  // Aqui você integraria com a API real do WhatsApp
  console.log(`Sending message to ${to}: ${message}`);

  // Salvar mensagem no banco
  const { error } = await supabase
    .from('whatsapp_messages')
    .insert({
      conversation_id: `conv_${to.replace(/\D/g, '')}`,
      content: message,
      message_type: 'outbound',
      whatsapp_message_id: `msg_${Date.now()}`
    });

  if (error) throw error;

  return new Response(JSON.stringify({
    success: true,
    messageId: `msg_${Date.now()}`
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleWebhook(data: any, supabase: any) {
  // Processar mensagens recebidas do WhatsApp
  console.log('Webhook received:', data);

  if (data.messages) {
    for (const message of data.messages) {
      // Salvar mensagem recebida
      await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: `conv_${message.from.replace(/\D/g, '')}`,
          content: message.text?.body || message.caption || 'Mensagem não suportada',
          message_type: 'inbound',
          whatsapp_message_id: message.id
        });

      // Criar ou atualizar conversa
      await supabase
        .from('whatsapp_conversations')
        .upsert({
          phone_number: message.from,
          name: message.profile?.name || message.from,
          updated_at: new Date().toISOString()
        });
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
