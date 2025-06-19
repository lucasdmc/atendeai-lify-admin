
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
2. Confirmar as informações recebidas de forma clara e educada
3. Fazer APENAS a próxima pergunta na sequência
4. Manter um tom profissional mas amigável

REGRAS IMPORTANTES:
- NUNCA repita uma pergunta que já foi respondida
- Sempre confirme a resposta antes de fazer a próxima pergunta
- Seja objetivo e direto
- Quando todas as perguntas estiverem respondidas, parabenize o usuário pela conclusão da contextualização

Use frases como:
- "Perfeito! Anotei que..."
- "Entendido! Agora preciso saber..."
- "Ótimo! Última pergunta..."`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();

    console.log('Contextualize chat - Message received:', message);
    console.log('User ID:', userId);

    // Buscar perguntas de contextualização
    const { data: questions, error: questionsError } = await supabase
      .from('contextualization_data')
      .select('*')
      .order('order_number', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      throw questionsError;
    }

    // Separar perguntas respondidas e não respondidas
    const answeredQuestions = questions?.filter(q => q.answer && q.answer.trim() !== '') || [];
    const unansweredQuestions = questions?.filter(q => !q.answer || q.answer.trim() === '') || [];
    
    console.log('Answered questions:', answeredQuestions.length);
    console.log('Unanswered questions:', unansweredQuestions.length);

    // Se for uma resposta válida (mais de 2 caracteres) e há perguntas não respondidas
    const isValidResponse = message.trim().length > 2;
    let questionToUpdate = null;

    if (isValidResponse && unansweredQuestions.length > 0) {
      // Pegar a primeira pergunta não respondida para salvar a resposta
      questionToUpdate = unansweredQuestions[0];
    }

    // Construir contexto das perguntas já respondidas
    let context = "";
    if (answeredQuestions.length > 0) {
      context = "Informações já coletadas da clínica:\n";
      answeredQuestions.forEach(q => {
        context += `- ${q.question}: ${q.answer}\n`;
      });
      context += "\n";
    }

    // Determinar próxima pergunta após salvar a resposta atual
    let nextQuestion = null;
    if (questionToUpdate) {
      // Se vamos salvar uma resposta, a próxima pergunta será a seguinte na lista
      const currentIndex = unansweredQuestions.findIndex(q => q.id === questionToUpdate.id);
      if (currentIndex < unansweredQuestions.length - 1) {
        nextQuestion = unansweredQuestions[currentIndex + 1];
      }
    } else if (unansweredQuestions.length > 0) {
      // Se não há resposta para salvar, usar a primeira pergunta não respondida
      nextQuestion = unansweredQuestions[0];
    }

    // Construir prompt para o AI
    let systemMessage = SYSTEM_PROMPT;
    
    if (context) {
      systemMessage += `\n\nContexto já coletado:\n${context}`;
    }

    if (questionToUpdate) {
      systemMessage += `\n\nO usuário acabou de responder a pergunta: "${questionToUpdate.question}"`;
      systemMessage += `\nConfirme a resposta de forma positiva e`;
      
      if (nextQuestion) {
        systemMessage += ` faça a próxima pergunta: "${nextQuestion.question}"`;
      } else {
        systemMessage += ` informe que a contextualização foi concluída com sucesso. Parabenize o usuário e explique que agora o chatbot está pronto para atender os pacientes com as informações da clínica.`;
      }
    } else if (nextQuestion) {
      systemMessage += `\n\nFaça a seguinte pergunta: "${nextQuestion.question}"`;
    } else {
      systemMessage += `\n\nTodas as perguntas já foram respondidas. Parabenize o usuário pela conclusão da contextualização.`;
    }

    // Chamada para OpenAI
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
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Salvar a resposta se aplicável
    if (questionToUpdate && isValidResponse) {
      const { error: updateError } = await supabase
        .from('contextualization_data')
        .update({ 
          answer: message.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', questionToUpdate.id);

      if (updateError) {
        console.error('Error updating question:', updateError);
      } else {
        console.log('Question answered and saved:', questionToUpdate.question);
      }
    }

    // Verificar se todas as perguntas foram respondidas após a atualização
    const { data: updatedQuestions } = await supabase
      .from('contextualization_data')
      .select('*')
      .order('order_number', { ascending: true });

    const allAnswered = updatedQuestions?.every(q => q.answer && q.answer.trim() !== '') || false;

    // Se todas foram respondidas, gerar base de conhecimento
    if (allAnswered) {
      const knowledgeBase = {};
      updatedQuestions?.forEach(q => {
        if (q.answer && q.answer.trim() !== '') {
          const key = q.question.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 50);
          knowledgeBase[key] = q.answer.trim();
        }
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

    // Calcular progresso
    const totalQuestions = questions?.length || 0;
    const answeredCount = updatedQuestions?.filter(q => q.answer && q.answer.trim() !== '').length || 0;

    return new Response(JSON.stringify({ 
      response: aiResponse,
      questionsCompleted: allAnswered,
      totalQuestions: totalQuestions,
      answeredQuestions: answeredCount
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
