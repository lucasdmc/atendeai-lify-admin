import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-path',
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
    const whatsappServerUrl = Deno.env.get('WHATSAPP_SERVER_URL') || 'http://31.97.241.19:3001'

    console.log(`Agent WhatsApp Manager - Method: ${method}, Path: ${path}`)

    switch (path) {
      case 'initialize':
        return await handleAgentInitialize(req, supabase, whatsappServerUrl)
      
      case 'status':
        return await handleAgentStatus(req, supabase, whatsappServerUrl)
      
      case 'disconnect':
        return await handleAgentDisconnect(req, supabase, whatsappServerUrl)
      
      case 'send-message':
        return await handleAgentSendMessage(req, supabase, whatsappServerUrl)
      
      case 'generate-qr':
        return await handleGenerateQR(req, supabase, whatsappServerUrl)
      
      case 'webhook':
        return await handleAgentWebhook(req, supabase)
      
      case 'connections':
        return await handleGetConnections(req, supabase)
      
      case 'disconnect-all':
        return await handleDisconnectAll(req, supabase, whatsappServerUrl)
      
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
    console.error('Error in agent-whatsapp-manager:', error)
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

async function handleAgentInitialize(req: Request, supabase: any, whatsappServerUrl: string) {
  try {
    const { agentId, whatsappNumber } = await req.json()
    
    if (!agentId || !whatsappNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'agentId and whatsappNumber are required'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Initializing WhatsApp for agent ${agentId} with number ${whatsappNumber}`)

    // Verificar se o agente existe
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Agent not found'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar se já existe uma conexão para este agente e número
    const { data: existingConnection } = await supabase
      .from('agent_whatsapp_connections')
      .select('*')
      .eq('agent_id', agentId)
      .eq('whatsapp_number', whatsappNumber)
      .single()

    let connectionId: string

    if (existingConnection) {
      connectionId = existingConnection.id
      // Atualizar status para connecting
      await supabase
        .from('agent_whatsapp_connections')
        .update({ 
          connection_status: 'connecting',
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)
    } else {
      // Criar nova conexão
      const { data: newConnection, error: createError } = await supabase
        .from('agent_whatsapp_connections')
        .insert({
          agent_id: agentId,
          whatsapp_number: whatsappNumber,
          connection_status: 'connecting'
        })
        .select()
        .single()

      if (createError) {
        throw new Error('Failed to create connection')
      }

      connectionId = newConnection.id
    }

    // Inicializar conexão no servidor WhatsApp usando generate-qr
    const response = await fetch(`${whatsappServerUrl}/api/whatsapp/generate-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        agentId
      })
    })

    if (!response.ok) {
      // Atualizar status para error
      await supabase
        .from('agent_whatsapp_connections')
        .update({ 
          connection_status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)

      return new Response(
        JSON.stringify({
          success: false,
          error: 'WhatsApp server not available',
          status: 'error'
        }),
        { 
          status: 503, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const initData = await response.json()
    
    // Atualizar conexão com QR Code se disponível
    if (initData.qrCode) {
      await supabase
        .from('agent_whatsapp_connections')
        .update({ 
          qr_code: initData.qrCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: 'connecting',
        connectionId,
        qrCode: initData.qrCode,
        message: 'WhatsApp initialization started for agent'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in handleAgentInitialize:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        status: 'error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleAgentStatus(req: Request, supabase: any, whatsappServerUrl: string) {
  try {
    const { agentId, connectionId } = await req.json()
    
    if (!agentId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'agentId is required'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Buscar conexões do agente
    const { data: connections, error: connectionsError } = await supabase
      .from('agent_whatsapp_connections')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })

    if (connectionsError) {
      throw new Error('Failed to fetch connections')
    }

    // Se não há conexões, retornar status disconnected
    if (!connections || connections.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'disconnected',
          connections: []
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Se foi especificado um connectionId, buscar apenas essa conexão
    if (connectionId) {
      const connection = connections.find(c => c.id === connectionId)
      if (!connection) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Connection not found'
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Verificar status no servidor WhatsApp
      try {
        const response = await fetch(`${whatsappServerUrl}/api/whatsapp/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            agentId,
            connectionId,
            whatsappNumber: connection.whatsapp_number
          })
        })

        if (response.ok) {
          const statusData = await response.json()
          
          // Atualizar status no banco se mudou
          if (statusData.status !== connection.connection_status) {
            await supabase
              .from('agent_whatsapp_connections')
              .update({ 
                connection_status: statusData.status,
                client_info: statusData.clientInfo,
                last_connection_at: statusData.status === 'connected' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
              })
              .eq('id', connectionId)

            connection.connection_status = statusData.status
            connection.client_info = statusData.clientInfo
          }

          return new Response(
            JSON.stringify({
              success: true,
              status: connection.connection_status,
              connection,
              qrCode: statusData.qrCode,
              clientInfo: statusData.clientInfo
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      } catch (error) {
        console.error('Error checking WhatsApp status:', error)
      }

      // Se não conseguiu verificar no servidor, retornar status do banco
      return new Response(
        JSON.stringify({
          success: true,
          status: connection.connection_status,
          connection
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Retornar todas as conexões do agente
    return new Response(
      JSON.stringify({
        success: true,
        connections,
        status: connections.some(c => c.connection_status === 'connected') ? 'connected' : 'disconnected'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in handleAgentStatus:', error)
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

async function handleAgentDisconnect(req: Request, supabase: any, whatsappServerUrl: string) {
  try {
    const { agentId, connectionId } = await req.json()
    
    if (!agentId || !connectionId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'agentId and connectionId are required'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Disconnecting WhatsApp for agent ${agentId}, connection ${connectionId}`)

    // Buscar conexão
    const { data: connection, error: connectionError } = await supabase
      .from('agent_whatsapp_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('agent_id', agentId)
      .single()

    if (connectionError || !connection) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Connection not found'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Desconectar no servidor WhatsApp
    try {
      const response = await fetch(`${whatsappServerUrl}/api/whatsapp/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agentId,
          connectionId,
          whatsappNumber: connection.whatsapp_number
        })
      })

      if (response.ok) {
        console.log('WhatsApp disconnected successfully')
      }
    } catch (error) {
      console.error('Error disconnecting from WhatsApp server:', error)
    }

    // Atualizar status no banco
    await supabase
      .from('agent_whatsapp_connections')
      .update({ 
        connection_status: 'disconnected',
        qr_code: null,
        client_info: null,
        session_data: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp disconnected successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in handleAgentDisconnect:', error)
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

async function handleAgentSendMessage(req: Request, supabase: any, whatsappServerUrl: string) {
  try {
    const { agentId, connectionId, to, message } = await req.json()
    
    if (!agentId || !connectionId || !to || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'agentId, connectionId, to, and message are required'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Sending message from agent ${agentId} to ${to}: ${message}`)

    // Buscar conexão
    const { data: connection, error: connectionError } = await supabase
      .from('agent_whatsapp_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('agent_id', agentId)
      .single()

    if (connectionError || !connection) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Connection not found'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (connection.connection_status !== 'connected') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'WhatsApp not connected'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Enviar mensagem via servidor WhatsApp
    const response = await fetch(`${whatsappServerUrl}/api/whatsapp/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        agentId,
        connectionId,
        to, 
        message 
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }

    const sendData = await response.json()
    
    // Salvar mensagem no banco
    const { error: dbError } = await supabase.rpc('save_agent_message', {
      p_agent_id: agentId,
      p_connection_id: connectionId,
      p_phone_number: to,
      p_contact_name: null,
      p_message_content: message,
      p_message_type: 'sent',
      p_whatsapp_message_id: sendData.messageId,
      p_metadata: JSON.stringify({ agentId, connectionId })
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
    console.error('Error in handleAgentSendMessage:', error)
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

async function handleAgentWebhook(req: Request, supabase: any) {
  try {
    const body = await req.json()
    console.log('Agent webhook received:', body)

    const { agentId, connectionId, phoneNumber, contactName, message, messageType, messageId } = body

    if (!agentId || !connectionId || !phoneNumber || !message || !messageType) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Salvar mensagem no banco
    const { error: dbError } = await supabase.rpc('save_agent_message', {
      p_agent_id: agentId,
      p_connection_id: connectionId,
      p_phone_number: phoneNumber,
      p_contact_name: contactName,
      p_message_content: message,
      p_message_type: messageType,
      p_whatsapp_message_id: messageId,
      p_metadata: JSON.stringify({ webhook: true })
    })

    if (dbError) {
      console.error('Error saving webhook message:', dbError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save message' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in handleAgentWebhook:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleGetConnections(req: Request, supabase: any) {
  try {
    const { agentId } = await req.json()

    if (!agentId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'agentId is required'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { data: connections, error } = await supabase
      .from('agent_whatsapp_connections')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Failed to fetch connections')
    }

    return new Response(
      JSON.stringify({
        success: true,
        connections: connections || []
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in handleGetConnections:', error)
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

async function handleGenerateQR(req: Request, supabase: any, whatsappServerUrl: string) {
  try {
    const { agentId } = await req.json()
    
    if (!agentId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'agentId is required'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Generating QR Code for agent ${agentId}`)
    console.log(`WhatsApp server URL: ${whatsappServerUrl}`)

    // Verificar se o agente existe
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      console.error('Agent not found:', agentError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Agent not found'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Agent found: ${agent.name}`)

    // NOVO: Limpar sessão antes de gerar QR Code
    try {
      console.log(`Tentando desconectar sessão antiga para agentId: ${agentId}`)
      const disconnectResponse = await fetch(`${whatsappServerUrl}/api/whatsapp/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-Edge-Function/1.0',
          'Accept': 'application/json',
          'X-Agent-ID': agentId,
          'X-Request-ID': crypto.randomUUID()
        },
        body: JSON.stringify({ agentId })
      })
      if (disconnectResponse.ok) {
        console.log('Sessão antiga desconectada com sucesso.')
      } else {
        const errText = await disconnectResponse.text()
        console.warn(`Não foi possível desconectar sessão antiga: ${disconnectResponse.status} - ${errText}`)
      }
    } catch (disconnectError) {
      console.warn('Erro ao tentar desconectar sessão antiga:', disconnectError)
    }

    // CORREÇÃO 1: Adicionar timeout e melhorar headers
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos de timeout

    try {
      console.log(`Making request to: ${whatsappServerUrl}/api/whatsapp/generate-qr`)
      
      const response = await fetch(`${whatsappServerUrl}/api/whatsapp/generate-qr`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-Edge-Function/1.0',
          'Accept': 'application/json',
          'Connection': 'keep-alive',
          'X-Agent-ID': agentId,
          'X-Request-ID': crypto.randomUUID()
        },
        body: JSON.stringify({ agentId }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log(`Backend response status: ${response.status}`)
      console.log(`Backend response headers:`, Object.fromEntries(response.headers.entries()))
      
      // CORREÇÃO 2: Melhor tratamento de erros HTTP
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        let errorDetails = ''
        
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json()
            errorDetails = errorData.error || errorData.message || JSON.stringify(errorData)
          } else {
            errorDetails = await response.text()
          }
          errorMessage = `${errorMessage}: ${errorDetails}`
        } catch (e) {
          console.error('Error parsing error response:', e)
        }
        
        console.error(`Backend error: ${errorMessage}`)
        
        // CORREÇÃO 3: Retornar informações mais úteis no erro
        return new Response(
          JSON.stringify({ 
            success: false,
            error: errorMessage,
            status: 'error',
            details: {
              httpStatus: response.status,
              serverUrl: whatsappServerUrl,
              timestamp: new Date().toISOString()
            }
          }),
          { 
            status: response.status >= 500 ? 502 : response.status, // 502 Bad Gateway para erros do servidor upstream
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const data = await response.json()
      console.log(`Backend response data received, has QR: ${!!data.qrCode}`)
      
      // CORREÇÃO 4: Validar resposta antes de retornar
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from backend')
      }

      // Se backend retornou sucesso mas sem QR Code, aguardar um pouco
      if (data.success && !data.qrCode) {
        console.log('Success but no QR Code yet, waiting for status...')
        
        // Aguardar 2 segundos e verificar status
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Verificar status no backend
        const statusResponse = await fetch(`${whatsappServerUrl}/api/whatsapp/status/${agentId}`, {
          headers: { 
            'Accept': 'application/json',
            'X-Agent-ID': agentId
          }
        })
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          if (statusData.qrCode) {
            data.qrCode = statusData.qrCode
          }
        }
      }

      console.log('Returning success response')
      return new Response(
        JSON.stringify({ 
          success: true,
          qrCode: data.qrCode,
          status: data.qrCode ? 'qr_ready' : 'initializing',
          message: data.message || 'QR Code generation initiated'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
      
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      // CORREÇÃO 5: Tratamento específico para timeout
      if (fetchError.name === 'AbortError') {
        console.error('Request timeout after 30 seconds')
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Request timeout - servidor não respondeu em 30 segundos',
            status: 'timeout'
          }),
          { 
            status: 504, // Gateway Timeout
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      throw fetchError
    }
    
  } catch (error) {
    console.error('Error in handleGenerateQR:', error)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Unknown error',
        status: 'error',
        details: {
          type: error.name,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
} 

async function handleDisconnectAll(req: Request, supabase: any, whatsappServerUrl: string) {
  try {
    console.log('Disconnecting all WhatsApp connections...')

    // Atualizar todas as conexões para disconnected
    const { data: connections, error: updateError } = await supabase
      .from('agent_whatsapp_connections')
      .update({ 
        connection_status: 'disconnected',
        qr_code: null,
        client_info: null,
        updated_at: new Date().toISOString()
      })
      .neq('connection_status', 'disconnected')

    if (updateError) {
      console.error('Error updating connections:', updateError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to update connections'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Updated ${connections?.length || 0} connections to disconnected`)

    // Tentar desconectar no servidor WhatsApp
    try {
      const response = await fetch(`${whatsappServerUrl}/api/whatsapp/disconnect-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        console.log('Successfully disconnected all sessions on WhatsApp server')
      } else {
        console.log('WhatsApp server disconnect-all endpoint not available or failed')
      }
    } catch (error) {
      console.log('Error calling WhatsApp server disconnect-all:', error.message)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All connections disconnected',
        updatedCount: connections?.length || 0
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in handleDisconnectAll:', error)
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