// Script para corrigir a estrutura do banco de dados
// Execute: node scripts/fix-database-structure.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url_here') {
  console.log('❌ Credenciais do Supabase não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabaseStructure() {
  console.log('🔧 Corrigindo estrutura do banco de dados...\n');

  try {
    // 1. Verificar estrutura atual da tabela user_profiles
    console.log('1️⃣ Verificando estrutura atual da tabela user_profiles...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Erro ao acessar tabela user_profiles:', tableError.message);
      console.log('💡 A tabela pode não existir ou ter problemas de estrutura');
    } else {
      console.log('✅ Tabela user_profiles acessível');
      console.log('📊 Colunas encontradas:', Object.keys(tableInfo[0] || {}));
    }

    // 2. Criar perfil para o usuário admin_lify
    console.log('\n2️⃣ Criando perfil para usuário admin_lify...');
    
    // Primeiro, buscar o usuário no auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('⚠️ Usuário não autenticado, tentando buscar por email...');
      
      // Tentar buscar usuário por email
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) {
        console.error('❌ Erro ao buscar usuários:', usersError.message);
        return;
      }
      
      const adminUser = users.users.find(u => u.email === 'lucasdmc@lify.com');
      
      if (!adminUser) {
        console.error('❌ Usuário lucasdmc@lify.com não encontrado');
        return;
      }
      
      console.log('✅ Usuário encontrado:', adminUser.id);
      
      // Criar perfil para este usuário
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: adminUser.id,
          email: adminUser.email,
          name: 'Lucas Admin',
          role: 'admin_lify',
          status: true
        });

      if (insertError) {
        console.error('❌ Erro ao criar perfil:', insertError.message);
        console.log('📋 Detalhes do erro:', insertError);
      } else {
        console.log('✅ Perfil admin_lify criado com sucesso');
      }
    } else {
      console.log('✅ Usuário autenticado:', user.id);
      
      // Criar perfil para o usuário autenticado
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          email: user.email,
          name: user.user_metadata?.name || 'Admin User',
          role: 'admin_lify',
          status: true
        });

      if (insertError) {
        console.error('❌ Erro ao criar perfil:', insertError.message);
        console.log('📋 Detalhes do erro:', insertError);
      } else {
        console.log('✅ Perfil admin_lify criado com sucesso');
      }
    }

    // 3. Configurar permissões dos roles
    console.log('\n3️⃣ Configurando permissões dos roles...');
    
    const rolePermissions = [
      // Atendente
      { role: 'atendente', module_name: 'conectar_whatsapp', can_access: true },
      { role: 'atendente', module_name: 'agendamentos', can_access: true },
      { role: 'atendente', module_name: 'conversas', can_access: true },
      { role: 'atendente', module_name: 'dashboard', can_access: true },
      
      // Gestor
      { role: 'gestor', module_name: 'conectar_whatsapp', can_access: true },
      { role: 'gestor', module_name: 'agendamentos', can_access: true },
      { role: 'gestor', module_name: 'conversas', can_access: true },
      { role: 'gestor', module_name: 'dashboard', can_access: true },
      { role: 'gestor', module_name: 'agentes', can_access: true },
      { role: 'gestor', module_name: 'contextualizar', can_access: true },
      
      // Admin
      { role: 'admin', module_name: 'conectar_whatsapp', can_access: true },
      { role: 'admin', module_name: 'agendamentos', can_access: true },
      { role: 'admin', module_name: 'conversas', can_access: true },
      { role: 'admin', module_name: 'dashboard', can_access: true },
      { role: 'admin', module_name: 'agentes', can_access: true },
      { role: 'admin', module_name: 'contextualizar', can_access: true },
      { role: 'admin', module_name: 'gestao_usuarios', can_access: true },
      { role: 'admin', module_name: 'configuracoes', can_access: true },
      
      // Suporte Lify
      { role: 'suporte_lify', module_name: 'conectar_whatsapp', can_access: true },
      { role: 'suporte_lify', module_name: 'agendamentos', can_access: true },
      { role: 'suporte_lify', module_name: 'conversas', can_access: true },
      { role: 'suporte_lify', module_name: 'dashboard', can_access: true },
      { role: 'suporte_lify', module_name: 'agentes', can_access: true },
      { role: 'suporte_lify', module_name: 'contextualizar', can_access: true },
      { role: 'suporte_lify', module_name: 'gestao_usuarios', can_access: true },
      { role: 'suporte_lify', module_name: 'configuracoes', can_access: true },
      
      // Admin Lify
      { role: 'admin_lify', module_name: 'conectar_whatsapp', can_access: true },
      { role: 'admin_lify', module_name: 'agendamentos', can_access: true },
      { role: 'admin_lify', module_name: 'conversas', can_access: true },
      { role: 'admin_lify', module_name: 'dashboard', can_access: true },
      { role: 'admin_lify', module_name: 'agentes', can_access: true },
      { role: 'admin_lify', module_name: 'contextualizar', can_access: true },
      { role: 'admin_lify', module_name: 'gestao_usuarios', can_access: true },
      { role: 'admin_lify', module_name: 'clinicas', can_access: true },
      { role: 'admin_lify', module_name: 'configuracoes', can_access: true }
    ];

    // Inserir permissões
    for (const permission of rolePermissions) {
      const { error: permError } = await supabase
        .from('role_permissions')
        .upsert(permission, { onConflict: 'role,module_name' });

      if (permError) {
        console.error(`❌ Erro ao inserir permissão ${permission.role}.${permission.module_name}:`, permError.message);
      }
    }

    console.log('✅ Permissões configuradas');

    // 4. Verificar resultado final
    console.log('\n4️⃣ Verificando resultado final...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profilesError) {
      console.error('❌ Erro ao verificar perfis:', profilesError.message);
    } else {
      console.log(`✅ Total de perfis: ${profiles.length}`);
      profiles.forEach(profile => {
        console.log(`   - ${profile.email} (${profile.role})`);
      });
    }

    const { data: permissions, error: permissionsError } = await supabase
      .from('role_permissions')
      .select('role, module_name');

    if (permissionsError) {
      console.error('❌ Erro ao verificar permissões:', permissionsError.message);
    } else {
      console.log(`✅ Total de permissões: ${permissions.length}`);
    }

    console.log('\n🎉 Estrutura do banco corrigida com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante correção:', error);
  }
}

fixDatabaseStructure(); 