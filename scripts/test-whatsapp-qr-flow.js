import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY não encontrada no ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWhatsAppQRFlow() {
  try {
    console.log('🧪 Testando fluxo de QR Code WhatsApp...');
    
    // 1. Buscar um agente real
    console.log('\n1️⃣ Buscando agentes no banco...');
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name')
      .limit(1);

    if (agentsError) {
      console.error('❌ Erro ao buscar agentes:', agentsError);
      return;
    }

    if (!agents || agents.length === 0) {
      console.error('❌ Nenhum agente encontrado no banco');
      return;
    }

    const agent = agents[0];
    console.log(`✅ Agente encontrado: ${agent.name} (${agent.id})`);

    // 2. Testar geração de QR Code via Edge Function
    console.log('\n2️⃣ Testando geração de QR Code...');
    const { data: qrData, error: qrError } = await supabase.functions.invoke('agent-whatsapp-manager/generate-qr', {
      body: { agentId: agent.id }
    });

    if (qrError) {
      console.error('❌ Erro na Edge Function:', qrError);
      return;
    }

    console.log('📊 Resposta da Edge Function:', qrData);

    if (qrData?.success && qrData?.qrCode) {
      console.log('✅ QR Code gerado com sucesso!');
      console.log(`📱 QR Code length: ${qrData.qrCode.length} caracteres`);
    } else {
      console.log('❌ QR Code não foi gerado');
      console.log('📊 Dados recebidos:', qrData);
    }

    // 3. Testar conexão direta com o servidor WhatsApp
    console.log('\n3️⃣ Testando conexão direta com servidor WhatsApp...');
    try {
      const response = await fetch('https://lify.magah.com.br/api/whatsapp/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id })
      });

      if (response.ok) {
        const serverData = await response.json();
        console.log('✅ Servidor WhatsApp respondeu corretamente');
        console.log('📊 Dados do servidor:', serverData);
      } else {
        console.log(`⚠️ Servidor retornou status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erro ao conectar com servidor WhatsApp:', error.message);
    }

    console.log('\n🎉 Teste concluído!');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar o teste
testWhatsAppQRFlow().catch(console.error); 