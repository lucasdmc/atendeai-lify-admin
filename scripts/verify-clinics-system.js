import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyClinicsSystem() {
  try {
    console.log('🔍 Verificando sistema de clínicas...');
    
    // 1. Verificar estrutura da tabela clinics
    console.log('\n1️⃣ Verificando estrutura da tabela clinics...');
    
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*')
      .order('name');

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log(`✅ Encontradas ${clinics.length} clínicas:`);
    clinics.forEach(clinic => {
      const addressStatus = clinic.address ? '✅ Com endereço' : '❌ Sem endereço';
      const phoneStatus = clinic.phone ? '✅ Com telefone' : '❌ Sem telefone';
      const emailStatus = clinic.email ? '✅ Com email' : '❌ Sem email';
      
      console.log(`   - ${clinic.name} (${clinic.id})`);
      console.log(`     ${addressStatus} | ${phoneStatus} | ${emailStatus}`);
      console.log(`     Timezone: ${clinic.timezone || 'N/A'}`);
      console.log(`     Language: ${clinic.language || 'N/A'}`);
      console.log(`     Criado: ${clinic.created_at}`);
      console.log('');
    });

    // 2. Verificar agentes e suas associações com clínicas
    console.log('\n2️⃣ Verificando agentes e suas clínicas...');
    
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, clinic_id, is_active, created_at')
      .order('name');

    if (agentsError) {
      console.error('❌ Erro ao buscar agentes:', agentsError);
      return;
    }

    console.log(`✅ Encontrados ${agents.length} agentes:`);
    agents.forEach(agent => {
      const clinicStatus = agent.clinic_id ? '✅ Com clínica' : '❌ Sem clínica';
      const activeStatus = agent.is_active ? '✅ Ativo' : '❌ Inativo';
      
      console.log(`   - ${agent.name} (${agent.id})`);
      console.log(`     ${clinicStatus} | ${activeStatus} | Criado: ${agent.created_at}`);
    });

    // 3. Verificar associações agentes-clínicas
    console.log('\n3️⃣ Verificando associações agentes-clínicas...');
    
    const { data: agentsWithClinics, error: agentsWithClinicsError } = await supabase
      .from('agents')
      .select(`
        id,
        name,
        clinic_id,
        is_active,
        clinics!inner (
          id,
          name,
          timezone,
          language
        )
      `)
      .not('clinic_id', 'is', null);

    if (agentsWithClinicsError) {
      console.error('❌ Erro ao buscar agentes com clínicas:', agentsWithClinicsError);
    } else {
      console.log(`✅ Agentes com clínicas associadas: ${agentsWithClinics.length}`);
      agentsWithClinics.forEach(agent => {
        console.log(`   - ${agent.name} → ${agent.clinics.name} (${agent.clinics.timezone})`);
      });
    }

    // 4. Verificar agentes sem clínica
    const agentsWithoutClinic = agents.filter(agent => !agent.clinic_id);
    if (agentsWithoutClinic.length > 0) {
      console.log('\n⚠️  Agentes sem clínica associada:');
      agentsWithoutClinic.forEach(agent => {
        console.log(`   - ${agent.name} (${agent.id})`);
      });
    } else {
      console.log('\n✅ Todos os agentes têm clínica associada');
    }

    // 5. Verificar integridade dos dados
    console.log('\n4️⃣ Verificando integridade dos dados...');
    
    const clinicsWithoutCreator = clinics.filter(clinic => !clinic.created_by);
    const clinicsWithoutTimezone = clinics.filter(clinic => !clinic.timezone);
    const clinicsWithoutLanguage = clinics.filter(clinic => !clinic.language);
    
    console.log(`   - Clínicas sem criador: ${clinicsWithoutCreator.length}`);
    console.log(`   - Clínicas sem timezone: ${clinicsWithoutTimezone.length}`);
    console.log(`   - Clínicas sem language: ${clinicsWithoutLanguage.length}`);
    console.log(`   - Agentes sem clínica: ${agentsWithoutClinic.length}`);
    
    if (clinicsWithoutCreator.length > 0) {
      console.log('   ⚠️  Clínicas sem criador:');
      clinicsWithoutCreator.forEach(clinic => {
        console.log(`     - ${clinic.name} (${clinic.id})`);
      });
    }
    
    if (clinicsWithoutTimezone.length > 0) {
      console.log('   ⚠️  Clínicas sem timezone:');
      clinicsWithoutTimezone.forEach(clinic => {
        console.log(`     - ${clinic.name} (${clinic.id})`);
      });
    }

    // 6. Resumo final
    console.log('\n📊 RESUMO DO SISTEMA DE CLÍNICAS:');
    console.log(`   - Total de clínicas: ${clinics.length}`);
    console.log(`   - Clínicas com endereço: ${clinics.filter(c => c.address).length}`);
    console.log(`   - Clínicas com telefone: ${clinics.filter(c => c.phone).length}`);
    console.log(`   - Clínicas com email: ${clinics.filter(c => c.email).length}`);
    console.log(`   - Total de agentes: ${agents.length}`);
    console.log(`   - Agentes com clínica: ${agents.filter(a => a.clinic_id).length}`);
    console.log(`   - Agentes ativos: ${agents.filter(a => a.is_active).length}`);
    
    // 7. Sugestões de melhorias
    console.log('\n💡 SUGESTÕES DE MELHORIAS:');
    
    if (clinics.length === 0) {
      console.log('   - Criar pelo menos uma clínica padrão');
    }
    
    if (agentsWithoutClinic.length > 0 && clinics.length > 0) {
      console.log('   - Associar agentes sem clínica a uma clínica padrão');
    }
    
    if (clinicsWithoutCreator.length > 0) {
      console.log('   - Associar clínicas sem criador a um usuário padrão');
    }
    
    if (clinicsWithoutTimezone.length > 0) {
      console.log('   - Definir timezone para clínicas que não possuem');
    }
    
    if (clinicsWithoutLanguage.length > 0) {
      console.log('   - Definir language para clínicas que não possuem');
    }

    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

// Executar verificação
verifyClinicsSystem(); 