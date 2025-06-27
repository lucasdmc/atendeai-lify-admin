// Script para forçar atualização das permissões do usuário atual
// Execute: node scripts/force-update-user-permissions.js

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

async function forceUpdateUserPermissions() {
  console.log('🔧 Forçando atualização das permissões do usuário...\n');

  try {
    // 1. Verificar usuário lucasdmc@lify.com
    console.log('1️⃣ Buscando usuário lucasdmc@lify.com...');
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

    // 2. Garantir que o usuário seja admin_lify
    console.log('\n2️⃣ Garantindo que o usuário seja admin_lify...');
    if (user.role !== 'admin_lify') {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: 'admin_lify' })
        .eq('id', user.id);

      if (updateError) {
        console.log('❌ Erro ao atualizar role:', updateError.message);
        return;
      }
      console.log('✅ Role atualizado para admin_lify');
    } else {
      console.log('✅ Usuário já é admin_lify');
    }

    // 3. Remover permissões antigas
    console.log('\n3️⃣ Removendo permissões antigas...');
    const { error: deleteError } = await supabase
      .from('user_permissions')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.log('❌ Erro ao remover permissões antigas:', deleteError.message);
      return;
    }
    console.log('✅ Permissões antigas removidas');

    // 4. Inserir todas as permissões para admin_lify
    console.log('\n4️⃣ Inserindo permissões completas para admin_lify...');
    const adminLifyPermissions = [
      { module_name: 'dashboard', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { module_name: 'conversas', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { module_name: 'conectar_whatsapp', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { module_name: 'agentes', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { module_name: 'agendamentos', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { module_name: 'clinicas', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { module_name: 'criar_clinicas', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { module_name: 'deletar_clinicas', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { module_name: 'contextualizar', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { module_name: 'gestao_usuarios', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true },
      { module_name: 'configuracoes', can_access: true, can_create: true, can_read: true, can_update: true, can_delete: true }
    ];

    const permissionsToInsert = adminLifyPermissions.map(perm => ({
      user_id: user.id,
      ...perm
    }));

    const { error: insertError } = await supabase
      .from('user_permissions')
      .insert(permissionsToInsert);

    if (insertError) {
      console.log('❌ Erro ao inserir permissões:', insertError.message);
      return;
    }
    console.log('✅ Permissões inseridas com sucesso');

    // 5. Verificar se as permissões foram aplicadas
    console.log('\n5️⃣ Verificando permissões aplicadas...');
    const { data: userPermissions, error: checkError } = await supabase
      .from('user_permissions')
      .select('module_name, can_access, can_create, can_delete')
      .eq('user_id', user.id)
      .order('module_name');

    if (checkError) {
      console.log('❌ Erro ao verificar permissões:', checkError.message);
      return;
    }

    console.log('✅ Permissões aplicadas:');
    userPermissions.forEach(perm => {
      console.log(`   ${perm.module_name}: access=${perm.can_access}, create=${perm.can_create}, delete=${perm.can_delete}`);
    });

    // 6. Verificar permissões críticas
    console.log('\n6️⃣ Verificando permissões críticas...');
    const criticalPermissions = ['criar_clinicas', 'deletar_clinicas'];
    const userPermNames = userPermissions.map(p => p.module_name);

    criticalPermissions.forEach(perm => {
      const hasPermission = userPermNames.includes(perm);
      console.log(`   ${perm}: ${hasPermission ? '✅' : '❌'}`);
    });

    // 7. Resumo final
    console.log('\n📊 RESUMO FINAL:');
    console.log(`   Usuário: ${user.email} (admin_lify)`);
    console.log(`   Total de permissões: ${userPermissions.length}`);
    
    const hasCreatePermission = userPermNames.includes('criar_clinicas');
    const hasDeletePermission = userPermNames.includes('deletar_clinicas');
    
    console.log(`   Pode criar clínicas: ${hasCreatePermission ? '✅' : '❌'}`);
    console.log(`   Pode deletar clínicas: ${hasDeletePermission ? '✅' : '❌'}`);

    if (hasCreatePermission && hasDeletePermission) {
      console.log('\n🎉 PERMISSÕES ATUALIZADAS COM SUCESSO!');
      console.log('Agora faça logout e login novamente na aplicação.');
    } else {
      console.log('\n⚠️  PROBLEMAS DETECTADOS! Verifique os logs acima.');
    }

  } catch (error) {
    console.error('❌ Erro durante atualização:', error);
  }
}

// Executar atualização
forceUpdateUserPermissions(); 