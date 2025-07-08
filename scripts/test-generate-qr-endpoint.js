import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testGenerateQREndpoint() {
  console.log('🧪 Testando endpoint generate-qr...\n');

  try {
    // Primeiro, vamos buscar um agente existente
    console.log('📋 Buscando agentes existentes...');
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
    console.log(`✅ Agente encontrado: ${agent.name} (ID: ${agent.id})\n`);

    // Testar o endpoint generate-qr
    console.log('🔗 Chamando endpoint generate-qr...');
    const { data, error } = await supabase.functions.invoke('agent-whatsapp-manager/generate-qr', {
      body: { agentId: agent.id }
    });

    if (error) {
      console.error('❌ Erro na chamada da função:', error);
      console.error('📄 Detalhes do erro:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('✅ Resposta recebida:');
    console.log('📄 Dados:', JSON.stringify(data, null, 2));

    if (data.success && data.qrCode) {
      console.log('🎉 QR Code gerado com sucesso!');
      console.log(`📱 QR Code: ${data.qrCode.substring(0, 50)}...`);
    } else {
      console.log('⚠️ QR Code não foi gerado ou houve erro');
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar o teste
testGenerateQREndpoint()
  .then(() => {
    console.log('\n✅ Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Teste falhou:', error);
    process.exit(1);
  }); 