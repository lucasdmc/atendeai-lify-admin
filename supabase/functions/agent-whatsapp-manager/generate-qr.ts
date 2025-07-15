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
    
    // Para desenvolvimento local, usar localhost
    // Para produção, usar VPS
    // Como a Edge Function roda no Supabase, sempre usar VPS
    const whatsappServerUrl = Deno.env.get('WHATSAPP_SERVER_URL') || 'http://31.97.241.19:3001';

    console.log(`Generating QR Code for agent ${agentId}`);
    console.log(`Using WhatsApp server: ${whatsappServerUrl}`);

    // Chama o backend Node para gerar o QR Code
    const response = await fetch(`${whatsappServerUrl}/api/whatsapp/generate-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Erro ao gerar QR Code no servidor WhatsApp (${response.status})`, 
          status: 'error' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`Backend response: ${JSON.stringify(data).substring(0, 200)}...`);
    
    if (!data.qrCode) {
      console.error('QR Code not returned by backend');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'QR Code não retornado pelo backend', 
          status: 'error' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('QR Code generated successfully');
    return new Response(
      JSON.stringify({ 
        success: true,
        qrCode: data.qrCode 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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