import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixAgentsIssues() {
  try {
    console.log('🔧 Corrigindo problemas na tabela agents...');
    
    // 1. Resolver nomes duplicados
    console.log('\n1️⃣ Resolvendo nomes duplicados...');
    
    // Buscar agentes com nome "Lukita"
    const { data: lukitaAgents, error: lukitaError } = await supabase
      .from('agents')
      .select('*')
      .eq('name', 'Lukita')
      .order('created_at', { ascending: true });

    if (lukitaError) {
      console.error('❌ Erro ao buscar agentes Lukita:', lukitaError);
      return;
    }

    if (lukitaAgents.length > 1) {
      console.log(`⚠️  Encontrados ${lukitaAgents.length} agentes com nome "Lukita"`);
      
      // Manter o mais antigo e renomear os outros
      const [oldest, ...duplicates] = lukitaAgents;
      console.log(`✅ Mantendo o mais antigo: ${oldest.id} (${oldest.created_at})`);
      
      for (let i = 0; i < duplicates.length; i++) {
        const duplicate = duplicates[i];
        const newName = `Lukita ${i + 2}`;
        
        console.log(`🔄 Renomeando ${duplicate.id} para "${newName}"`);
        
        const { error: updateError } = await supabase
          .from('agents')
          .update({ name: newName })
          .eq('id', duplicate.id);
        
        if (updateError) {
          console.error(`❌ Erro ao renomear ${duplicate.id}:`, updateError);
        } else {
          console.log(`✅ Renomeado com sucesso: ${duplicate.id} -> "${newName}"`);
        }
      }
    }

    // 2. Criar clínica padrão se não existir
    console.log('\n2️⃣ Verificando clínicas...');
    
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('id, name');

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    let defaultClinicId = null;
    
    if (clinics.length === 0) {
      console.log('⚠️  Nenhuma clínica encontrada. Criando clínica padrão...');
      
      const { data: newClinic, error: createClinicError } = await supabase
        .from('clinics')
        .insert({
          name: 'Clínica Padrão',
          address: 'Endereço padrão',
          phone: '(00) 0000-0000',
          email: 'contato@clinica.com',
          created_by: '00000000-0000-0000-0000-000000000000' // UUID padrão
        })
        .select()
        .single();

      if (createClinicError) {
        console.error('❌ Erro ao criar clínica padrão:', createClinicError);
      } else {
        defaultClinicId = newClinic.id;
        console.log('✅ Clínica padrão criada:', newClinic.name);
      }
    } else {
      defaultClinicId = clinics[0].id;
      console.log(`✅ Usando clínica existente: ${clinics[0].name}`);
    }

    // 3. Associar agentes sem clínica à clínica padrão
    if (defaultClinicId) {
      console.log('\n3️⃣ Associando agentes sem clínica...');
      
      const { data: agentsWithoutClinic, error: agentsError } = await supabase
        .from('agents')
        .select('id, name')
        .is('clinic_id', null);

      if (agentsError) {
        console.error('❌ Erro ao buscar agentes sem clínica:', agentsError);
        return;
      }

      if (agentsWithoutClinic.length > 0) {
        console.log(`⚠️  Encontrados ${agentsWithoutClinic.length} agentes sem clínica:`);
        agentsWithoutClinic.forEach(agent => {
          console.log(`   - ${agent.name} (${agent.id})`);
        });

        for (const agent of agentsWithoutClinic) {
          console.log(`🔄 Associando ${agent.name} à clínica padrão...`);
          
          const { error: updateError } = await supabase
            .from('agents')
            .update({ clinic_id: defaultClinicId })
            .eq('id', agent.id);
          
          if (updateError) {
            console.error(`❌ Erro ao associar ${agent.name}:`, updateError);
          } else {
            console.log(`✅ ${agent.name} associado com sucesso`);
          }
        }
      } else {
        console.log('✅ Todos os agentes já têm clínica associada');
      }
    }

    // 4. Verificar estrutura final
    console.log('\n4️⃣ Verificando estrutura final...');
    
    const { data: finalAgents, error: finalError } = await supabase
      .from('agents')
      .select('id, name, clinic_id, is_active, created_at')
      .order('name');

    if (finalError) {
      console.error('❌ Erro ao buscar agentes finais:', finalError);
      return;
    }

    console.log('\n📊 ESTRUTURA FINAL DOS AGENTES:');
    finalAgents.forEach(agent => {
      const clinicStatus = agent.clinic_id ? '✅ Com clínica' : '❌ Sem clínica';
      const activeStatus = agent.is_active ? '✅ Ativo' : '❌ Inativo';
      console.log(`   - ${agent.name} (${agent.id})`);
      console.log(`     ${clinicStatus} | ${activeStatus} | Criado: ${agent.created_at}`);
    });

    // 5. Verificar se há nomes duplicados restantes
    const agentNames = finalAgents.map(a => a.name);
    const uniqueNames = [...new Set(agentNames)];
    
    if (agentNames.length !== uniqueNames.length) {
      console.log('\n⚠️  AINDA EXISTEM NOMES DUPLICADOS:');
      const duplicates = agentNames.filter((name, index) => agentNames.indexOf(name) !== index);
      duplicates.forEach(name => {
        const agentsWithName = finalAgents.filter(a => a.name === name);
        console.log(`   - "${name}" (${agentsWithName.length} ocorrências):`);
        agentsWithName.forEach(agent => {
          console.log(`     * ${agent.id} - criado em ${agent.created_at}`);
        });
      });
    } else {
      console.log('\n✅ Nenhum nome duplicado encontrado');
    }

    console.log('\n✅ Correções concluídas!');

  } catch (error) {
    console.error('❌ Erro durante as correções:', error);
  }
}

// Executar correções
fixAgentsIssues(); 