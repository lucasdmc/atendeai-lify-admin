
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SYSTEM_PROMPT = `Você é um assistente especializado em contextualização de clínicas médicas. Sua função é:

1. Fazer perguntas estruturadas para coletar informações essenciais da clínica
2. Garantir que todas as informações básicas sejam coletadas
3. Organizar as respostas de forma clara e estruturada
4. Manter uma temperatura baixa para ser preciso e objetivo

Sempre que o usuário responder uma pergunta, você deve:
- Confirmar a informação recebida
- Fazer a próxima pergunta relevante
- Manter o foco nas informações essenciais da clínica

Use um tom profissional mas amigável. Seja direto e objetivo nas perguntas.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();

    console.log('Contextualize chat - Message received:', message);
    console.log('User ID:', userId);

    // Buscar perguntas de contextualização não respondidas
    const { data: questions, error: questionsError } = await supabase
      .from('contextualization_data')
      .select('*')
      .order('order_number', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      throw questionsError;
    }

    // Verificar se existem perguntas não respondidas
    const unansweredQuestions = questions?.filter(q => !q.answer) || [];
    const currentQuestion = unansweredQuestions[0];

    // Construir contexto das perguntas já respondidas
    const answeredQuestions = questions?.filter(q => q.answer) || [];
    let context = "Informações já coletadas da clínica:\n";
    answeredQuestions.forEach(q => {
      context += `${q.question}: ${q.answer}\n`;
    });

    let systemMessage = SYSTEM_PROMPT;
    if (currentQuestion) {
      systemMessage += `\n\nPróxima pergunta a fazer: "${currentQuestion.question}"`;
    }
    if (context.length > 50) {
      systemMessage += `\n\nContexto já coletado:\n${context}`;
    }

    // Chamada para OpenAI com temperatura baixa para precisão
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: message }
        ],
        temperature: 0.2, // Baixa temperatura para respostas precisas
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Tentar identificar se a mensagem do usuário responde à pergunta atual
    if (currentQuestion && message.length > 10) {
      // Salvar a resposta na base de dados
      const { error: updateError } = await supabase
        .from('contextualization_data')
        .update({ 
          answer: message,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentQuestion.id);

      if (updateError) {
        console.error('Error updating question:', updateError);
      } else {
        console.log('Question answered and saved:', currentQuestion.question);
      }
    }

    // Verificar se todas as perguntas foram respondidas
    const { data: updatedQuestions } = await supabase
      .from('contextualization_data')
      .select('*')
      .order('order_number', { ascending: true });

    const allAnswered = updatedQuestions?.every(q => q.answer) || false;

    if (allAnswered) {
      // Gerar e salvar base de conhecimento consolidada
      const knowledgeBase = {};
      updatedQuestions?.forEach(q => {
        const key = q.question.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .substring(0, 50);
        knowledgeBase[key] = q.answer;
      });

      // Salvar na tabela de base de conhecimento
      const { error: kbError } = await supabase
        .from('clinic_knowledge_base')
        .upsert({
          clinic_id: userId,
          knowledge_data: knowledgeBase,
          is_active: true,
          updated_at: new Date().toISOString()
        });

      if (kbError) {
        console.error('Error saving knowledge base:', kbError);
      } else {
        console.log('Knowledge base saved successfully');
      }
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      questionsCompleted: allAnswered,
      totalQuestions: questions?.length || 0,
      answeredQuestions: answeredQuestions.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in contextualize-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "Desculpe, ocorreu um erro. Por favor, tente novamente."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
