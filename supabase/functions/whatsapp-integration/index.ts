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

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // WhatsApp server URL from environment
    const whatsappServerUrl = Deno.env.get('WHATSAPP_SERVER_URL') || Deno.env.get('VITE_WHATSAPP_SERVER_URL') || 'http://31.97.241.19:3001'

    console.log(`WhatsApp Integration - Method: ${method}, Path: ${path}`)

    switch (path) {
      case 'initialize':
        return await handleInitialize(supabase, whatsappServerUrl)
      
      case 'status':
        return await handleStatus(supabase, whatsappServerUrl)
      
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleInitialize(supabase: any, whatsappServerUrl: string) {
  try {
    console.log('Initializing WhatsApp connection...')
    
    // Check if WhatsApp server is available
    const response = await fetch(`${whatsappServerUrl}/api/whatsapp/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      // If server is not available, return error
      return new Response(
        JSON.stringify({
          success: false,
          error: 'WhatsApp server not available',
          message: `Não foi possível conectar ao servidor WhatsApp em ${whatsappServerUrl}. Verifique se o servidor está rodando e acessível.`,
          details: {
            serverUrl: whatsappServerUrl,
            status: response.status,
            statusText: response.statusText
          }
        }),
        { 
          status: 503, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const status = await response.json()
    
    if (status.connected) {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'connected',
          message: 'WhatsApp already connected',
          clientInfo: status.clientInfo
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize connection
    const initResponse = await fetch(`${whatsappServerUrl}/api/whatsapp/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!initResponse.ok) {
      throw new Error('Failed to initialize WhatsApp connection')
    }

    const initData = await initResponse.json()
    
    return new Response(
      JSON.stringify({
        success: true,
        status: 'connecting',
        message: 'WhatsApp initialization started',
        qrCode: initData.qrCode,
        data: initData
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
        status: 'demo',
        message: 'Falling back to demo mode'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleStatus(supabase: any, whatsappServerUrl: string) {
  try {
    console.log('Checking WhatsApp status...')
    
    // Check if WhatsApp server is available
    const response = await fetch(`${whatsappServerUrl}/api/whatsapp/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'WhatsApp server not available',
          message: `Servidor WhatsApp não está disponível em ${whatsappServerUrl}`,
          details: {
            serverUrl: whatsappServerUrl,
            status: response.status,
            statusText: response.statusText
          }
        }),
        { 
          status: 503, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const status = await response.json()
    
    // Determine if connected based on clientInfo presence or connected flag
    const isConnected = status.connected || (status.clientInfo && status.clientInfo.number)
    
    return new Response(
      JSON.stringify({
        success: true,
        status: isConnected ? 'connected' : 'connecting',
        message: status.message || 'Status retrieved',
        qrCode: status.qrCode,
        clientInfo: status.clientInfo
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
        success: true,
        status: 'demo',
        message: 'Error checking status - demo mode'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleSendMessage(req: Request, supabase: any, whatsappServerUrl: string) {
  try {
    const { to, message } = await req.json()
    
    console.log(`Sending message to ${to}: ${message}`)
    
    // Check if WhatsApp server is available
    const statusResponse = await fetch(`${whatsappServerUrl}/api/whatsapp/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!statusResponse.ok) {
      throw new Error('WhatsApp not connected')
    }

    const status = await statusResponse.json()
    
    if (!status.connected) {
      throw new Error('WhatsApp not connected')
    }

    // Send message
    const sendResponse = await fetch(`${whatsappServerUrl}/api/whatsapp/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message })
    })

    if (!sendResponse.ok) {
      throw new Error('Failed to send message')
    }

    const sendData = await sendResponse.json()
    
    // Save message to database
    const { error: dbError } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: await getOrCreateConversation(supabase, to),
        content: message,
        message_type: 'sent',
        timestamp: new Date().toISOString()
      })

    if (dbError) {
      console.error('Error saving message to database:', dbError)
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Message sent successfully',
        data: sendData
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
    
    // Check if WhatsApp server is available
    const response = await fetch(`${whatsappServerUrl}/api/whatsapp/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      // If server is not available, just return success
      return new Response(
        JSON.stringify({
          success: true,
          message: 'WhatsApp disconnected (server not available)'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp disconnected successfully',
        data
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
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleWebhook(req: Request, supabase: any) {
  try {
    const body = await req.json()
    console.log('Webhook received:', JSON.stringify(body, null, 2))
    
    // Handle different types of webhook events
    if (body.event === 'message' || body.event === 'message.received') {
      // Extract message data - handle different payload structures
      const messageData = body.data || body;
      const from = messageData.from || messageData.sender || body.from;
      const messageText = messageData.body || messageData.message || messageData.text || body.message;
      const timestamp = messageData.timestamp || body.timestamp || Date.now();
      const messageId = messageData.id || body.id;
      
      console.log('Processing message:', { from, messageText, timestamp, messageId });
      
      if (!from || !messageText) {
        console.error('Missing required message data:', { from, messageText });
        return new Response(
          JSON.stringify({ error: 'Missing required message data' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Get or create conversation
      const conversationId = await getOrCreateConversation(supabase, from)
      
      // Save received message
      const { error: messageError } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          content: messageText,
          message_type: 'received',
          timestamp: new Date(timestamp * 1000).toISOString(),
          whatsapp_message_id: messageId
        })

      if (messageError) {
        console.error('Error saving received message:', messageError)
      }

      // Process message with AI
      await processMessageWithAI(supabase, conversationId, messageText, from)
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function getOrCreateConversation(supabase: any, phoneNumber: string): Promise<string> {
  // Check if conversation exists
  const { data: existingConversation } = await supabase
    .from('whatsapp_conversations')
    .select('id')
    .eq('phone_number', phoneNumber)
    .single()

  if (existingConversation) {
    return existingConversation.id
  }

  // Create new conversation
  const { data: newConversation, error } = await supabase
    .from('whatsapp_conversations')
    .insert({
      phone_number: phoneNumber,
      name: phoneNumber,
      last_message_preview: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating conversation:', error)
    throw new Error('Failed to create conversation')
  }

  return newConversation.id
}

async function processMessageWithAI(supabase: any, conversationId: string, message: string, phoneNumber: string) {
  try {
    console.log(`Processing message with Advanced AI: ${message}`)
    
    // 1. Identificar qual agente está conectado ao número
    const { data: agentConnection, error: connectionError } = await supabase
      .from('agent_whatsapp_connections')
      .select(`
        agent_id,
        agents (
          id,
          name,
          description,
          personality,
          temperature,
          context_json,
          clinics (
            name,
            address,
            phone,
            email
          )
        )
      `)
      .eq('whatsapp_number', phoneNumber)
      .eq('connection_status', 'connected')
      .single()

    let agentId = null;
    let agentContext = null;

    if (connectionError || !agentConnection) {
      console.log('No connected agent found for number:', phoneNumber)
      // Usar contexto padrão se não houver agente conectado
      agentContext = await generateDefaultContext(supabase);
    } else {
      const agent = agentConnection.agents;
      agentId = agent.id;
      console.log('Processing with agent:', agent.name)
      agentContext = await generateAgentContext(agent);
    }

    // 2. Processar mensagem com sistema avançado de IA
    const { data, error } = await supabase.functions.invoke('ai-chat-gpt4', {
      body: {
        messages: [
          {
            role: 'system',
            content: agentContext
          },
          {
            role: 'user',
            content: message
          }
        ],
        phoneNumber: phoneNumber,
        agentId: agentId,
        temperature: agentConnection?.agents?.temperature || 0.7,
        // Flags para ativar recursos avançados
        enableAdvancedAI: true,
        enableIntentRecognition: true,
        enableRAG: true,
        enablePersonalization: true,
        enableMemory: true
      }
    })

    if (error) {
      console.error('Error calling Advanced AI service:', error)
      return
    }

    if (data?.response) {
      // Save AI response
      const { error: saveError } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          content: data.response,
          message_type: 'sent',
          timestamp: new Date().toISOString(),
          metadata: {
            ai_generated: true,
            intent: data.intent,
            confidence: data.confidence,
            agent_id: agentId,
            advanced_ai: true,
            rag_sources: data.metadata?.ragSources,
            personalization: data.metadata?.personalization
          }
        })

      if (saveError) {
        console.error('Error saving AI response:', saveError)
      }

      // Send response via WhatsApp
      const whatsappServerUrl = Deno.env.get('WHATSAPP_SERVER_URL') || 'http://31.97.241.19:3001'
      
      try {
        const sendResponse = await fetch(`${whatsappServerUrl}/api/whatsapp/send-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: phoneNumber,
            message: data.response
          })
        })

        if (sendResponse.ok) {
          console.log('✅ Advanced AI response sent via WhatsApp')
        } else {
          console.error('❌ Error sending AI response via WhatsApp:', sendResponse.status)
        }
      } catch (sendError) {
        console.error('Error sending AI response via WhatsApp:', sendError)
      }
    }
  } catch (error) {
    console.error('Error processing message with Advanced AI:', error)
  }
}

// Função para gerar contexto baseado no agente
async function generateAgentContext(agent: any): Promise<string> {
  let context = `Você é ${agent.name}, assistente virtual.`
  
  // Se o agente tem JSON de contextualização, usar ele
  if (agent.context_json) {
    try {
      const contextData = typeof agent.context_json === 'string' 
        ? JSON.parse(agent.context_json) 
        : agent.context_json
      
      context = buildContextFromJSON(contextData, agent)
    } catch (error) {
      console.error('Error parsing agent context JSON:', error)
      context = buildDefaultContext(agent)
    }
  } else {
    // Usar contexto padrão baseado na clínica
    context = buildDefaultContext(agent)
  }
  
  return context
}

// Função para construir contexto a partir do JSON
function buildContextFromJSON(contextData: any, agent: any): string {
  const clinic = contextData.clinica || {}
  const agentConfig = contextData.agente_ia?.configuracao || {}
  
  return `Você é ${agentConfig.nome || agent.name}, assistente virtual da ${clinic.informacoes_basicas?.nome || 'clínica'}.

INFORMAÇÕES DA CLÍNICA:
${clinic.informacoes_basicas?.descricao ? `- Descrição: ${clinic.informacoes_basicas.descricao}` : ''}
${clinic.informacoes_basicas?.missao ? `- Missão: ${clinic.informacoes_basicas.missao}` : ''}

${clinic.contatos ? `
CONTATOS:
${clinic.contatos.telefone_principal ? `- Telefone: ${clinic.contatos.telefone_principal}` : ''}
${clinic.contatos.whatsapp ? `- WhatsApp: ${clinic.contatos.whatsapp}` : ''}
${clinic.contatos.email_principal ? `- Email: ${clinic.contatos.email_principal}` : ''}
${clinic.contatos.website ? `- Website: ${clinic.contatos.website}` : ''}
` : ''}

${clinic.localizacao?.endereco_principal ? `
ENDEREÇO:
${clinic.localizacao.endereco_principal.logradouro}, ${clinic.localizacao.endereco_principal.numero}
${clinic.localizacao.endereco_principal.complemento}
${clinic.localizacao.endereco_principal.bairro}, ${clinic.localizacao.endereco_principal.cidade} - ${clinic.localizacao.endereco_principal.estado}
CEP: ${clinic.localizacao.endereco_principal.cep}
` : ''}

${contextData.profissionais && contextData.profissionais.length > 0 ? `
PROFISSIONAIS:
${contextData.profissionais.map((prof: any) => 
  `- Dr(a). ${prof.nome_exibicao} - CRM: ${prof.crm}
  Especialidades: ${prof.especialidades.join(', ')}`
).join('\n')}
` : ''}

${contextData.servicos ? `
SERVIÇOS DISPONÍVEIS:
${contextData.servicos.consultas ? contextData.servicos.consultas.map((consulta: any) => 
  `- ${consulta.nome}: ${consulta.descricao} (R$ ${consulta.preco_particular})`
).join('\n') : ''}
${contextData.servicos.exames ? contextData.servicos.exames.map((exame: any) => 
  `- ${exame.nome}: ${exame.descricao} (R$ ${exame.preco_particular})`
).join('\n') : ''}
` : ''}

PERSONALIDADE: ${agentConfig.personalidade || agent.personality || 'profissional e acolhedor'}
TOM DE COMUNICAÇÃO: ${agentConfig.tom_comunicacao || 'formal mas acessível'}

${agentConfig.saudacao_inicial ? `SAUDAÇÃO PADRÃO: ${agentConfig.saudacao_inicial}` : ''}
${agentConfig.mensagem_despedida ? `DESPEDIDA PADRÃO: ${agentConfig.mensagem_despedida}` : ''}

Sempre responda de forma profissional e acolhedora. Use as informações acima para fornecer respostas precisas sobre a clínica, serviços e agendamentos.`
}

// Função para construir contexto padrão
function buildDefaultContext(agent: any): string {
  const clinic = agent.clinics || {}
  
  return `Você é ${agent.name}, assistente virtual${clinic.name ? ` da ${clinic.name}` : ''}.

${agent.description ? `DESCRIÇÃO: ${agent.description}` : ''}

${clinic.name ? `
INFORMAÇÕES DA CLÍNICA:
- Nome: ${clinic.name}
${clinic.address ? `- Endereço: ${clinic.address}` : ''}
${clinic.phone ? `- Telefone: ${clinic.phone}` : ''}
${clinic.email ? `- Email: ${clinic.email}` : ''}
` : ''}

PERSONALIDADE: ${agent.personality || 'profissional e acolhedor'}

Sempre responda de forma profissional e acolhedora. Use as informações disponíveis para ajudar o paciente.`
}

// Função para processar com contexto padrão (fallback)
async function processWithDefaultContext(supabase: any, conversationId: string, message: string, phoneNumber: string) {
  console.log('Using default context for number:', phoneNumber)
  
  const defaultContext = `Você é um assistente virtual profissional e acolhedor. 
Sempre responda de forma educada e prestativa, ajudando o usuário com suas dúvidas e solicitações.`

  const { data, error } = await supabase.functions.invoke('ai-chat-gpt4', {
    body: {
      messages: [
        {
          role: 'system',
          content: defaultContext
        },
        {
          role: 'user',
          content: message
        }
      ],
      phoneNumber: phoneNumber
    }
  })

  if (error) {
    console.error('Error calling AI service with default context:', error)
    return
  }

  if (data?.response) {
    // Save AI response
    const { error: saveError } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversationId,
        content: data.response,
        message_type: 'sent',
        timestamp: new Date().toISOString(),
        metadata: {
          ai_generated: true,
          default_context: true,
          intent: data.intent,
          confidence: data.confidence
        }
      })

    if (saveError) {
      console.error('Error saving AI response:', saveError)
    }

    // Send response via WhatsApp
    const whatsappServerUrl = Deno.env.get('WHATSAPP_SERVER_URL') || 'http://31.97.241.19:3001'
    
    try {
      await fetch(`${whatsappServerUrl}/api/whatsapp/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber,
          message: data.response
        })
      })
    } catch (sendError) {
      console.error('Error sending AI response via WhatsApp:', sendError)
    }
  }
} 