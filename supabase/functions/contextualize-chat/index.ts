
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

1. Coletar e atualizar informações essenciais da clínica
2. Confirmar as informações recebidas de forma clara e educada
3. Permitir atualizações das informações já coletadas
4. Manter um tom profissional mas amigável

REGRAS IMPORTANTES:
- Se todas as perguntas já foram respondidas, ofereça-se para atualizar informações específicas
- Quando o usuário quiser atualizar uma informação, identifique qual pergunta corresponde à informação e atualize
- Seja objetivo e direto
- Sempre confirme mudanças realizadas

Use frases como:
- "Perfeito! Atualizei a informação sobre..."
- "Entendido! Qual informação você gostaria de atualizar?"
- "Ótimo! Posso ajudá-lo a atualizar qualquer informação da clínica."`;

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

    // Verificar se todas as perguntas foram respondidas
    const allAnswered = unansweredQuestions.length === 0;
    
    // Se for uma resposta válida (mais de 2 caracteres)
    const isValidResponse = message.trim().length > 2;
    let questionToUpdate = null;

    // Construir contexto das perguntas já respondidas
    let context = "";
    if (answeredQuestions.length > 0) {
      context = "Informações já coletadas da clínica:\n";
      answeredQuestions.forEach(q => {
        context += `- ${q.question}: ${q.answer}\n`;
      });
      context += "\n";
    }

    // Lógica para determinar se é uma atualização ou nova resposta
    if (allAnswered && isValidResponse) {
      // Se todas as perguntas já foram respondidas, tenta encontrar qual informação atualizar
      // Usa IA para identificar qual pergunta o usuário quer atualizar
      const identificationPrompt = `
      Baseado na mensagem do usuário: "${message}"
      
      E nas perguntas disponíveis:
      ${questions?.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}
      
      Identifique qual pergunta (número) o usuário quer atualizar. Se não conseguir identificar claramente, responda "0".
      Responda apenas com o número da pergunta.`;

      const identificationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'user', content: identificationPrompt }
          ],
          temperature: 0.1,
          max_tokens: 10,
        }),
      });

      const identificationData = await identificationResponse.json();
      const questionNumber = parseInt(identificationData.choices[0].message.content.trim());
      
      if (questionNumber > 0 && questionNumber <= questions.length) {
        questionToUpdate = questions[questionNumber - 1];
      }
    } else if (!allAnswered && isValidResponse) {
      // Se ainda há perguntas não respondidas, pegar a primeira
      questionToUpdate = unansweredQuestions[0];
    }

    // Determinar próxima pergunta após salvar a resposta atual
    let nextQuestion = null;
    if (questionToUpdate && !allAnswered) {
      // Se vamos salvar uma resposta e ainda há perguntas, a próxima será a seguinte na lista
      const currentIndex = unansweredQuestions.findIndex(q => q.id === questionToUpdate.id);
      if (currentIndex < unansweredQuestions.length - 1) {
        nextQuestion = unansweredQuestions[currentIndex + 1];
      }
    }

    // Construir prompt para o AI
    let systemMessage = SYSTEM_PROMPT;
    
    if (context) {
      systemMessage += `\n\nContexto já coletado:\n${context}`;
    }

    if (questionToUpdate) {
      systemMessage += `\n\nO usuário acabou de responder/atualizar: "${questionToUpdate.question}"`;
      systemMessage += `\nConfirme a ${allAnswered ? 'atualização' : 'resposta'} de forma positiva e`;
      
      if (nextQuestion) {
        systemMessage += ` faça a próxima pergunta: "${nextQuestion.question}"`;
      } else if (allAnswered) {
        systemMessage += ` informe que a informação foi atualizada com sucesso. Pergunte se há mais alguma informação que ele gostaria de atualizar.`;
      } else {
        systemMessage += ` informe que a contextualização foi concluída com sucesso. Parabenize o usuário e pergunte se há alguma informação que gostaria de atualizar.`;
      }
    } else if (allAnswered) {
      systemMessage += `\n\nTodas as perguntas já foram respondidas. O usuário pode querer atualizar alguma informação. Seja prestativo e pergunte qual informação ele gostaria de atualizar ou se tem alguma dúvida sobre as informações já coletadas.`;
    } else if (unansweredQuestions.length > 0) {
      const nextQuestion = unansweredQuestions[0];
      systemMessage += `\n\nFaça a seguinte pergunta: "${nextQuestion.question}"`;
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
        console.log('Question answered/updated:', questionToUpdate.question);
      }
    }

    // Verificar se todas as perguntas foram respondidas após a atualização
    const { data: updatedQuestions } = await supabase
      .from('contextualization_data')
      .select('*')
      .order('order_number', { ascending: true });

    const allQuestionsAnswered = updatedQuestions?.every(q => q.answer && q.answer.trim() !== '') || false;

    // Se todas foram respondidas, gerar/atualizar base de conhecimento
    if (allQuestionsAnswered) {
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
      questionsCompleted: allQuestionsAnswered,
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
