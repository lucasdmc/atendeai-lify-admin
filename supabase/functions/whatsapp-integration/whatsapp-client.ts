
import { WHATSAPP_SERVER_URL, corsHeaders } from './config.ts';

export async function initializeWhatsApp() {
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
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(initUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log(`Initialize response status: ${response.status}`);

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

export async function getConnectionStatus() {
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
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`Status response status: ${response.status}`);
    
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

export async function disconnectWhatsApp() {
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
