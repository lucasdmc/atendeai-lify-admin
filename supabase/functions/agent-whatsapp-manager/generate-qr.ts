import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { agentId } = await req.json();
    
    if (!agentId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'agentId é obrigatório' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const whatsappServerUrl = Deno.env.get('WHATSAPP_SERVER_URL') || 'http://31.97.241.19:3001';

    console.log(`Generating QR Code for agent ${agentId}`);
    console.log(`Using WhatsApp server: ${whatsappServerUrl}`);

    // Chama o backend Node para gerar o QR Code
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos

    try {
      const response = await fetch(`${whatsappServerUrl}/api/whatsapp/generate-qr`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-Edge-Function/1.0'
        },
        body: JSON.stringify({ agentId }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log(`Backend response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Backend error: ${response.status} - ${errorText}`);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Erro ao gerar QR Code no servidor WhatsApp (${response.status}): ${errorText}`, 
            status: 'error' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      console.log(`Backend response data: ${JSON.stringify(data).substring(0, 200)}...`);
      
      if (!data.success) {
        console.error('Backend returned error:', data.error);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: data.error || 'Erro ao gerar QR Code no backend', 
            status: 'error' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!data.qrCode) {
        console.error('QR Code not returned by backend');
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'QR Code não foi retornado pelo servidor', 
            status: 'error' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('QR Code generated successfully');
      return new Response(
        JSON.stringify({ 
          success: true,
          qrCode: data.qrCode,
          message: data.message,
          agentId: data.agentId,
          whatsappNumber: data.whatsappNumber,
          connectionId: data.connectionId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.code === 'AbortError') {
        console.error('Request to WhatsApp backend timed out.');
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Tempo de espera excedido para gerar o QR Code do WhatsApp.', 
            status: 'error' 
          }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('Error in generate-qr:', error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error.message, 
          status: 'error' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in generate-qr:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message, 
        status: 'error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 