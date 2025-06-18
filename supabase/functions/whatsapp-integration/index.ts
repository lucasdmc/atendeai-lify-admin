
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

// Simular conexão com WhatsApp Web (em produção, usar whatsapp-web.js)
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

    // Simular escaneamento do QR após 10 segundos
    setTimeout(() => {
      this.session.status = 'connected';
      this.session.clientInfo = {
        number: '+55119999999999',
        name: 'WhatsApp Business',
        platform: 'web'
      };
      this.emit('ready', this.session.clientInfo);
    }, 15000);
  }

  private generateQRCode() {
    // Em produção, este seria o QR real do WhatsApp
    const qrData = `whatsapp://connect/${this.session.id}/${Date.now()}`;
    
    // Gerar SVG do QR Code (simplificado para demo)
    const qrSvg = this.generateQRSvg(qrData);
    this.session.qrCode = `data:image/svg+xml;base64,${btoa(qrSvg)}`;
    
    this.emit('qr', this.session.qrCode);
  }

  private generateQRSvg(data: string): string {
    // QR Code SVG simplificado para demonstração
    const size = 200;
    const cellSize = 4;
    const cells = size / cellSize;
    
    let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${size}" height="${size}" fill="white"/>`;
    
    // Criar padrão de QR Code baseado nos dados
    const hash = this.simpleHash(data);
    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < cells; j++) {
        if ((hash + i * j) % 3 === 0) {
          const x = i * cellSize;
          const y = j * cellSize;
          svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
        }
      }
    }
    
    // Adicionar cantos de posicionamento
    this.addPositionMarkers(svg, size, cellSize);
    
    svg += `<text x="${size/2}" y="${size-10}" text-anchor="middle" font-family="Arial" font-size="12" fill="black">Scan with WhatsApp</text>`;
    svg += '</svg>';
    
    return svg;
  }

  private addPositionMarkers(svg: string, size: number, cellSize: number) {
    const markerSize = cellSize * 7;
    
    // Canto superior esquerdo
    svg += `<rect x="0" y="0" width="${markerSize}" height="${markerSize}" fill="black"/>`;
    svg += `<rect x="${cellSize}" y="${cellSize}" width="${markerSize-2*cellSize}" height="${markerSize-2*cellSize}" fill="white"/>`;
    svg += `<rect x="${cellSize*2}" y="${cellSize*2}" width="${markerSize-4*cellSize}" height="${markerSize-4*cellSize}" fill="black"/>`;
    
    // Canto superior direito
    const rightX = size - markerSize;
    svg += `<rect x="${rightX}" y="0" width="${markerSize}" height="${markerSize}" fill="black"/>`;
    svg += `<rect x="${rightX+cellSize}" y="${cellSize}" width="${markerSize-2*cellSize}" height="${markerSize-2*cellSize}" fill="white"/>`;
    svg += `<rect x="${rightX+cellSize*2}" y="${cellSize*2}" width="${markerSize-4*cellSize}" height="${markerSize-4*cellSize}" fill="black"/>`;
    
    // Canto inferior esquerdo
    const bottomY = size - markerSize;
    svg += `<rect x="0" y="${bottomY}" width="${markerSize}" height="${markerSize}" fill="black"/>`;
    svg += `<rect x="${cellSize}" y="${bottomY+cellSize}" width="${markerSize-2*cellSize}" height="${markerSize-2*cellSize}" fill="white"/>`;
    svg += `<rect x="${cellSize*2}" y="${bottomY+cellSize*2}" width="${markerSize-4*cellSize}" height="${markerSize-4*cellSize}" fill="black"/>`;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  async sendMessage(to: string, message: string) {
    if (this.session.status !== 'connected') {
      throw new Error('WhatsApp client not connected');
    }

    console.log(`Sending message to ${to}: ${message}`);
    
    // Em produção, usar a API real
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
      console.log('QR Code generated');
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
