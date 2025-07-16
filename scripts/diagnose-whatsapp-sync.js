import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY não encontrada no ambiente');
  console.log('💡 Verifique se o arquivo .env existe e contém VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseWhatsAppSync() {
  console.log('🔍 Diagnosticando problema de sincronização do WhatsApp...\n');

  try {
    // 1. Verificar agentes disponíveis
    console.log('1️⃣ Verificando agentes disponíveis...');
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, clinic_id, created_at')
      .eq('is_active', true);

    if (agentsError) {
      console.error('❌ Erro ao buscar agentes:', agentsError);
      return;
    }

    console.log(`✅ ${agents.length} agentes encontrados:`);
    agents.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.id})`);
    });
    console.log('');

    // 2. Testar geração de QR Code
    console.log('2️⃣ Testando geração de QR Code...');
    const testAgent = agents[0];
    
    const { data: qrData, error: qrError } = await supabase.functions.invoke('agent-whatsapp-manager/generate-qr', {
      body: { agentId: testAgent.id }
    });

    if (qrError) {
      console.error('❌ Erro na Edge Function:', qrError);
      return;
    }

    console.log('📊 Resposta da Edge Function:');
    console.log(`   Success: ${qrData?.success}`);
    console.log(`   Status: ${qrData?.status}`);
    console.log(`   QR Code: ${qrData?.qrCode ? 'Presente' : 'Ausente'}`);
    console.log(`   Message: ${qrData?.message}`);
    console.log('');

    // 3. Verificar status do servidor WhatsApp
    console.log('3️⃣ Verificando status do servidor WhatsApp...');
    try {
      const response = await fetch('http://31.97.241.19:3001/health');
      const healthData = await response.json();
      console.log('📊 Status do servidor:');
      console.log(`   Status: ${healthData.status}`);
      console.log(`   WhatsApp: ${healthData.whatsapp}`);
      console.log(`   Timestamp: ${healthData.timestamp}`);
    } catch (error) {
      console.error('❌ Erro ao verificar servidor:', error.message);
    }
    console.log('');

    // 4. Testar conexão direta com servidor
    console.log('4️⃣ Testando conexão direta com servidor...');
    try {
      const response = await fetch('http://31.97.241.19:3001/api/whatsapp/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ agentId: testAgent.id })
      });
      
      const serverData = await response.json();
      console.log('📊 Resposta do servidor:');
      console.log(`   Success: ${serverData?.success}`);
      console.log(`   Message: ${serverData?.message}`);
      console.log(`   Status: ${serverData?.status}`);
    } catch (error) {
      console.error('❌ Erro ao conectar com servidor:', error.message);
    }
    console.log('');

    // 5. Análise do problema
    console.log('5️⃣ Análise do problema de sincronização...');
    console.log('');
    console.log('🔍 Possíveis causas:');
    console.log('');
    console.log('❌ Problema 1: Evento "ready" não disparado');
    console.log('   - O WhatsApp Web não está finalizando a autenticação');
    console.log('   - Pode ser problema de permissões ou configuração');
    console.log('');
    console.log('❌ Problema 2: Múltiplas sessões conflitantes');
    console.log('   - Há arquivos de lock não removidos');
    console.log('   - Processos Chrome em conflito');
    console.log('');
    console.log('❌ Problema 3: Configuração do LocalAuth');
    console.log('   - Diretório de sessão com permissões incorretas');
    console.log('   - Estratégia de autenticação falhando');
    console.log('');
    console.log('❌ Problema 4: Timeout de conexão');
    console.log('   - O WhatsApp não consegue se conectar no tempo limite');
    console.log('   - Rede ou firewall bloqueando');
    console.log('');

    // 6. Recomendações
    console.log('6️⃣ Recomendações para resolver:');
    console.log('');
    console.log('🔧 Ação 1: Limpeza completa de sessões');
    console.log('   ssh root@31.97.241.19');
    console.log('   cd /root/LifyChatbot-Node-Server');
    console.log('   pkill -f chrome');
    console.log('   rm -rf .wwebjs_auth/*');
    console.log('   pm2 restart whatsapp-server');
    console.log('');
    console.log('🔧 Ação 2: Verificar logs detalhados');
    console.log('   pm2 logs whatsapp-server --lines 50');
    console.log('   # Procurar por erros de autenticação');
    console.log('');
    console.log('🔧 Ação 3: Testar com configuração diferente');
    console.log('   - Usar RemoteAuth em vez de LocalAuth');
    console.log('   - Alterar diretório de sessão');
    console.log('   - Aumentar timeout de conexão');
    console.log('');
    console.log('🔧 Ação 4: Verificar permissões');
    console.log('   ls -la /root/LifyChatbot-Node-Server/.wwebjs_auth/');
    console.log('   chmod -R 755 /root/LifyChatbot-Node-Server/.wwebjs_auth/');
    console.log('');

    // 7. Teste específico
    console.log('7️⃣ Teste específico para verificar sincronização...');
    console.log('📱 Para testar:');
    console.log('   1. Acesse a página de Agentes no frontend');
    console.log('   2. Clique em "Gerar QR Code"');
    console.log('   3. Escaneie o QR Code com WhatsApp');
    console.log('   4. Aguarde 30 segundos');
    console.log('   5. Verifique se o status muda para "Conectado"');
    console.log('   6. Se não mudar, execute a limpeza completa');
    console.log('');

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  }
}

// Executar diagnóstico
diagnoseWhatsAppSync(); 