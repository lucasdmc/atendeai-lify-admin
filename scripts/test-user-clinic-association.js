import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUserClinicAssociation() {
  console.log('🧪 Testando associação de usuários a clínicas...\n');

  try {
    // 1. Verificar estrutura das tabelas
    console.log('1️⃣ Verificando estrutura das tabelas...');
    
    const { data: userProfiles, error: userProfilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);

    if (userProfilesError) {
      console.error('❌ Erro ao buscar user_profiles:', userProfilesError);
      return;
    }

    console.log(`✅ user_profiles: ${userProfiles?.length || 0} registros encontrados`);

    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*')
      .limit(5);

    if (clinicsError) {
      console.error('❌ Erro ao buscar clinics:', clinicsError);
      return;
    }

    console.log(`✅ clinics: ${clinics?.length || 0} registros encontrados`);

    const { data: clinicUsers, error: clinicUsersError } = await supabase
      .from('clinic_users')
      .select('*')
      .limit(5);

    if (clinicUsersError) {
      console.error('❌ Erro ao buscar clinic_users:', clinicUsersError);
      return;
    }

    console.log(`✅ clinic_users: ${clinicUsers?.length || 0} registros encontrados`);

    // 2. Verificar usuários e suas associações
    console.log('\n2️⃣ Verificando associações de usuários...');
    
    const { data: userAssociations, error: associationsError } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        email,
        role,
        clinic_id,
        clinics!inner(name, email)
      `)
      .limit(10);

    if (associationsError) {
      console.error('❌ Erro ao buscar associações:', associationsError);
      return;
    }

    console.log('✅ Associações encontradas:');
    userAssociations?.forEach(assoc => {
      console.log(`   ${assoc.email} (${assoc.role}) -> ${assoc.clinics?.name || 'Sem clínica'}`);
    });

    // 3. Verificar se admin_lify e suporte_lify não têm clínica específica
    console.log('\n3️⃣ Verificando perfis com acesso global...');
    
    const globalUsers = userAssociations?.filter(u => 
      u.role === 'admin_lify' || u.role === 'suporte_lify'
    );

    console.log('✅ Usuários com acesso global:');
    globalUsers?.forEach(user => {
      console.log(`   ${user.email} (${user.role}) - Clínica: ${user.clinic_id ? 'Específica' : 'Global'}`);
    });

    // 4. Verificar se usuários normais têm clínica associada
    console.log('\n4️⃣ Verificando usuários com clínica específica...');
    
    const specificUsers = userAssociations?.filter(u => 
      u.role !== 'admin_lify' && u.role !== 'suporte_lify'
    );

    console.log('✅ Usuários com clínica específica:');
    specificUsers?.forEach(user => {
      console.log(`   ${user.email} (${user.role}) -> ${user.clinics?.name || 'Sem clínica'}`);
    });

    // 5. Verificar tabela clinic_users
    console.log('\n5️⃣ Verificando tabela clinic_users...');
    
    const { data: clinicUsersDetails, error: clinicUsersDetailsError } = await supabase
      .from('clinic_users')
      .select(`
        user_id,
        clinic_id,
        role,
        is_active,
        user_profiles!inner(email),
        clinics!inner(name)
      `)
      .limit(10);

    if (clinicUsersDetailsError) {
      console.error('❌ Erro ao buscar detalhes clinic_users:', clinicUsersDetailsError);
      return;
    }

    console.log('✅ Detalhes clinic_users:');
    clinicUsersDetails?.forEach(cu => {
      console.log(`   ${cu.user_profiles?.email} -> ${cu.clinics?.name} (${cu.role}, ativo: ${cu.is_active})`);
    });

    // 6. Testar função de verificação de acesso global
    console.log('\n6️⃣ Testando funções de verificação...');
    
    const testUserId = userAssociations?.[0]?.user_id;
    if (testUserId) {
      const { data: isAdminLify, error: isAdminError } = await supabase
        .rpc('is_admin_lify', { user_uuid: testUserId });

      const { data: hasGlobalAccess, error: globalError } = await supabase
        .rpc('has_global_clinic_access', { user_uuid: testUserId });

      console.log(`✅ Teste para usuário ${testUserId}:`);
      console.log(`   is_admin_lify: ${isAdminLify}`);
      console.log(`   has_global_clinic_access: ${hasGlobalAccess}`);
    }

    console.log('\n✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar o teste
testUserClinicAssociation()
  .then(() => {
    console.log('\n✅ Teste finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Teste falhou:', error);
    process.exit(1);
  }); 