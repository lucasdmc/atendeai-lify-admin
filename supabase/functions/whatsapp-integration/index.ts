
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Configuração da Evolution API
const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL') || 'https://api.evolution.com.br';
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Estado global da sessão WhatsApp
interface WhatsAppSession {
  instanceName: string;
  qrCode?: string;
  status: 'disconnected' | 'qr' | 'connected' | 'initializing';
  clientInfo?: any;
  lastActivity: number;
}

let currentSession: WhatsAppSession = {
  instanceName: `instance_${Date.now()}`,
  status: 'disconnected',
  lastActivity: Date.now()
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
    console.log('Initializing WhatsApp connection using Evolution API...');
    
    currentSession.status = 'initializing';
    
    // Criar uma nova instância na Evolution API
    const createInstanceResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        instanceName: currentSession.instanceName,
        webhook: `${supabaseUrl}/functions/v1/whatsapp-integration/webhook`,
        webhookByEvents: true,
        events: [
          'APPLICATION_STARTUP',
          'QRCODE_UPDATED',
          'CONNECTION_UPDATE',
          'MESSAGES_UPSERT'
        ]
      })
    });

    if (!createInstanceResponse.ok) {
      throw new Error(`Failed to create instance: ${createInstanceResponse.statusText}`);
    }

    const instanceData = await createInstanceResponse.json();
    console.log('Instance created:', instanceData);

    // Conectar a instância para gerar QR Code
    const connectResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${currentSession.instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    if (!connectResponse.ok) {
      throw new Error(`Failed to connect instance: ${connectResponse.statusText}`);
    }

    currentSession.status = 'qr';

    // Aguardar um pouco e buscar o QR Code
    await new Promise(resolve => setTimeout(resolve, 2000));

    const qrResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${currentSession.instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    if (qrResponse.ok) {
      const qrData = await qrResponse.json();
      if (qrData.qrcode && qrData.qrcode.code) {
        // Gerar imagem do QR Code
        const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&format=png&margin=10&data=${encodeURIComponent(qrData.qrcode.code)}`;
        currentSession.qrCode = qrCodeImageUrl;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      instanceName: currentSession.instanceName,
      status: currentSession.status,
      qrCode: currentSession.qrCode,
      message: 'WhatsApp connection initialized. Please scan the QR code with your WhatsApp app.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error initializing WhatsApp:', error);
    currentSession.status = 'disconnected';
    
    // Fallback: Gerar QR Code de exemplo para demonstração
    const fallbackQRData = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fallbackQRUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&format=png&margin=10&data=${encodeURIComponent(fallbackQRData)}`;
    
    currentSession.qrCode = fallbackQRUrl;
    currentSession.status = 'qr';
    
    console.log('Using fallback QR code for demonstration');
    
    return new Response(JSON.stringify({
      success: true,
      instanceName: currentSession.instanceName,
      status: currentSession.status,
      qrCode: currentSession.qrCode,
      message: 'Demo QR code generated. Configure Evolution API credentials for real connection.',
      isDemo: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function getConnectionStatus() {
  try {
    if (EVOLUTION_API_KEY && EVOLUTION_API_URL) {
      // Verificar status real da instância
      const statusResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${currentSession.instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (statusData.state === 'open') {
          currentSession.status = 'connected';
          
          // Buscar informações do cliente
          const infoResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
            method: 'GET',
            headers: {
              'apikey': EVOLUTION_API_KEY
            }
          });

          if (infoResponse.ok) {
            const instances = await infoResponse.json();
            const currentInstance = instances.find((inst: any) => inst.instanceName === currentSession.instanceName);
            if (currentInstance) {
              currentSession.clientInfo = {
                number: currentInstance.owner?.id || 'Conectado',
                name: currentInstance.owner?.name || 'WhatsApp Business',
                platform: 'web',
                connectedAt: new Date().toISOString()
              };
            }
          }
        }
      }
    }

    const status = {
      status: currentSession.status,
      clientInfo: currentSession.clientInfo,
      qrCode: currentSession.qrCode,
      instanceName: currentSession.instanceName
    };

    console.log('Current WhatsApp status:', status);

    return new Response(JSON.stringify(status), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting status:', error);
    return new Response(JSON.stringify({
      status: currentSession.status,
      clientInfo: currentSession.clientInfo,
      qrCode: currentSession.qrCode,
      instanceName: currentSession.instanceName
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function sendMessage(to: string, message: string, supabase: any) {
  if (currentSession.status !== 'connected') {
    throw new Error('WhatsApp not connected. Please scan the QR code first.');
  }

  try {
    console.log(`Sending WhatsApp message to ${to}: ${message}`);
    
    const sendResponse = await fetch(`${EVOLUTION_API_URL}/message/sendText/${currentSession.instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: to,
        text: message
      })
    });

    if (!sendResponse.ok) {
      throw new Error(`Failed to send message: ${sendResponse.statusText}`);
    }

    const result = await sendResponse.json();

    // Salvar mensagem no banco
    const { error } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: `conv_${to.replace(/\D/g, '')}`,
        content: message,
        message_type: 'outbound',
        whatsapp_message_id: result.key?.id || `msg_${Date.now()}`
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
      messageId: result.key?.id || `msg_${Date.now()}`,
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
    // Processar eventos da Evolution API
    if (data.event === 'qrcode.updated') {
      console.log('QR Code updated:', data.data);
      if (data.data.qrcode) {
        const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&format=png&margin=10&data=${encodeURIComponent(data.data.qrcode)}`;
        currentSession.qrCode = qrCodeImageUrl;
        currentSession.status = 'qr';
      }
    }

    if (data.event === 'connection.update') {
      console.log('Connection update:', data.data);
      if (data.data.state === 'open') {
        currentSession.status = 'connected';
      } else if (data.data.state === 'close') {
        currentSession.status = 'disconnected';
      }
    }

    if (data.event === 'messages.upsert' && data.data) {
      for (const message of data.data) {
        if (message.key.fromMe) continue; // Ignorar mensagens enviadas por nós
        
        console.log('Processing incoming message:', message);
        
        // Salvar mensagem recebida
        const { error: messageError } = await supabase
          .from('whatsapp_messages')
          .insert({
            conversation_id: `conv_${message.key.remoteJid.replace(/\D/g, '')}`,
            content: message.message?.conversation || message.message?.extendedTextMessage?.text || 'Mensagem não suportada',
            message_type: 'inbound',
            whatsapp_message_id: message.key.id
          });

        if (messageError) {
          console.error('Error saving incoming message:', messageError);
        }

        // Criar ou atualizar conversa
        const { error: conversationError } = await supabase
          .from('whatsapp_conversations')
          .upsert({
            phone_number: message.key.remoteJid,
            name: message.pushName || message.key.remoteJid,
            updated_at: new Date().toISOString()
          });

        if (conversationError) {
          console.error('Error updating conversation:', conversationError);
        }
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
    
    if (EVOLUTION_API_KEY && currentSession.instanceName) {
      await fetch(`${EVOLUTION_API_URL}/instance/logout/${currentSession.instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      });
    }

    currentSession = {
      instanceName: `instance_${Date.now()}`,
      status: 'disconnected',
      lastActivity: Date.now()
    };

    console.log('WhatsApp client disconnected successfully.');

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
