import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyAgentsSystem() {
  try {
    console.log('🔍 Verificando sistema de agentes...');
    
    // 1. Verificar estrutura da tabela agents
    console.log('\n1️⃣ Verificando estrutura da tabela agents...');
    
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .order('name');

    if (agentsError) {
      console.error('❌ Erro ao buscar agentes:', agentsError);
      return;
    }

    console.log(`✅ Encontrados ${agents.length} agentes:`);
    agents.forEach(agent => {
      const clinicStatus = agent.clinic_id ? '✅ Com clínica' : '❌ Sem clínica';
      const activeStatus = agent.is_active ? '✅ Ativo' : '❌ Inativo';
      const whatsappStatus = agent.is_whatsapp_connected ? '✅ Conectado' : '❌ Desconectado';
      
      console.log(`   - ${agent.name} (${agent.id})`);
      console.log(`     ${clinicStatus} | ${activeStatus} | WhatsApp: ${whatsappStatus}`);
      console.log(`     Personalidade: ${agent.personality || 'N/A'}`);
      console.log(`     Temperatura: ${agent.temperature || 'N/A'}`);
      console.log(`     Criado: ${agent.created_at}`);
      console.log('');
    });

    // 2. Verificar clínicas
    console.log('\n2️⃣ Verificando clínicas...');
    
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('id, name, address, phone, email');

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log(`✅ Encontradas ${clinics.length} clínicas:`);
    clinics.forEach(clinic => {
      console.log(`   - ${clinic.name} (${clinic.id})`);
      console.log(`     Endereço: ${clinic.address || 'N/A'}`);
      console.log(`     Telefone: ${clinic.phone || 'N/A'}`);
      console.log(`     Email: ${clinic.email || 'N/A'}`);
      console.log('');
    });

    // 3. Testar geração de QR Code para cada agente ativo
    console.log('\n3️⃣ Testando geração de QR Code...');
    
    const activeAgents = agents.filter(agent => agent.is_active);
    
    for (const agent of activeAgents) {
      console.log(`🔄 Testando QR Code para: ${agent.name} (${agent.id})`);
      
      try {
        const response = await fetch('https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/agent-whatsapp-manager/generate-qr', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ agentId: agent.id })
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
          console.log(`✅ QR Code gerado com sucesso para ${agent.name}`);
          console.log(`   Status: ${result.status}`);
          console.log(`   QR Code: ${result.qrCode ? '✅ Presente' : '❌ Ausente'}`);
        } else {
          console.log(`❌ Erro ao gerar QR Code para ${agent.name}:`);
          console.log(`   Status: ${response.status}`);
          console.log(`   Erro: ${result.error || result.message || 'Erro desconhecido'}`);
        }
      } catch (error) {
        console.log(`❌ Erro de rede ao testar ${agent.name}:`, error.message);
      }
      
      console.log('');
    }

    // 4. Verificar integridade dos dados
    console.log('\n4️⃣ Verificando integridade dos dados...');
    
    const agentsWithoutClinic = agents.filter(agent => !agent.clinic_id);
    const inactiveAgents = agents.filter(agent => !agent.is_active);
    const agentsWithoutPersonality = agents.filter(agent => !agent.personality);
    const agentsWithoutTemperature = agents.filter(agent => agent.temperature === null);
    
    console.log(`   - Agentes sem clínica: ${agentsWithoutClinic.length}`);
    console.log(`   - Agentes inativos: ${inactiveAgents.length}`);
    console.log(`   - Agentes sem personalidade: ${agentsWithoutPersonality.length}`);
    console.log(`   - Agentes sem temperatura: ${agentsWithoutTemperature.length}`);
    
    if (agentsWithoutClinic.length > 0) {
      console.log('   ⚠️  Agentes sem clínica:');
      agentsWithoutClinic.forEach(agent => {
        console.log(`     - ${agent.name} (${agent.id})`);
      });
    }
    
    if (agentsWithoutPersonality.length > 0) {
      console.log('   ⚠️  Agentes sem personalidade:');
      agentsWithoutPersonality.forEach(agent => {
        console.log(`     - ${agent.name} (${agent.id})`);
      });
    }

    // 5. Resumo final
    console.log('\n📊 RESUMO DO SISTEMA DE AGENTES:');
    console.log(`   - Total de agentes: ${agents.length}`);
    console.log(`   - Agentes ativos: ${activeAgents.length}`);
    console.log(`   - Agentes com clínica: ${agents.filter(a => a.clinic_id).length}`);
    console.log(`   - Agentes com WhatsApp configurado: ${agents.filter(a => a.whatsapp_number).length}`);
    console.log(`   - Agentes conectados: ${agents.filter(a => a.is_whatsapp_connected).length}`);
    console.log(`   - Total de clínicas: ${clinics.length}`);
    
    // 6. Sugestões de melhorias
    console.log('\n💡 SUGESTÕES DE MELHORIAS:');
    
    if (agentsWithoutClinic.length > 0) {
      console.log('   - Associar agentes sem clínica a uma clínica padrão');
    }
    
    if (agentsWithoutPersonality.length > 0) {
      console.log('   - Definir personalidade para agentes que não possuem');
    }
    
    if (agentsWithoutTemperature.length > 0) {
      console.log('   - Definir temperatura para agentes que não possuem');
    }
    
    if (agents.filter(a => a.is_active && !a.is_whatsapp_connected).length > 0) {
      console.log('   - Conectar agentes ativos ao WhatsApp');
    }

    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

// Executar verificação
verifyAgentsSystem(); 