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

    console.log(`Testing simple connection to: ${whatsappServerUrl}`);

    // Teste 1: Health check simples
    console.log('Testing health endpoint...');
    const healthResponse = await fetch(`${whatsappServerUrl}/health`);
    console.log(`Health response status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`Health data: ${JSON.stringify(healthData)}`);
    }

    // Teste 2: POST simples sem dados
    console.log('Testing POST to generate-qr with minimal data...');
    const postResponse = await fetch(`${whatsappServerUrl}/api/whatsapp/generate-qr`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Supabase-Edge-Function/1.0)',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ agentId: 'test-simple' })
    });

    console.log(`POST response status: ${postResponse.status}`);
    
    if (postResponse.ok) {
      const postData = await postResponse.json();
      console.log(`POST data: ${JSON.stringify(postData).substring(0, 200)}...`);
    } else {
      const errorText = await postResponse.text();
      console.log(`POST error: ${errorText}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Simple connection test completed',
        health: healthResponse.ok,
        post: postResponse.ok,
        healthStatus: healthResponse.status,
        postStatus: postResponse.status
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in test-simple-connection:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 