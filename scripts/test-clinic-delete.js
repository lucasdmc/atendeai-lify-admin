const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClinicDelete() {
  console.log('🧪 Testando exclusão de clínicas...\n');

  try {
    // 1. Fazer login com o usuário admin_lify
    console.log('1️⃣ Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'lucasdmc@lify.com',
      password: '123456' // Substitua pela senha correta
    });

    if (authError) {
      console.error('❌ Erro no login:', authError);
      return;
    }

    console.log('✅ Login realizado com sucesso');
    console.log('👤 User ID:', authData.user.id);

    // 2. Verificar perfil do usuário
    console.log('\n2️⃣ Verificando perfil do usuário...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      return;
    }

    console.log('✅ Perfil encontrado:', profile);

    // 3. Verificar permissões
    console.log('\n3️⃣ Verificando permissões...');
    const { data: permissions, error: permissionsError } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role', profile.role);

    if (permissionsError) {
      console.error('❌ Erro ao buscar permissões:', permissionsError);
      return;
    }

    console.log('✅ Permissões encontradas:', permissions.length);
    permissions.forEach(p => {
      console.log(`   - ${p.module_name}: ${p.can_access ? '✅' : '❌'}`);
    });

    // 4. Listar clínicas existentes
    console.log('\n4️⃣ Listando clínicas...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*')
      .order('created_at', { ascending: false });

    if (clinicsError) {
      console.error('❌ Erro ao listar clínicas:', clinicsError);
      return;
    }

    console.log('✅ Clínicas encontradas:', clinics.length);
    clinics.forEach(clinic => {
      console.log(`   - ${clinic.name} (ID: ${clinic.id}) - Principal: ${clinic.id === '00000000-0000-0000-0000-000000000001'}`);
    });

    // 5. Tentar excluir uma clínica de teste (se existir)
    const testClinic = clinics.find(c => c.name.includes('Teste') && c.id !== '00000000-0000-0000-0000-000000000001');
    
    if (testClinic) {
      console.log('\n5️⃣ Tentando excluir clínica de teste...');
      console.log('🎯 Clínica selecionada:', testClinic.name);
      
      const { error: deleteError } = await supabase
        .from('clinics')
        .delete()
        .eq('id', testClinic.id);

      if (deleteError) {
        console.error('❌ Erro ao excluir clínica:', deleteError);
      } else {
        console.log('✅ Clínica excluída com sucesso!');
      }
    } else {
      console.log('\n5️⃣ Nenhuma clínica de teste encontrada para exclusão');
    }

    // 6. Verificar políticas RLS
    console.log('\n6️⃣ Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'clinics' })
      .catch(() => {
        console.log('⚠️ Função get_table_policies não disponível, pulando...');
        return { data: null, error: null };
      });

    if (policies && !policiesError) {
      console.log('✅ Políticas encontradas:', policies.length);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testClinicDelete(); 