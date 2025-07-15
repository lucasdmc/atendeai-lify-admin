import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const WHATSAPP_SERVER_URL = Deno.env.get('WHATSAPP_SERVER_URL') || 'https://lify.magah.com.br';

async function makeRequest(path: string, method: string = 'GET', data: any = null) {
  const url = `${WHATSAPP_SERVER_URL}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.text();
    
    try {
      const json = JSON.parse(responseData);
      return { status: response.status, data: json };
    } catch {
      return { status: response.status, data: responseData };
    }
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

serve(async (req) => {
  // Habilitar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  try {
    const { action, agentId } = await req.json();

    console.log(`WhatsApp Cleanup - Action: ${action}, AgentId: ${agentId}`);

    let result;

    switch (action) {
      case 'clear-all-sessions':
        // Limpar todas as sessões
        result = await clearAllSessions();
        break;
      
      case 'disconnect-session':
        // Desconectar sessão específica
        if (!agentId) {
          throw new Error('agentId é obrigatório para desconectar sessão');
        }
        result = await disconnectSession(agentId);
        break;
      
      case 'get-sessions':
        // Listar sessões ativas
        result = await getSessions();
        break;
      
      case 'restart-server':
        // Reiniciar servidor (se implementado)
        result = await restartServer();
        break;
      
      default:
        throw new Error(`Ação não suportada: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      status: 200,
    });

  } catch (error) {
    console.error('Erro na Edge Function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      status: 500,
    });
  }
});

async function clearAllSessions() {
  console.log('Limpando todas as sessões...');
  
  try {
    // 1. Verificar sessões ativas
    const healthResponse = await makeRequest('/health');
    
    if (healthResponse.status !== 200) {
      throw new Error('Servidor WhatsApp não está respondendo');
    }

    const sessions = healthResponse.data.sessions || [];
    let clearedCount = 0;
    const errors = [];

    // 2. Tentar desconectar cada sessão
    for (const session of sessions) {
      try {
        console.log(`Desconectando sessão: ${session.agentId}`);
        
        const disconnectResponse = await makeRequest('/api/whatsapp/disconnect', 'POST', {
          agentId: session.agentId,
          whatsappNumber: session.whatsappNumber || 'temp',
          connectionId: session.connectionId || 'temp'
        });

        if (disconnectResponse.status === 200 || disconnectResponse.status === 404) {
          clearedCount++;
        } else {
          errors.push(`Falha ao desconectar ${session.agentId}: ${disconnectResponse.status}`);
        }
      } catch (error) {
        errors.push(`Erro ao desconectar ${session.agentId}: ${error.message}`);
      }
    }

    // 3. Verificar resultado final
    const finalHealth = await makeRequest('/health');
    const remainingSessions = finalHealth.data.sessions?.length || 0;

    return {
      success: true,
      message: `Limpeza concluída`,
      clearedSessions: clearedCount,
      remainingSessions: remainingSessions,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    throw new Error(`Erro ao limpar sessões: ${error.message}`);
  }
}

async function disconnectSession(agentId: string) {
  console.log(`Desconectando sessão: ${agentId}`);
  
  try {
    const response = await makeRequest('/api/whatsapp/disconnect', 'POST', {
      agentId: agentId,
      whatsappNumber: 'temp',
      connectionId: 'temp'
    });

    if (response.status === 200) {
      return {
        success: true,
        message: 'Sessão desconectada com sucesso',
        agentId: agentId
      };
    } else {
      return {
        success: false,
        error: `Falha ao desconectar: ${response.status}`,
        response: response.data
      };
    }
  } catch (error) {
    throw new Error(`Erro ao desconectar sessão: ${error.message}`);
  }
}

async function getSessions() {
  console.log('Obtendo sessões ativas...');
  
  try {
    const response = await makeRequest('/health');
    
    if (response.status === 200) {
      return {
        success: true,
        sessions: response.data.sessions || [],
        activeSessions: response.data.activeSessions || 0,
        serverStatus: response.data.status
      };
    } else {
      throw new Error(`Servidor retornou status ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Erro ao obter sessões: ${error.message}`);
  }
}

async function restartServer() {
  console.log('Tentando reiniciar servidor...');
  
  try {
    // Tentar endpoint de restart (pode não existir)
    const response = await makeRequest('/api/whatsapp/restart', 'POST');
    
    return {
      success: response.status === 200,
      message: response.status === 200 ? 'Servidor reiniciado' : 'Endpoint de restart não disponível',
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      message: 'Endpoint de restart não implementado',
      error: error.message
    };
  }
} 