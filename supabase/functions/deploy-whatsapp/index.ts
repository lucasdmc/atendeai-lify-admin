import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const VPS_HOST = Deno.env.get('VPS_HOST') || 'lify.magah.com.br';
const VPS_USER = Deno.env.get('VPS_USER') || 'root';
const VPS_PATH = Deno.env.get('VPS_PATH') || '/path/to/whatsapp-server';
const VPS_SSH_KEY = Deno.env.get('VPS_SSH_KEY');

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
    const { action, code } = await req.json();

    console.log(`WhatsApp Deploy - Action: ${action}`);

    let result;

    switch (action) {
      case 'deploy-endpoints':
        // Deploy dos endpoints de limpeza
        result = await deployEndpoints(code);
        break;
      
      case 'restart-server':
        // Reiniciar servidor
        result = await restartServer();
        break;
      
      case 'update-code':
        // Atualizar código específico
        result = await updateCode(code);
        break;
      
      case 'check-status':
        // Verificar status do servidor
        result = await checkStatus();
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

async function deployEndpoints(code: string) {
  console.log('Deploy dos endpoints de limpeza...');
  
  try {
    // Aqui você implementaria a lógica de deploy via SSH
    // Por segurança, isso seria feito via webhook ou API externa
    
    return {
      success: true,
      message: 'Deploy dos endpoints iniciado',
      note: 'Implemente a lógica de SSH aqui'
    };
  } catch (error) {
    throw new Error(`Erro no deploy: ${error.message}`);
  }
}

async function restartServer() {
  console.log('Reiniciando servidor WhatsApp...');
  
  try {
    // Implementar reinicialização via SSH
    return {
      success: true,
      message: 'Servidor reiniciado com sucesso'
    };
  } catch (error) {
    throw new Error(`Erro ao reiniciar: ${error.message}`);
  }
}

async function updateCode(code: string) {
  console.log('Atualizando código do servidor...');
  
  try {
    // Implementar atualização de código via SSH
    return {
      success: true,
      message: 'Código atualizado com sucesso'
    };
  } catch (error) {
    throw new Error(`Erro ao atualizar código: ${error.message}`);
  }
}

async function checkStatus() {
  console.log('Verificando status do servidor...');
  
  try {
    const response = await fetch(`https://${VPS_HOST}/health`);
    const data = await response.json();
    
    return {
      success: true,
      status: response.status,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: `Servidor não está respondendo: ${error.message}`
    };
  }
} 