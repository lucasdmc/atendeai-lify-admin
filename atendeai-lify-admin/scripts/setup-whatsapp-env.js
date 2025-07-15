import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SERVICE_ROLE_KEY não encontrada no ambiente');
  console.log('💡 Execute: export SERVICE_ROLE_KEY=sua_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupWhatsAppEnvironment() {
  try {
    console.log('🚀 Configurando variáveis de ambiente do WhatsApp...');
    
    // URL do servidor WhatsApp - AJUSTE AQUI
    const whatsappServerUrl = process.env.WHATSAPP_SERVER_URL || 'https://lify.magah.com.br';
    
    console.log(`📡 URL do servidor WhatsApp: ${whatsappServerUrl}`);
    
    // Configurar a variável de ambiente na Edge Function
    const { data, error } = await supabase.functions.update('whatsapp-integration', {
      secrets: {
        'WHATSAPP_SERVER_URL': whatsappServerUrl
      }
    });
    
    if (error) {
      console.error('❌ Erro ao configurar variável de ambiente:', error);
      
      // Alternativa: usar o CLI do Supabase
      console.log('🔄 Tentando via CLI...');
      console.log(`💡 Execute manualmente: supabase secrets set WHATSAPP_SERVER_URL=${whatsappServerUrl}`);
    } else {
      console.log('✅ Variável de ambiente configurada com sucesso!');
    }
    
    // Testar conexão com o servidor
    console.log('🔍 Testando conexão com o servidor WhatsApp...');
    try {
      const response = await fetch(`${whatsappServerUrl}/status`);
      if (response.ok) {
        const status = await response.json();
        console.log('✅ Servidor WhatsApp está acessível!');
        console.log('📊 Status:', status);
      } else {
        console.log('⚠️ Servidor WhatsApp não está respondendo corretamente');
        console.log(`📡 Status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log('❌ Não foi possível conectar ao servidor WhatsApp');
      console.log('💡 Verifique se o servidor está rodando em:', whatsappServerUrl);
    }
    
  } catch (error) {
    console.error('❌ Erro no setup:', error);
  }
}

// Executar o setup
setupWhatsAppEnvironment().catch(console.error); 