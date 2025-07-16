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
    const whatsappServerUrl = Deno.env.get('WHATSAPP_SERVER_URL') || 'http://31.97.241.19:3001';

    console.log(`Testing connection to: ${whatsappServerUrl}`);

    // Teste 1: Health check
    console.log('Testing health endpoint...');
    const healthResponse = await fetch(`${whatsappServerUrl}/health`);
    console.log(`Health response status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health data:', healthData);
    } else {
      const healthError = await healthResponse.text();
      console.error('Health error:', healthError);
    }

    // Teste 2: Generate QR endpoint
    console.log('Testing generate-qr endpoint...');
    const qrResponse = await fetch(`${whatsappServerUrl}/api/whatsapp/generate-qr`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0'
      },
      body: JSON.stringify({ agentId: 'test-agent-connection' })
    });

    console.log(`QR response status: ${qrResponse.status}`);
    console.log(`QR response headers: ${JSON.stringify(Object.fromEntries(qrResponse.headers.entries()))}`);

    if (qrResponse.ok) {
      const qrData = await qrResponse.json();
      console.log('QR data:', qrData);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Connection test successful',
          health: healthResponse.ok,
          qr: qrResponse.ok,
          qrData: qrData
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const qrError = await qrResponse.text();
      console.error('QR error:', qrError);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `QR endpoint failed: ${qrResponse.status} - ${qrError}`,
          health: healthResponse.ok,
          qr: false
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Connection test error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 