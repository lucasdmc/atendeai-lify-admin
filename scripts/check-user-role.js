import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserRole() {
  console.log('🔍 Verificando papel do usuário...\n');

  try {
    // 1. Verificar usuários autenticados
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Erro de autenticação:', authError.message);
      return;
    }

    if (!user) {
      console.log('❌ Nenhum usuário autenticado');
      return;
    }

    console.log('✅ Usuário autenticado:', user.email);
    console.log('🆔 User ID:', user.id);

    // 2. Verificar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.log('❌ Erro ao buscar perfil:', profileError.message);
      return;
    }

    if (!profile) {
      console.log('❌ Perfil não encontrado');
      return;
    }

    console.log('✅ Perfil encontrado:');
    console.log('   Nome:', profile.name);
    console.log('   Email:', profile.email);
    console.log('   Role:', profile.role);
    console.log('   Status:', profile.status);

    // 3. Verificar permissões do role
    const { data: permissions, error: permError } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role', profile.role);

    if (permError) {
      console.log('❌ Erro ao buscar permissões:', permError.message);
      return;
    }

    console.log('\n📋 Permissões do role', profile.role + ':');
    if (permissions && permissions.length > 0) {
      permissions.forEach(perm => {
        console.log(`   ${perm.module_name}: ${perm.can_access ? '✅' : '❌'}`);
      });
    } else {
      console.log('   Nenhuma permissão encontrada');
    }

    // 4. Verificar se pode criar agentes
    const canCreateAgents = profile.role === 'admin_lify' || 
                           profile.role === 'suporte_lify' || 
                           permissions?.some(p => p.module_name === 'agentes' && p.can_access);

    console.log('\n🎯 Verificação de permissões:');
    console.log('   Pode criar agentes:', canCreateAgents ? '✅' : '❌');
    console.log('   Role é admin_lify:', profile.role === 'admin_lify' ? '✅' : '❌');
    console.log('   Role é suporte_lify:', profile.role === 'suporte_lify' ? '✅' : '❌');

    // 5. Verificar clínicas disponíveis
    const { data: clinics, error: clinicError } = await supabase
      .from('clinics')
      .select('id, name');

    if (clinicError) {
      console.log('❌ Erro ao buscar clínicas:', clinicError.message);
    } else {
      console.log('\n🏥 Clínicas disponíveis:');
      clinics?.forEach(clinic => {
        console.log(`   ${clinic.name} (${clinic.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkUserRole(); 