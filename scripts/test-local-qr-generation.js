import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLocalQRGeneration() {
  console.log('🧪 Testando geração de QR Code local...');

  try {
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
      console.error('📄 Detalhes:', JSON.stringify(qrError, null, 2));
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

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testLocalQRGeneration(); 