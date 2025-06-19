
export const WHATSAPP_SERVER_URL = Deno.env.get('WHATSAPP_SERVER_URL') || 'https://lify-chatbot-production.up.railway.app';
export const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
