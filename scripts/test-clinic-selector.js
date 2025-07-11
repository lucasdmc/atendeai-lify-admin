import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClinicSelector() {
  console.log('🏥 Testando Sistema de Seleção de Clínicas\n');

  try {
    // 1. Verificar se existem clínicas no sistema
    console.log('1. Verificando clínicas existentes...');
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
      console.log(`   - ${clinic.name} (ID: ${clinic.id})`);
    });

    // 2. Verificar usuários e seus perfis
    console.log('\n2. Verificando usuários e perfis...');
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        auth_users:user_id(email)
      `);

    if (profilesError) {
      console.error('❌ Erro ao buscar perfis de usuário:', profilesError);
      return;
    }

    console.log(`✅ Encontrados ${userProfiles.length} perfis de usuário:`);
    userProfiles.forEach(profile => {
      const clinicName = clinics.find(c => c.id === profile.clinic_id)?.name || 'N/A';
      console.log(`   - ${profile.auth_users?.email} (Role: ${profile.role}, Clínica: ${clinicName})`);
    });

    // 3. Verificar agentes e suas clínicas
    console.log('\n3. Verificando agentes e suas clínicas...');
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select(`
        *,
        clinics(name)
      `);

    if (agentsError) {
      console.error('❌ Erro ao buscar agentes:', agentsError);
      return;
    }

    console.log(`✅ Encontrados ${agents.length} agentes:`);
    agents.forEach(agent => {
      console.log(`   - ${agent.name} (Clínica: ${agent.clinics?.name || 'N/A'})`);
    });

    // 4. Simular diferentes cenários de usuário
    console.log('\n4. Simulando cenários de usuário...');

    // Cenário 1: Admin Lify (deve ver todas as clínicas)
    console.log('\n   📋 Cenário 1: Admin Lify');
    console.log('   - Deve ver o seletor de clínicas');
    console.log('   - Deve poder alternar entre todas as clínicas');
    console.log('   - Deve ver dados de todas as clínicas');

    // Cenário 2: Suporte Lify (deve ver todas as clínicas)
    console.log('\n   📋 Cenário 2: Suporte Lify');
    console.log('   - Deve ver o seletor de clínicas');
    console.log('   - Deve poder alternar entre todas as clínicas');
    console.log('   - Deve ver dados de todas as clínicas');

    // Cenário 3: Usuário comum (deve ver apenas sua clínica)
    console.log('\n   📋 Cenário 3: Usuário Comum');
    console.log('   - NÃO deve ver o seletor de clínicas');
    console.log('   - Deve ver apenas dados da sua clínica');
    console.log('   - Deve ser automaticamente associado à sua clínica');

    // 5. Verificar estrutura da tabela user_profiles
    console.log('\n5. Verificando estrutura da tabela user_profiles...');
    const { data: profileStructure, error: structureError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (structureError) {
      console.error('❌ Erro ao verificar estrutura:', structureError);
      return;
    }

    if (profileStructure && profileStructure.length > 0) {
      const columns = Object.keys(profileStructure[0]);
      console.log('✅ Colunas da tabela user_profiles:');
      columns.forEach(col => {
        console.log(`   - ${col}`);
      });
    }

    // 6. Verificar se há usuários sem clínica associada
    console.log('\n6. Verificando usuários sem clínica associada...');
    const usersWithoutClinic = userProfiles.filter(profile => !profile.clinic_id);
    
    if (usersWithoutClinic.length > 0) {
      console.log(`⚠️  ${usersWithoutClinic.length} usuários sem clínica associada:`);
      usersWithoutClinic.forEach(profile => {
        console.log(`   - ${profile.auth_users?.email} (Role: ${profile.role})`);
      });
    } else {
      console.log('✅ Todos os usuários têm clínica associada');
    }

    console.log('\n🎉 Teste do sistema de seleção de clínicas concluído!');
    console.log('\n📝 Resumo:');
    console.log(`   - Clínicas: ${clinics.length}`);
    console.log(`   - Usuários: ${userProfiles.length}`);
    console.log(`   - Agentes: ${agents.length}`);
    console.log(`   - Usuários sem clínica: ${usersWithoutClinic.length}`);

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testClinicSelector(); 