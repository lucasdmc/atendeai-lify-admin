// Script para aplicar correções do Admin Lify via API
// Execute: SUPABASE_URL=sua_url SUPABASE_KEY=sua_chave node scripts/apply-fix-via-api.js

import { createClient } from '@supabase/supabase-js';

// Pegar credenciais das variáveis de ambiente ou usar valores padrão
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url_here') {
  console.log('❌ Credenciais do Supabase não configuradas!');
  console.log('');
  console.log('🔧 Como usar:');
  console.log('1. Configure as variáveis de ambiente:');
  console.log('   export SUPABASE_URL="sua_url_do_supabase"');
  console.log('   export SUPABASE_KEY="sua_chave_anonima"');
  console.log('');
  console.log('2. Ou execute diretamente:');
  console.log('   SUPABASE_URL=sua_url SUPABASE_KEY=sua_chave node scripts/apply-fix-via-api.js');
  console.log('');
  console.log('3. Ou configure o arquivo .env com:');
  console.log('   VITE_SUPABASE_URL=sua_url_do_supabase');
  console.log('   VITE_SUPABASE_ANON_KEY=sua_chave_anonima');
  console.log('');
  console.log('📋 Onde encontrar as credenciais:');
  console.log('   - Supabase Dashboard > Settings > API');
  console.log('   - Project URL e anon/public key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyAdminLifyFix() {
  console.log('🔧 Aplicando correções do Admin Lify via API...\n');

  try {
    // 1. Primeiro buscar o usuário na tabela users (schema auth padrão do Supabase)
    console.log('1️⃣ Buscando usuário lucasdmc@lify.com na tabela users...');
    const { data: authUser, error: authUserError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'lucasdmc@lify.com')
      .single();

    if (authUserError) {
      console.log('❌ Erro ao buscar usuário na users:', authUserError.message);
      return;
    }

    if (!authUser) {
      console.log('❌ Usuário lucasdmc@lify.com não encontrado na users');
      return;
    }

    console.log('✅ Usuário encontrado na users:', {
      id: authUser.id,
      email: authUser.email
    });

    // 2. Agora buscar o perfil do usuário
    console.log('\n2️⃣ Buscando perfil do usuário...');
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, name, role')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      console.log('❌ Erro ao buscar perfil do usuário:', profileError.message);
      return;
    }

    if (!userProfile) {
      console.log('❌ Perfil do usuário não encontrado');
      return;
    }

    console.log('✅ Perfil encontrado:', {
      id: userProfile.id,
      name: userProfile.name,
      role: userProfile.role
    });

    // 3. Garantir que o usuário seja admin_lify
    console.log('\n3️⃣ Garantindo que o usuário seja admin_lify...');
    if (userProfile.role !== 'admin_lify') {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: 'admin_lify' })
        .eq('id', userProfile.id);

      if (updateError) {
        console.log('❌ Erro ao atualizar role:', updateError.message);
        return;
      }
      console.log('✅ Role atualizado para admin_lify');
    } else {
      console.log('✅ Usuário já é admin_lify');
    }

    // 4. Remover permissões antigas
    console.log('\n4️⃣ Removendo permissões antigas...');
    const { error: deleteError } = await supabase
      .from('user_permissions')
      .delete()
      .eq('user_id', userProfile.id);

    if (deleteError) {
      console.log('❌ Erro ao remover permissões antigas:', deleteError.message);
      return;
    }
    console.log('✅ Permissões antigas removidas');

    // 5. Inserir permissões do role admin_lify
    console.log('\n5️⃣ Inserindo permissões do role admin_lify...');
    const rolePermissions = [
      { role: 'admin_lify', module_name: 'dashboard', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { role: 'admin_lify', module_name: 'conversas', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { role: 'admin_lify', module_name: 'conectar_whatsapp', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { role: 'admin_lify', module_name: 'agentes', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { role: 'admin_lify', module_name: 'agendamentos', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { role: 'admin_lify', module_name: 'clinicas', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { role: 'admin_lify', module_name: 'criar_clinicas', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { role: 'admin_lify', module_name: 'deletar_clinicas', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { role: 'admin_lify', module_name: 'contextualizar', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { role: 'admin_lify', module_name: 'gestao_usuarios', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { role: 'admin_lify', module_name: 'configuracoes', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true }
    ];

    const { error: rolePermError } = await supabase
      .from('role_permissions')
      .upsert(rolePermissions, { onConflict: 'role,module_name' });

    if (rolePermError) {
      console.log('❌ Erro ao inserir permissões do role:', rolePermError.message);
      return;
    }
    console.log('✅ Permissões do role inseridas');

    // 6. Inserir permissões específicas para o usuário
    console.log('\n6️⃣ Inserindo permissões específicas para o usuário...');
    const userPermissions = rolePermissions.map(perm => ({
      user_id: userProfile.id,
      module_name: perm.module_name,
      can_access: perm.can_access,
      can_create: perm.can_create,
      can_read: perm.can_read,
      can_update: perm.can_update,
      can_delete: perm.can_delete
    }));

    const { error: userPermError } = await supabase
      .from('user_permissions')
      .insert(userPermissions);

    if (userPermError) {
      console.log('❌ Erro ao inserir permissões do usuário:', userPermError.message);
      return;
    }
    console.log('✅ Permissões do usuário inseridas');

    // 7. Garantir acesso à clínica padrão
    console.log('\n7️⃣ Garantindo acesso à clínica padrão...');
    
    // Verificar se a clínica padrão existe
    const { data: defaultClinic } = await supabase
      .from('clinics')
      .select('id')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (!defaultClinic) {
      const { error: clinicError } = await supabase
        .from('clinics')
        .insert([{
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Clínica Principal',
          is_active: true
        }]);

      if (clinicError) {
        console.log('⚠️  Erro ao criar clínica padrão:', clinicError.message);
      } else {
        console.log('✅ Clínica padrão criada');
      }
    } else {
      console.log('✅ Clínica padrão já existe');
    }

    // Verificar se o usuário tem acesso à clínica
    const { data: clinicUser } = await supabase
      .from('clinic_users')
      .select('id')
      .eq('user_id', userProfile.id)
      .eq('clinic_id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (!clinicUser) {
      const { error: clinicUserError } = await supabase
        .from('clinic_users')
        .insert([{
          user_id: userProfile.id,
          clinic_id: '00000000-0000-0000-0000-000000000001',
          role: 'admin_lify',
          is_active: true
        }]);

      if (clinicUserError) {
        console.log('⚠️  Erro ao associar usuário à clínica:', clinicUserError.message);
      } else {
        console.log('✅ Usuário associado à clínica padrão');
      }
    } else {
      console.log('✅ Usuário já tem acesso à clínica padrão');
    }

    // 8. Verificar resultados
    console.log('\n8️⃣ Verificando resultados...');
    const { data: finalUserPermissions, error: checkError } = await supabase
      .from('user_permissions')
      .select('module_name, can_access, can_create, can_delete')
      .eq('user_id', userProfile.id)
      .order('module_name');

    if (checkError) {
      console.log('❌ Erro ao verificar permissões finais:', checkError.message);
      return;
    }

    console.log('✅ Permissões finais aplicadas:');
    finalUserPermissions.forEach(perm => {
      console.log(`   ${perm.module_name}: access=${perm.can_access}, create=${perm.can_create}, delete=${perm.can_delete}`);
    });

    // 9. Verificar permissões críticas
    console.log('\n9️⃣ Verificando permissões críticas...');
    const criticalPermissions = ['criar_clinicas', 'deletar_clinicas'];
    const userPermNames = finalUserPermissions.map(p => p.module_name);

    criticalPermissions.forEach(perm => {
      const hasPermission = userPermNames.includes(perm);
      console.log(`   ${perm}: ${hasPermission ? '✅' : '❌'}`);
    });

    // 10. Resumo final
    console.log('\n📊 RESUMO FINAL:');
    console.log(`   Usuário: ${authUser.email} (admin_lify)`);
    console.log(`   Total de permissões: ${finalUserPermissions.length}`);
    
    const hasCreatePermission = userPermNames.includes('criar_clinicas');
    const hasDeletePermission = userPermNames.includes('deletar_clinicas');
    
    console.log(`   Pode criar clínicas: ${hasCreatePermission ? '✅' : '❌'}`);
    console.log(`   Pode deletar clínicas: ${hasDeletePermission ? '✅' : '❌'}`);

    if (hasCreatePermission && hasDeletePermission) {
      console.log('\n🎉 CORREÇÕES APLICADAS COM SUCESSO!');
      console.log('Agora faça logout e login novamente na aplicação.');
      console.log('Os botões de criar e deletar clínicas devem estar habilitados.');
    } else {
      console.log('\n⚠️  PROBLEMAS DETECTADOS! Verifique os logs acima.');
    }

  } catch (error) {
    console.error('❌ Erro durante aplicação das correções:', error);
  }
}

// Executar correções
applyAdminLifyFix(); 