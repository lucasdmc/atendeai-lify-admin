
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders } from './config.ts';
import { initializeWhatsApp, getConnectionStatus, disconnectWhatsApp } from './whatsapp-client.ts';
import { sendMessage } from './message-sender.ts';
import { handleWebhook } from './webhook-processor.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
        console.log('=== WEBHOOK RECEBIDO ===');
        console.log('Raw webhook data:', JSON.stringify(webhookData, null, 2));
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
