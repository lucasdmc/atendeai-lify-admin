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
    const whatsappServerUrl = Deno.env.get('WHATSAPP_SERVER_URL') || 'http://localhost:3000';

    // Chama o backend Node para gerar o QR Code
    const response = await fetch(`${whatsappServerUrl}/api/whatsapp/generate-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId }),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar QR Code no servidor WhatsApp', status: 'error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    if (!data.qrCode) {
      return new Response(
        JSON.stringify({ error: 'QR Code não retornado pelo backend', status: 'error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ qrCode: data.qrCode }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, status: 'error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 