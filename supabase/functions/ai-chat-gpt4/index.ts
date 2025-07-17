import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    const { 
      messages, 
      phoneNumber, 
      agentId, 
      temperature = 0.7,
      enableAdvancedAI = false,
      enableIntentRecognition = false,
      enableRAG = false,
      enablePersonalization = false,
      enableMemory = false
    } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required')
    }

    console.log('🤖 AI Chat GPT-4 processing:', {
      phoneNumber,
      agentId,
      enableAdvancedAI,
      enableIntentRecognition,
      enableRAG,
      enablePersonalization,
      enableMemory
    })

    let finalMessages = messages;
    let intent = null;
    let confidence = 0.8;
    let metadata = {};

    // Sistema Avançado de IA
    if (enableAdvancedAI) {
      console.log('🚀 Using Advanced AI System')
      
      // 1. Reconhecimento de Intenções
      if (enableIntentRecognition) {
        console.log('📊 Processing Intent Recognition')
        const intentResult = await processIntentRecognition(messages, supabase);
        intent = intentResult.intent;
        confidence = intentResult.confidence;
        metadata.intent = intentResult;
      }

      // 2. Busca RAG (Retrieval-Augmented Generation)
      if (enableRAG) {
        console.log('📚 Processing RAG')
        const ragResult = await processRAG(messages[messages.length - 1].content, intent, supabase);
        finalMessages = enhanceMessagesWithRAG(messages, ragResult);
        metadata.ragSources = ragResult.sources;
      }

      // 3. Personalização
      if (enablePersonalization && phoneNumber) {
        console.log('👤 Processing Personalization')
        const personalization = await loadPersonalization(phoneNumber, supabase);
        finalMessages = enhanceMessagesWithPersonalization(finalMessages, personalization);
        metadata.personalization = personalization;
      }

      // 4. Memória de Conversação
      if (enableMemory && phoneNumber) {
        console.log('🧠 Processing Memory')
        const memory = await loadConversationMemory(phoneNumber, supabase);
        finalMessages = enhanceMessagesWithMemory(finalMessages, memory);
        metadata.memory = memory;
      }
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: finalMessages,
      temperature: temperature,
      max_tokens: 2000,
    })

    const response = completion.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.'

    console.log('✅ AI response generated:', {
      intent,
      confidence,
      metadata
    })

    return new Response(
      JSON.stringify({
        response,
        intent,
        confidence,
        metadata
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in ai-chat-gpt4:', error)
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
})

// Funções auxiliares para o sistema avançado

async function processIntentRecognition(messages: any[], supabase: any) {
  const lastMessage = messages[messages.length - 1].content;
  
  const intentPrompt = `
Você é um sistema de reconhecimento de intenções para um chatbot de clínica médica.
Analise a mensagem e identifique a intenção.

Intenções disponíveis:
- APPOINTMENT_CREATE: Usuário quer agendar consulta
- APPOINTMENT_RESCHEDULE: Usuário quer reagendar consulta
- APPOINTMENT_CANCEL: Usuário quer cancelar consulta
- APPOINTMENT_LIST: Usuário quer ver seus agendamentos
- INFO_HOURS: Perguntando sobre horários da clínica
- INFO_LOCATION: Perguntando sobre endereço/localização
- INFO_SERVICES: Perguntando sobre serviços/especialidades
- INFO_DOCTORS: Perguntando sobre médicos/profissionais
- INFO_PRICES: Perguntando sobre preços/convênios
- INFO_GENERAL: Perguntas gerais de informação
- GREETING: Mensagens de saudação
- FAREWELL: Mensagens de despedida
- HUMAN_HANDOFF: Usuário quer falar com humano
- UNCLEAR: Intenção não está clara

Responda APENAS com JSON: {"intent": "NOME_DA_INTENCAO", "confidence": 0.0-1.0, "entities": {}}
`;

  const intentMessages = [
    { role: 'system', content: intentPrompt },
    { role: 'user', content: lastMessage }
  ];

  try {
    const { data, error } = await supabase.functions.invoke('ai-chat-gpt4', {
      body: { messages: intentMessages }
    });

    if (error || !data?.response) {
      return fallbackIntentRecognition(lastMessage);
    }

    const intentData = JSON.parse(data.response);
    return {
      intent: intentData.intent,
      confidence: intentData.confidence || 0.8,
      entities: intentData.entities || {}
    };
  } catch (error) {
    console.error('Intent recognition error:', error);
    return fallbackIntentRecognition(lastMessage);
  }
}

function fallbackIntentRecognition(message: string) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('oi') || lowerMessage.includes('olá') || lowerMessage.includes('bom dia')) {
    return { intent: 'GREETING', confidence: 0.9, entities: {} };
  }
  
  if (lowerMessage.includes('agendar') || lowerMessage.includes('marcar') || lowerMessage.includes('consulta')) {
    return { intent: 'APPOINTMENT_CREATE', confidence: 0.8, entities: {} };
  }
  
  if (lowerMessage.includes('horário') || lowerMessage.includes('funciona')) {
    return { intent: 'INFO_HOURS', confidence: 0.8, entities: {} };
  }
  
  return { intent: 'UNCLEAR', confidence: 0.3, entities: {} };
}

async function processRAG(query: string, intent: string, supabase: any) {
  try {
    const { data } = await supabase
      .from('contextualization_data')
      .select('*')
      .order('order_number');

    const relevantInfo = findRelevantInfo(query, intent, data || []);
    
    return {
      sources: relevantInfo.map(item => item.question),
      augmentedQuery: buildAugmentedQuery(query, relevantInfo)
    };
  } catch (error) {
    console.error('RAG error:', error);
    return { sources: [], augmentedQuery: query };
  }
}

function findRelevantInfo(query: string, intent: string, data: any[]) {
  const relevant: any[] = [];
  const queryLower = query.toLowerCase();

  data.forEach(item => {
    let score = 0;
    const questionLower = item.question.toLowerCase();
    const answerLower = item.answer.toLowerCase();
    
    if (questionLower.includes(queryLower) || answerLower.includes(queryLower)) {
      score += 2;
    }
    
    if (intent?.includes('HOURS') && item.category === 'horarios') {
      score += 1;
    }
    if (intent?.includes('LOCATION') && item.category === 'localizacao') {
      score += 1;
    }
    if (intent?.includes('SERVICES') && item.category === 'servicos') {
      score += 1;
    }
    
    if (score > 0) {
      relevant.push({ ...item, score });
    }
  });

  return relevant.sort((a, b) => b.score - a.score).slice(0, 3);
}

function buildAugmentedQuery(query: string, relevantInfo: any[]) {
  let augmentedQuery = query;
  
  if (relevantInfo.length > 0) {
    augmentedQuery += '\n\nInformações relevantes da clínica:\n';
    relevantInfo.forEach(info => {
      augmentedQuery += `- ${info.question}: ${info.answer}\n`;
    });
  }
  
  return augmentedQuery;
}

async function loadPersonalization(phoneNumber: string, supabase: any) {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    return {
      name: profile?.name || 'Usuário',
      preferences: profile?.preferences || {},
      interactionStyle: profile?.interaction_style || 'formal'
    };
  } catch (error) {
    console.error('Personalization error:', error);
    return { name: 'Usuário', preferences: {}, interactionStyle: 'formal' };
  }
}

async function loadConversationMemory(phoneNumber: string, supabase: any) {
  try {
    const { data: messages } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('phone_number', phoneNumber)
      .order('timestamp', { ascending: false })
      .limit(10);

    return messages?.map(msg => ({
      role: msg.message_type === 'received' ? 'user' : 'assistant',
      content: msg.content,
      timestamp: msg.timestamp
    })) || [];
  } catch (error) {
    console.error('Memory error:', error);
    return [];
  }
}

function enhanceMessagesWithRAG(messages: any[], ragResult: any) {
  const enhancedMessages = [...messages];
  
  if (ragResult.augmentedQuery) {
    enhancedMessages[enhancedMessages.length - 1] = {
      ...enhancedMessages[enhancedMessages.length - 1],
      content: ragResult.augmentedQuery
    };
  }
  
  return enhancedMessages;
}

function enhanceMessagesWithPersonalization(messages: any[], personalization: any) {
  const enhancedMessages = [...messages];
  
  // Adicionar contexto de personalização ao system message
  if (enhancedMessages[0]?.role === 'system') {
    enhancedMessages[0].content += `\n\nContexto do usuário: ${personalization.name}`;
    if (personalization.interactionStyle === 'casual') {
      enhancedMessages[0].content += '\nUse linguagem mais casual e amigável.';
    }
  }
  
  return enhancedMessages;
}

function enhanceMessagesWithMemory(messages: any[], memory: any[]) {
  const enhancedMessages = [...messages];
  
  // Adicionar histórico relevante (últimas 4 mensagens)
  const recentHistory = memory.slice(-4);
  recentHistory.forEach(msg => {
    enhancedMessages.splice(-1, 0, {
      role: msg.role,
      content: msg.content
    });
  });
  
  return enhancedMessages;
} 