
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Estado global da sessão WhatsApp
interface WhatsAppSession {
  id: string;
  qrCode?: string;
  status: 'disconnected' | 'qr' | 'connected' | 'initializing';
  clientInfo?: any;
  lastActivity: number;
}

let currentSession: WhatsAppSession = {
  id: `session_${Date.now()}`,
  status: 'disconnected',
  lastActivity: Date.now()
};

// Classe para simular a conexão WhatsApp Web
class WhatsAppClient {
  private session: WhatsAppSession;
  private eventCallbacks: Map<string, Function[]> = new Map();

  constructor(sessionId: string) {
    this.session = currentSession;
  }

  on(event: string, callback: Function) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  emit(event: string, data?: any) {
    const callbacks = this.eventCallbacks.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  async initialize() {
    console.log('Initializing WhatsApp client...');
    this.session.status = 'initializing';
    
    // Simular processo de inicialização
    setTimeout(() => {
      this.session.status = 'qr';
      this.generateQRCode();
    }, 2000);

    // Simular escaneamento do QR após 15 segundos
    setTimeout(() => {
      this.session.status = 'connected';
      this.session.clientInfo = {
        number: '+5511999999999',
        name: 'WhatsApp Business',
        platform: 'web'
      };
      this.emit('ready', this.session.clientInfo);
    }, 15000);
  }

  private async generateQRCode() {
    try {
      // Gerar dados únicos para o QR Code
      const sessionData = {
        ref: this.session.id,
        ttl: Date.now() + 300000, // 5 minutos
        secret: this.generateSecret()
      };
      
      const qrData = `1,${sessionData.ref},${sessionData.secret},${sessionData.ttl}`;
      
      // Usar API externa para gerar QR Code real
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
      
      console.log('Generated QR data:', qrData);
      console.log('QR API URL:', qrApiUrl);
      
      this.session.qrCode = qrApiUrl;
      this.emit('qr', this.session.qrCode);
      
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }

  private generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 43; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async sendMessage(to: string, message: string) {
    if (this.session.status !== 'connected') {
      throw new Error('WhatsApp client not connected');
    }

    console.log(`Sending message to ${to}: ${message}`);
    
    return {
      id: `msg_${Date.now()}`,
      to,
      body: message,
      timestamp: Date.now()
    };
  }

  getStatus() {
    return {
      status: this.session.status,
      clientInfo: this.session.clientInfo,
      qrCode: this.session.qrCode
    };
  }

  destroy() {
    this.session.status = 'disconnected';
    this.session.qrCode = undefined;
    this.session.clientInfo = undefined;
    this.eventCallbacks.clear();
  }
}

// Instância global do cliente
let whatsappClient: WhatsAppClient | null = null;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    console.log('Initializing WhatsApp connection...');
    
    // Criar nova instância do cliente se não existir
    if (!whatsappClient) {
      whatsappClient = new WhatsAppClient(currentSession.id);
    }

    // Configurar event listeners
    whatsappClient.on('qr', (qrCode: string) => {
      console.log('QR Code generated:', qrCode);
      currentSession.qrCode = qrCode;
    });

    whatsappClient.on('ready', (clientInfo: any) => {
      console.log('WhatsApp client ready:', clientInfo);
      currentSession.clientInfo = clientInfo;
    });

    // Inicializar cliente
    await whatsappClient.initialize();

    return new Response(JSON.stringify({
      success: true,
      sessionId: currentSession.id,
      status: currentSession.status,
      qrCode: currentSession.qrCode
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error initializing WhatsApp:', error);
    throw error;
  }
}

async function getConnectionStatus() {
  const status = whatsappClient ? whatsappClient.getStatus() : {
    status: currentSession.status,
    clientInfo: currentSession.clientInfo,
    qrCode: currentSession.qrCode
  };

  return new Response(JSON.stringify(status), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function sendMessage(to: string, message: string, supabase: any) {
  if (!whatsappClient || currentSession.status !== 'connected') {
    throw new Error('WhatsApp not connected');
  }

  try {
    const result = await whatsappClient.sendMessage(to, message);

    // Salvar mensagem no banco
    const { error } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: `conv_${to.replace(/\D/g, '')}`,
        content: message,
        message_type: 'outbound',
        whatsapp_message_id: result.id
      });

    if (error) throw error;

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
      messageId: result.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

async function handleWebhook(data: any, supabase: any) {
  console.log('Webhook received:', data);

  try {
    if (data.messages) {
      for (const message of data.messages) {
        // Salvar mensagem recebida
        const { error: messageError } = await supabase
          .from('whatsapp_messages')
          .insert({
            conversation_id: `conv_${message.from.replace(/\D/g, '')}`,
            content: message.text?.body || message.caption || 'Mensagem não suportada',
            message_type: 'inbound',
            whatsapp_message_id: message.id
          });

        if (messageError) {
          console.error('Error saving message:', messageError);
        }

        // Criar ou atualizar conversa
        const { error: conversationError } = await supabase
          .from('whatsapp_conversations')
          .upsert({
            phone_number: message.from,
            name: message.profile?.name || message.from,
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
    throw error;
  }
}

async function disconnectWhatsApp() {
  try {
    if (whatsappClient) {
      whatsappClient.destroy();
      whatsappClient = null;
    }

    currentSession = {
      id: `session_${Date.now()}`,
      status: 'disconnected',
      lastActivity: Date.now()
    };

    return new Response(JSON.stringify({
      success: true,
      status: 'disconnected'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error);
    throw error;
  }
}
