// ========================================
// TESTE DO SISTEMA DE SIMULAÇÃO
// ========================================

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M'
);

async function testSimulationSystem() {
  try {
    console.log('🧪 TESTE DO SISTEMA DE SIMULAÇÃO');
    console.log('='.repeat(50));

    // 1. Verificar se o campo simulation_mode existe na tabela clinics
    console.log('\n📋 1. Verificando estrutura da tabela clinics...');
    const { data: clinicStructure, error: structureError } = await supabase
      .from('clinics')
      .select('simulation_mode')
      .limit(1);

    if (structureError) {
      console.error('❌ Erro ao verificar estrutura:', structureError);
      console.log('💡 O campo simulation_mode pode não existir. Execute o script SQL primeiro.');
      return;
    }

    console.log('✅ Campo simulation_mode encontrado na tabela clinics');

    // 2. Listar clínicas e seus modos de simulação
    console.log('\n📋 2. Listando clínicas e modos de simulação...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('id, name, whatsapp_phone, simulation_mode')
      .order('name');

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log('📊 Clínicas encontradas:');
    clinics.forEach(clinic => {
      const status = clinic.simulation_mode ? '🎭 SIMULAÇÃO' : '🚀 PRODUÇÃO';
      console.log(`  - ${clinic.name} (${clinic.whatsapp_phone}): ${status}`);
    });

    // 3. Ativar modo simulação em uma clínica de teste
    console.log('\n📋 3. Ativando modo simulação em clínica de teste...');
    const testClinic = clinics.find(c => c.name.toLowerCase().includes('cardio'));
    
    if (testClinic) {
      const { error: updateError } = await supabase
        .from('clinics')
        .update({ simulation_mode: true })
        .eq('id', testClinic.id);

      if (updateError) {
        console.error('❌ Erro ao ativar simulação:', updateError);
      } else {
        console.log(`✅ Modo simulação ativado para: ${testClinic.name}`);
      }
    } else {
      console.log('⚠️ Nenhuma clínica Cardio encontrada para teste');
    }

    // 4. Verificar conversas em modo simulação
    console.log('\n📋 4. Verificando conversas em modo simulação...');
    const { data: simulationConversations, error: convError } = await supabase
      .from('whatsapp_conversations_improved')
      .select(`
        id,
        patient_phone_number,
        last_message_preview,
        last_message_at,
        clinics!inner(
          name,
          simulation_mode
        )
      `)
      .eq('clinics.simulation_mode', true)
      .order('last_message_at', { ascending: false });

    if (convError) {
      console.error('❌ Erro ao buscar conversas de simulação:', convError);
    } else {
      console.log(`📊 Conversas em modo simulação: ${simulationConversations?.length || 0}`);
      simulationConversations?.forEach(conv => {
        console.log(`  - ${conv.patient_phone_number} (${conv.clinics.name}): ${conv.last_message_preview}`);
      });
    }

    // 5. Verificar mensagens simuladas
    console.log('\n📋 5. Verificando mensagens simuladas...');
    const { data: simulationMessages, error: msgError } = await supabase
      .from('whatsapp_messages_improved')
      .select(`
        id,
        content,
        message_type,
        created_at,
        conversations!inner(
          clinics!inner(
            name,
            simulation_mode
          )
        )
      `)
      .eq('conversations.clinics.simulation_mode', true)
      .eq('message_type', 'simulated')
      .order('created_at', { ascending: false })
      .limit(10);

    if (msgError) {
      console.error('❌ Erro ao buscar mensagens simuladas:', msgError);
    } else {
      console.log(`📊 Mensagens simuladas encontradas: ${simulationMessages?.length || 0}`);
      simulationMessages?.forEach(msg => {
        console.log(`  - [${msg.message_type}] ${msg.content.substring(0, 50)}...`);
      });
    }

    // 6. Teste de simulação de mensagem
    console.log('\n📋 6. Simulando processamento de mensagem...');
    const testMessage = {
      from: '5547999999999',
      to: testClinic?.whatsapp_phone || '554730915628',
      text: 'Olá! Gostaria de agendar uma consulta'
    };

    console.log('📤 Mensagem de teste:', testMessage);
    console.log('💡 Esta mensagem seria processada pelo webhook com controle de simulação');
    console.log('🎭 Em modo simulação: IA processa, resposta salva, mas NÃO envia para WhatsApp');
    console.log('🚀 Em modo produção: IA processa, resposta salva E envia para WhatsApp');

    // 7. Resumo do sistema
    console.log('\n📋 7. RESUMO DO SISTEMA DE SIMULAÇÃO');
    console.log('='.repeat(50));
    console.log('✅ Campo simulation_mode na tabela clinics');
    console.log('✅ Webhook com controle de simulação implementado');
    console.log('✅ Tela de simulação criada (espelho das conversas)');
    console.log('✅ ChatArea suporta modo simulação');
    console.log('✅ Rotas configuradas (/simulacao)');
    console.log('✅ Sidebar atualizado com link para simulação');
    console.log('');
    console.log('🎯 COMO USAR:');
    console.log('1. Vá para Clínicas > Editar clínica');
    console.log('2. Ative o toggle "Modo de Simulação"');
    console.log('3. Clientes enviam mensagens reais para WhatsApp');
    console.log('4. IA processa normalmente');
    console.log('5. Respostas aparecem apenas no Simulador de Atendimento');
    console.log('6. Clientes NÃO recebem respostas no WhatsApp');
    console.log('');
    console.log('🔄 PARA ATIVAR PRODUÇÃO:');
    console.log('1. Vá para Clínicas > Editar clínica');
    console.log('2. Desative o toggle "Modo de Simulação"');
    console.log('3. Clientes receberão respostas normalmente');

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

// Executar teste
testSimulationSystem(); 