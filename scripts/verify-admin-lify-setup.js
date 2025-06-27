// Script para verificar configurações do Admin Lify
// Execute: node scripts/verify-admin-lify-setup.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url_here') {
  console.log('❌ Variáveis do Supabase não configuradas no .env');
  console.log('Por favor, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAdminLifySetup() {
  console.log('🔍 Verificando configurações do Admin Lify...\n');

  try {
    // 1. Verificar usuário lucasdmc@lify.com
    console.log('1️⃣ Verificando usuário lucasdmc@lify.com...');
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, role, name')
      .eq('email', 'lucasdmc@lify.com')
      .single();

    if (userError) {
      console.log('❌ Erro ao buscar usuário:', userError.message);
      return;
    }

    if (!user) {
      console.log('❌ Usuário lucasdmc@lify.com não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    // 2. Verificar permissões do role admin_lify
    console.log('\n2️⃣ Verificando permissões do role admin_lify...');
    const { data: rolePermissions, error: roleError } = await supabase
      .from('role_permissions')
      .select('module_name, can_access, can_create, can_delete')
      .eq('role', 'admin_lify')
      .order('module_name');

    if (roleError) {
      console.log('❌ Erro ao buscar permissões do role:', roleError.message);
      return;
    }

    console.log('✅ Permissões do role admin_lify:');
    rolePermissions.forEach(perm => {
      console.log(`   ${perm.module_name}: access=${perm.can_access}, create=${perm.can_create}, delete=${perm.can_delete}`);
    });

    // 3. Verificar permissões específicas do usuário
    console.log('\n3️⃣ Verificando permissões específicas do usuário...');
    const { data: userPermissions, error: userPermError } = await supabase
      .from('user_permissions')
      .select('module_name, can_access, can_create, can_delete')
      .eq('user_id', user.id)
      .order('module_name');

    if (userPermError) {
      console.log('❌ Erro ao buscar permissões do usuário:', userPermError.message);
      return;
    }

    console.log('✅ Permissões do usuário:');
    userPermissions.forEach(perm => {
      console.log(`   ${perm.module_name}: access=${perm.can_access}, create=${perm.can_create}, delete=${perm.can_delete}`);
    });

    // 4. Verificar políticas RLS da tabela clinics
    console.log('\n4️⃣ Verificando políticas RLS da tabela clinics...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'clinics' });

    if (policiesError) {
      console.log('⚠️  Não foi possível verificar políticas RLS (pode ser normal):', policiesError.message);
    } else {
      console.log('✅ Políticas RLS encontradas:', policies);
    }

    // 5. Verificar se o usuário tem acesso à clínica padrão
    console.log('\n5️⃣ Verificando acesso à clínica padrão...');
    const { data: clinicUsers, error: clinicUsersError } = await supabase
      .from('clinic_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('clinic_id', '00000000-0000-0000-0000-000000000001');

    if (clinicUsersError) {
      console.log('❌ Erro ao verificar acesso à clínica:', clinicUsersError.message);
      return;
    }

    if (clinicUsers && clinicUsers.length > 0) {
      console.log('✅ Usuário tem acesso à clínica padrão:', clinicUsers[0]);
    } else {
      console.log('❌ Usuário não tem acesso à clínica padrão');
    }

    // 6. Verificar se as permissões críticas estão presentes
    console.log('\n6️⃣ Verificando permissões críticas...');
    const criticalPermissions = ['criar_clinicas', 'deletar_clinicas'];
    const userPermNames = userPermissions.map(p => p.module_name);

    criticalPermissions.forEach(perm => {
      const hasPermission = userPermNames.includes(perm);
      const roleHasPermission = rolePermissions.some(rp => rp.module_name === perm && rp.can_access);
      
      console.log(`   ${perm}: user=${hasPermission ? '✅' : '❌'}, role=${roleHasPermission ? '✅' : '❌'}`);
    });

    // 7. Resumo final
    console.log('\n📊 RESUMO FINAL:');
    console.log(`   Usuário: ${user.email} (${user.role})`);
    console.log(`   Permissões do role: ${rolePermissions.length}`);
    console.log(`   Permissões do usuário: ${userPermissions.length}`);
    console.log(`   Acesso à clínica padrão: ${clinicUsers && clinicUsers.length > 0 ? '✅' : '❌'}`);
    
    const hasCreatePermission = userPermNames.includes('criar_clinicas');
    const hasDeletePermission = userPermNames.includes('deletar_clinicas');
    
    console.log(`   Pode criar clínicas: ${hasCreatePermission ? '✅' : '❌'}`);
    console.log(`   Pode deletar clínicas: ${hasDeletePermission ? '✅' : '❌'}`);

    if (user.role === 'admin_lify' && hasCreatePermission && hasDeletePermission) {
      console.log('\n🎉 CONFIGURAÇÃO CORRETA! O Admin Lify está funcionando perfeitamente.');
    } else {
      console.log('\n⚠️  PROBLEMAS DETECTADOS! Execute o script de correção.');
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
verifyAdminLifySetup(); 