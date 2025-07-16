import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyUsersProfilesSystem() {
  try {
    console.log('🔍 Verificando sistema de usuários e profiles...');
    
    // 1. Verificar estrutura da tabela user_profiles
    console.log('\n1️⃣ Verificando tabela user_profiles...');
    
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Erro ao buscar user_profiles:', profilesError);
      return;
    }

    console.log(`✅ Encontrados ${userProfiles.length} perfis de usuário:`);
    userProfiles.forEach(profile => {
      const clinicStatus = profile.clinic_id ? '✅ Com clínica' : '❌ Sem clínica';
      const statusText = profile.status ? '✅ Ativo' : '❌ Inativo';
      
      console.log(`   - ${profile.name} (${profile.user_id})`);
      console.log(`     Email: ${profile.email}`);
      console.log(`     Role: ${profile.role}`);
      console.log(`     Status: ${statusText}`);
      console.log(`     Clínica: ${clinicStatus}`);
      console.log(`     Criado: ${profile.created_at}`);
      console.log('');
    });

    // 2. Verificar usuários do Auth
    console.log('\n2️⃣ Verificando usuários do Auth...');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar usuários do Auth:', authError);
    } else {
      console.log(`✅ Encontrados ${authUsers.users.length} usuários no Auth:`);
      authUsers.users.forEach(user => {
        const emailStatus = user.email_confirmed_at ? '✅ Confirmado' : '❌ Não confirmado';
        console.log(`   - ${user.email} (${user.id})`);
        console.log(`     Status: ${emailStatus}`);
        console.log(`     Criado: ${user.created_at}`);
      });
    }

    // 3. Verificar tabela clinic_users (se existir)
    console.log('\n3️⃣ Verificando tabela clinic_users...');
    
    try {
      const { data: clinicUsers, error: clinicUsersError } = await supabase
        .from('clinic_users')
        .select(`
          id,
          user_id,
          clinic_id,
          role,
          is_active,
          created_at,
          user_profiles!inner(name, email),
          clinics!inner(name)
        `);

      if (clinicUsersError) {
        console.log('⚠️  Tabela clinic_users não encontrada ou erro:', clinicUsersError.message);
      } else {
        console.log(`✅ Encontradas ${clinicUsers.length} associações clinic_users:`);
        clinicUsers.forEach(association => {
          console.log(`   - ${association.user_profiles.name} → ${association.clinics.name}`);
          console.log(`     Role: ${association.role} | Ativo: ${association.is_active}`);
        });
      }
    } catch (error) {
      console.log('⚠️  Tabela clinic_users não existe ou não acessível');
    }

    // 4. Verificar integridade dos dados
    console.log('\n4️⃣ Verificando integridade dos dados...');
    
    const profilesWithoutAuth = userProfiles.filter(profile => {
      const authUser = authUsers?.users?.find(u => u.id === profile.user_id);
      return !authUser;
    });

    const profilesWithoutClinic = userProfiles.filter(profile => {
      return !profile.clinic_id && profile.role !== 'admin_lify' && profile.role !== 'suporte_lify';
    });

    const profilesWithoutTimezone = userProfiles.filter(profile => !profile.timezone);
    const profilesWithoutLanguage = userProfiles.filter(profile => !profile.language);
    
    console.log(`   - Perfis sem usuário Auth: ${profilesWithoutAuth.length}`);
    console.log(`   - Perfis sem clínica (que precisam): ${profilesWithoutClinic.length}`);
    console.log(`   - Perfis sem timezone: ${profilesWithoutTimezone.length}`);
    console.log(`   - Perfis sem language: ${profilesWithoutLanguage.length}`);
    
    if (profilesWithoutAuth.length > 0) {
      console.log('   ⚠️  Perfis sem usuário Auth:');
      profilesWithoutAuth.forEach(profile => {
        console.log(`     - ${profile.name} (${profile.user_id})`);
      });
    }
    
    if (profilesWithoutClinic.length > 0) {
      console.log('   ⚠️  Perfis sem clínica (que precisam):');
      profilesWithoutClinic.forEach(profile => {
        console.log(`     - ${profile.name} (${profile.role})`);
      });
    }

    // 5. Verificar clínicas disponíveis
    console.log('\n5️⃣ Verificando clínicas disponíveis...');
    
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('id, name')
      .order('name');

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
    } else {
      console.log(`✅ Encontradas ${clinics.length} clínicas:`);
      clinics.forEach(clinic => {
        console.log(`   - ${clinic.name} (${clinic.id})`);
      });
    }

    // 6. Resumo final
    console.log('\n📊 RESUMO DO SISTEMA DE USUÁRIOS:');
    console.log(`   - Total de perfis: ${userProfiles.length}`);
    console.log(`   - Usuários Auth: ${authUsers?.users?.length || 0}`);
    console.log(`   - Perfis com clínica: ${userProfiles.filter(p => p.clinic_id).length}`);
    console.log(`   - Perfis sem clínica: ${userProfiles.filter(p => !p.clinic_id).length}`);
    console.log(`   - Perfis ativos: ${userProfiles.filter(p => p.status).length}`);
    console.log(`   - Clínicas disponíveis: ${clinics?.length || 0}`);
    
    // 7. Sugestões de melhorias
    console.log('\n💡 SUGESTÕES DE MELHORIAS:');
    
    if (profilesWithoutAuth.length > 0) {
      console.log('   - Limpar perfis órfãos (sem usuário Auth)');
    }
    
    if (profilesWithoutClinic.length > 0 && clinics?.length > 0) {
      console.log('   - Associar usuários sem clínica a uma clínica padrão');
    }
    
    if (profilesWithoutTimezone.length > 0) {
      console.log('   - Definir timezone para usuários que não possuem');
    }
    
    if (profilesWithoutLanguage.length > 0) {
      console.log('   - Definir language para usuários que não possuem');
    }

    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

// Executar verificação
verifyUsersProfilesSystem(); 