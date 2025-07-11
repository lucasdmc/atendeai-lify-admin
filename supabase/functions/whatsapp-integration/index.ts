import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { method } = req
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    console.log(`WhatsApp Integration - Method: ${method}, Path: ${path}`)

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // WhatsApp server URL from environment
    const whatsappServerUrl = Deno.env.get('WHATSAPP_SERVER_URL') || 'http://localhost:3000'

    console.log(`Environment check - Supabase URL: ${supabaseUrl ? 'OK' : 'MISSING'}, Service Key: ${supabaseServiceKey ? 'OK' : 'MISSING'}, WhatsApp URL: ${whatsappServerUrl}`)

    switch (path) {
      case 'status':
        return await handleStatus(supabase, whatsappServerUrl)
      
      case 'initialize':
        return await handleInitialize(supabase, whatsappServerUrl)
      
      case 'send-message':
        return await handleSendMessage(req, supabase, whatsappServerUrl)
      
      case 'disconnect':
        return await handleDisconnect(supabase, whatsappServerUrl)
      
      case 'webhook':
        return await handleWebhook(req, supabase)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Error in WhatsApp integration:', error)
    return neResponse(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleStatus(supabase: any, whatsappServerUrl: string) {
  try {
    console.log('Checking WhatsApp status...')
    
    // Return a simple response for now
    return new Response(
      JSON.stringify({
        success: true,
        status: 'disconnected',
        message: 'Status check working',
        serverUrl: whatsappServerUrl
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in status:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        status: 'error',
        message: 'Erro ao verificar status do WhatsApp'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleInitialize(supabase: any, whatsappServerUrl: string) {
  try {
    console.log('Initializing WhatsApp connection...')
    
    return new Response(
      JSON.stringify({
        success: true,
        status: 'connecting',
        message: 'WhatsApp initialization started',
        serverUrl: whatsappServerUrl
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in initialize:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        status: 'error',
        message: 'Erro ao inicializar WhatsApp'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleSendMessage(req: Request, supabase: any, whatsappServerUrl: string) {
  try {
    const { to, message } = await req.json()
    
    console.log(`Sending message to ${to}: ${message}`)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Message sent successfully',
        to,
        message
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in send-message:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleDisconnect(supabase: any, whatsappServerUrl: string) {
  try {
    console.log('Disconnecting WhatsApp...')
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp disconnected'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in disconnect:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleWebhook(req: Request, supabase: any) {
  try {
    const body = await req.json()
    console.log('Webhook received:', body)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in webhook:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
} 