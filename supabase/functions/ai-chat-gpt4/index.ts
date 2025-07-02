import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

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
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Create OpenAI client
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    // Get request body
    const { messages, phoneNumber } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required')
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages as any[],
      max_tokens: 2000,
      temperature: 0.7,
      stream: false,
    })

    const response = completion.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.'

    // Log the interaction
    await supabase
      .from('ai_interactions')
      .insert({
        phone_number: phoneNumber,
        messages: messages,
        response: response,
        model: 'gpt-4o',
        tokens_used: completion.usage?.total_tokens || 0,
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ 
        response,
        tokens_used: completion.usage?.total_tokens,
        model: 'gpt-4o'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}) 