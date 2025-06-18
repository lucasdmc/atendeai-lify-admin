
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get existing contextualization data
    const { data: contextData } = await supabase
      .from('contextualization_data')
      .select('*')
      .order('order_number');

    const systemPrompt = `Você é um assistente especializado em configurar chatbots para clínicas e hospitais. 
    Sua função é fazer perguntas para contextualizar o chatbot com informações específicas da clínica.
    
    Perguntas que você deve fazer (em ordem):
    ${contextData?.map((item, index) => `${index + 1}. ${item.question}`).join('\n')}
    
    Seja amigável, profissional e faça uma pergunta por vez. Quando o usuário responder, agradeça e faça a próxima pergunta.
    Se o usuário disser que terminou ou não quer mais perguntas, agradeça e confirme que a contextualização foi salva.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in contextualize-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
