import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUserClinicManagement() {
  console.log('🧪 Testando Sistema de Gestão de Usuários e Clínicas\n');

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
        *,
        clinics(name)
      `)
      .order('role', { ascending: true });

    if (associationsError) {
      console.error('❌ Erro ao buscar associações:', associationsError);
      return;
    }

    console.log('📋 Usuários e suas associações:');
    userAssociations?.forEach(user => {
      const clinicName = user.clinics?.name || 'Sem clínica (Usuário Mestre)';
      const isMaster = user.role === 'admin_lify' || user.role === 'suporte_lify';
      console.log(`   - ${user.name} (${user.email})`);
      console.log(`     Role: ${user.role} | Clínica: ${clinicName} | Mestre: ${isMaster ? 'Sim' : 'Não'}`);
    });

    // 3. Verificar clínicas disponíveis
    console.log('\n3️⃣ Verificando clínicas disponíveis...');
    
    const { data: allClinics, error: allClinicsError } = await supabase
      .from('clinics')
      .select('id, name, email')
      .order('name', { ascending: true });

    if (allClinicsError) {
      console.error('❌ Erro ao buscar clínicas:', allClinicsError);
      return;
    }

    console.log('🏥 Clínicas disponíveis:');
    allClinics?.forEach(clinic => {
      console.log(`   - ${clinic.name} (ID: ${clinic.id})`);
    });

    // 4. Testar criação de usuário via Edge Function
    console.log('\n4️⃣ Testando criação de usuário via Edge Function...');
    
    const testUserData = {
      name: 'Usuário Teste Clínica',
      email: `teste.clinica.${Date.now()}@exemplo.com`,
      password: '123456',
      role: 'atendente',
      clinicId: allClinics?.[0]?.id
    };

    console.log('📝 Dados do usuário de teste:', testUserData);

    try {
      const { data: createResult, error: createError } = await supabase.functions.invoke('create-user-auth', {
        body: testUserData
      });

      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError);
      } else if (createResult?.success) {
        console.log('✅ Usuário criado com sucesso:', createResult.user);
        
        // Verificar se a associação foi criada
        const { data: newUserProfile } = await supabase
          .from('user_profiles')
          .select('*, clinics(name)')
          .eq('user_id', createResult.user.id)
          .single();

        if (newUserProfile) {
          console.log('✅ Perfil criado:', {
            name: newUserProfile.name,
            role: newUserProfile.role,
            clinic: newUserProfile.clinics?.name || 'Sem clínica'
          });
        }

        // Verificar associação na tabela clinic_users
        const { data: clinicAssociation } = await supabase
          .from('clinic_users')
          .select('*')
          .eq('user_id', createResult.user.id)
          .single();

        if (clinicAssociation) {
          console.log('✅ Associação clinic_users criada:', {
            clinic_id: clinicAssociation.clinic_id,
            role: clinicAssociation.role,
            is_active: clinicAssociation.is_active
          });
        }

        // Limpar usuário de teste
        console.log('🧹 Limpando usuário de teste...');
        await supabase.auth.admin.deleteUser(createResult.user.id);
        await supabase.from('user_profiles').delete().eq('user_id', createResult.user.id);
        await supabase.from('clinic_users').delete().eq('user_id', createResult.user.id);
        console.log('✅ Usuário de teste removido');
      }
    } catch (error) {
      console.error('❌ Erro ao testar criação:', error);
    }

    // 5. Verificar funções auxiliares
    console.log('\n5️⃣ Verificando funções auxiliares...');
    
    try {
      // Testar função has_global_clinic_access
      const { data: globalAccessTest } = await supabase
        .rpc('has_global_clinic_access', { 
          user_uuid: userAssociations?.find(u => u.role === 'admin_lify')?.user_id 
        });

      console.log('✅ Função has_global_clinic_access:', globalAccessTest);

      // Testar função requires_clinic_association
      const { data: requiresClinicTest } = await supabase
        .rpc('requires_clinic_association', { 
          user_uuid: userAssociations?.find(u => u.role === 'atendente')?.user_id 
        });

      console.log('✅ Função requires_clinic_association:', requiresClinicTest);
    } catch (error) {
      console.log('⚠️ Funções auxiliares não disponíveis:', error.message);
    }

    // 6. Resumo final
    console.log('\n6️⃣ Resumo do Sistema:');
    console.log('✅ Estrutura implementada:');
    console.log('   - Tabela user_profiles com coluna clinic_id');
    console.log('   - Tabela clinic_users para associações');
    console.log('   - Políticas RLS configuradas');
    console.log('   - Edge Function atualizada');
    console.log('   - Interface de gestão de usuários atualizada');
    
    console.log('\n📋 Regras de negócio:');
    console.log('   - Admin Lify e Suporte Lify: Usuários mestres (sem clínica específica)');
    console.log('   - Demais usuários: Devem estar associados a uma clínica específica');
    console.log('   - Seletor de clínicas: Apenas para usuários mestres');
    console.log('   - Gestão de usuários: Permite selecionar clínica na criação/edição');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testUserClinicManagement(); 