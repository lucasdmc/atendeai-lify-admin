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
    const { query, intent, entities } = await req.json()

    if (!query) {
      throw new Error('Query is required')
    }

    // Search for relevant documents
    const { data: documents, error } = await supabase
      .from('clinic_knowledge_base')
      .select('*')
      .textSearch('content', query, {
        type: 'websearch',
        config: 'portuguese'
      })
      .limit(5)

    if (error) {
      console.error('Search error:', error)
      throw error
    }

    // If no documents found, search in contextualization_data
    let relevantDocs = documents
    if (!documents || documents.length === 0) {
      const { data: contextData } = await supabase
        .from('contextualization_data')
        .select('question, answer')
        .or(`question.ilike.%${query}%,answer.ilike.%${query}%`)
        .limit(5)

      relevantDocs = contextData?.map((item: any) => ({
        id: item.id,
        title: item.question,
        content: item.answer,
        type: 'contextualization'
      })) || []
    }

    // Generate augmented prompt
    let augmentedPrompt = query
    if (relevantDocs && relevantDocs.length > 0) {
      const context = relevantDocs
        .map((doc: any) => `${doc.title || 'Informação'}: ${doc.content}`)
        .join('\n\n')

      augmentedPrompt = `Com base nas seguintes informações da clínica:

${context}

Pergunta do usuário: ${query}

Por favor, responda usando APENAS as informações fornecidas acima. Se uma informação não estiver disponível, diga educadamente que não possui essa informação.`
    }

    return new Response(
      JSON.stringify({ 
        augmentedPrompt,
        sources: relevantDocs || [],
        intent,
        entities
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
        augmentedPrompt: 'Erro na busca',
        sources: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}) 