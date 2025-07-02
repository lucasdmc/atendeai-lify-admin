// Script para criar perfil admin_lify
// Execute: node scripts/create-admin-profile.js

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

async function createAdminProfile() {
  console.log('👤 Criando perfil admin_lify...\n');

  try {
    // 1. Verificar se a tabela user_profiles existe
    console.log('1️⃣ Verificando tabela user_profiles...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Erro ao acessar tabela user_profiles:', tableError.message);
      return;
    }

    console.log('✅ Tabela user_profiles acessível');
    console.log('📊 Estrutura da tabela:', Object.keys(tableInfo[0] || {}));

    // 2. Inserir perfil admin_lify diretamente
    console.log('\n2️⃣ Inserindo perfil admin_lify...');
    
    // Usar o ID do usuário que você mencionou
    const adminUserId = 'a6a63be9-6c87-49bf-80dd-0767afe84f6f';
    
    const { error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: adminUserId,
        email: 'lucasdmc@lify.com',
        name: 'Lucas Admin',
        role: 'admin_lify',
        status: true
      });

    if (insertError) {
      console.error('❌ Erro ao inserir perfil:', insertError.message);
      console.log('📋 Detalhes do erro:', insertError);
      
      // Se der erro de duplicata, tentar atualizar
      if (insertError.code === '23505') {
        console.log('🔄 Tentando atualizar perfil existente...');
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            role: 'admin_lify',
            name: 'Lucas Admin',
            status: true
          })
          .eq('user_id', adminUserId);

        if (updateError) {
          console.error('❌ Erro ao atualizar perfil:', updateError.message);
        } else {
          console.log('✅ Perfil atualizado com sucesso');
        }
      }
    } else {
      console.log('✅ Perfil admin_lify criado com sucesso');
    }

    // 3. Configurar permissões básicas
    console.log('\n3️⃣ Configurando permissões básicas...');
    
    const basicPermissions = [
      { role: 'admin_lify', module_name: 'dashboard', can_access: true },
      { role: 'admin_lify', module_name: 'conversas', can_access: true },
      { role: 'admin_lify', module_name: 'conectar_whatsapp', can_access: true },
      { role: 'admin_lify', module_name: 'agentes', can_access: true },
      { role: 'admin_lify', module_name: 'agendamentos', can_access: true },
      { role: 'admin_lify', module_name: 'clinicas', can_access: true },
      { role: 'admin_lify', module_name: 'contextualizar', can_access: true },
      { role: 'admin_lify', module_name: 'gestao_usuarios', can_access: true },
      { role: 'admin_lify', module_name: 'configuracoes', can_access: true }
    ];

    for (const permission of basicPermissions) {
      const { error: permError } = await supabase
        .from('role_permissions')
        .upsert(permission, { onConflict: 'role,module_name' });

      if (permError) {
        console.error(`❌ Erro ao inserir permissão ${permission.module_name}:`, permError.message);
      }
    }

    console.log('✅ Permissões básicas configuradas');

    // 4. Verificar resultado
    console.log('\n4️⃣ Verificando resultado...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', adminUserId)
      .single();

    if (profileError) {
      console.error('❌ Erro ao verificar perfil:', profileError.message);
    } else {
      console.log('✅ Perfil encontrado:', profile);
    }

    const { data: permissions, error: permissionsError } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role', 'admin_lify');

    if (permissionsError) {
      console.error('❌ Erro ao verificar permissões:', permissionsError.message);
    } else {
      console.log(`✅ Total de permissões admin_lify: ${permissions.length}`);
    }

    console.log('\n🎉 Perfil admin_lify configurado com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante criação:', error);
  }
}

createAdminProfile(); 