import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY não encontrada no ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function syncAgentsToTable() {
  try {
    console.log('🔄 Sincronizando agentes com a tabela agents...');
    
    // 1. Buscar todos os agentes existentes na tabela agents
    console.log('\n1️⃣ Buscando agentes existentes na tabela agents...');
    const { data: existingAgents, error: existingError } = await supabase
      .from('agents')
      .select('id, name, description, personality, temperature, clinic_id, is_active, context_json, whatsapp_number, is_whatsapp_connected, created_at, updated_at');

    if (existingError) {
      console.error('❌ Erro ao buscar agentes existentes:', existingError);
      return;
    }

    console.log(`✅ Encontrados ${existingAgents.length} agentes na tabela:`);
    existingAgents.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.id})`);
    });

    // 2. Buscar clínicas disponíveis
    console.log('\n2️⃣ Buscando clínicas disponíveis...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('id, name');

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log(`✅ Encontradas ${clinics.length} clínicas:`);
    clinics.forEach(clinic => {
      console.log(`   - ${clinic.name} (${clinic.id})`);
    });

    // 3. Verificar se há agentes duplicados ou com problemas
    console.log('\n3️⃣ Verificando integridade dos dados...');
    
    const agentsByName = {};
    const duplicateNames = [];
    
    existingAgents.forEach(agent => {
      if (agentsByName[agent.name]) {
        duplicateNames.push(agent.name);
      } else {
        agentsByName[agent.name] = agent;
      }
    });

    if (duplicateNames.length > 0) {
      console.log('⚠️  Agentes com nomes duplicados encontrados:');
      duplicateNames.forEach(name => {
        const duplicates = existingAgents.filter(a => a.name === name);
        console.log(`   - "${name}" (${duplicates.length} ocorrências):`);
        duplicates.forEach(agent => {
          console.log(`     * ${agent.id} - criado em ${agent.created_at}`);
        });
      });
    } else {
      console.log('✅ Nenhum agente duplicado encontrado');
    }

    // 4. Verificar agentes sem clínica associada
    const agentsWithoutClinic = existingAgents.filter(agent => !agent.clinic_id);
    if (agentsWithoutClinic.length > 0) {
      console.log('\n⚠️  Agentes sem clínica associada:');
      agentsWithoutClinic.forEach(agent => {
        console.log(`   - ${agent.name} (${agent.id})`);
      });
    } else {
      console.log('\n✅ Todos os agentes têm clínica associada');
    }

    // 5. Verificar agentes inativos
    const inactiveAgents = existingAgents.filter(agent => !agent.is_active);
    if (inactiveAgents.length > 0) {
      console.log('\n⚠️  Agentes inativos:');
      inactiveAgents.forEach(agent => {
        console.log(`   - ${agent.name} (${agent.id})`);
      });
    } else {
      console.log('\n✅ Todos os agentes estão ativos');
    }

    // 6. Sugerir melhorias
    console.log('\n4️⃣ Sugestões de melhorias:');
    
    if (existingAgents.length === 0) {
      console.log('   - Criar pelo menos um agente padrão');
    }
    
    if (agentsWithoutClinic.length > 0 && clinics.length > 0) {
      console.log('   - Associar agentes sem clínica a uma clínica padrão');
    }
    
    if (duplicateNames.length > 0) {
      console.log('   - Resolver nomes duplicados de agentes');
    }

    // 7. Criar agente padrão se não existir nenhum
    if (existingAgents.length === 0) {
      console.log('\n5️⃣ Criando agente padrão...');
      
      const defaultClinicId = clinics.length > 0 ? clinics[0].id : null;
      
      const { data: newAgent, error: createError } = await supabase
        .from('agents')
        .insert({
          name: 'Agente Padrão',
          description: 'Agente padrão do sistema',
          personality: 'profissional e acolhedor',
          temperature: 0.70,
          clinic_id: defaultClinicId,
          is_active: true,
          context_json: {
            "clinica": {
              "informacoes_basicas": {
                "nome": "Clínica Padrão",
                "descricao": "Clínica padrão do sistema"
              }
            },
            "agente_ia": {
              "configuracao": {
                "nome": "Agente Padrão",
                "personalidade": "profissional e acolhedor",
                "tom_comunicacao": "amigável e profissional",
                "nivel_formalidade": "Médio",
                "idiomas": ["português"],
                "saudacao_inicial": "Olá! Como posso ajudá-lo?",
                "mensagem_despedida": "Obrigado! Até breve!"
              }
            }
          }
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar agente padrão:', createError);
      } else {
        console.log('✅ Agente padrão criado com sucesso:', newAgent.name);
      }
    }

    // 8. Resumo final
    console.log('\n📊 RESUMO DA SINCRONIZAÇÃO:');
    console.log(`   - Total de agentes: ${existingAgents.length}`);
    console.log(`   - Agentes ativos: ${existingAgents.filter(a => a.is_active).length}`);
    console.log(`   - Agentes com WhatsApp: ${existingAgents.filter(a => a.whatsapp_number).length}`);
    console.log(`   - Agentes conectados: ${existingAgents.filter(a => a.is_whatsapp_connected).length}`);
    console.log(`   - Agentes sem clínica: ${agentsWithoutClinic.length}`);
    console.log(`   - Nomes duplicados: ${duplicateNames.length}`);

    console.log('\n✅ Sincronização concluída!');

  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error);
  }
}

// Executar sincronização
syncAgentsToTable(); 