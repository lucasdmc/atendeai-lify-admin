// Script para corrigir estrutura das tabelas
// Execute: node scripts/fix-tables-structure.js

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

async function fixTablesStructure() {
  console.log('🔧 Corrigindo estrutura das tabelas...\n');

  try {
    // 1. Verificar estrutura atual da tabela user_profiles
    console.log('1️⃣ Verificando estrutura da tabela user_profiles...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Erro ao acessar tabela user_profiles:', tableError.message);
    } else {
      console.log('✅ Tabela user_profiles acessível');
      console.log('📊 Colunas encontradas:', Object.keys(tableInfo[0] || {}));
    }

    // 2. Tentar inserir perfil com estrutura mínima
    console.log('\n2️⃣ Tentando inserir perfil com estrutura mínima...');
    
    const adminUserId = 'a6a63be9-6c87-49bf-80dd-0767afe84f6f';
    
    // Tentar inserir apenas com campos básicos
    const { error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: adminUserId,
        email: 'lucasdmc@lify.com',
        role: 'admin_lify'
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
            role: 'admin_lify'
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

    // 3. Verificar se a tabela role_permissions existe
    console.log('\n3️⃣ Verificando tabela role_permissions...');
    const { data: rolePerms, error: rolePermsError } = await supabase
      .from('role_permissions')
      .select('*')
      .limit(1);

    if (rolePermsError) {
      console.log('⚠️ Tabela role_permissions não existe ou não acessível');
      console.log('💡 Será necessário criar a tabela via SQL');
    } else {
      console.log('✅ Tabela role_permissions acessível');
      console.log('📊 Colunas encontradas:', Object.keys(rolePerms[0] || {}));
      
      // Tentar inserir permissões básicas
      console.log('\n4️⃣ Inserindo permissões básicas...');
      
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
        } else {
          console.log(`✅ Permissão ${permission.module_name} inserida`);
        }
      }
    }

    // 4. Verificar resultado final
    console.log('\n5️⃣ Verificando resultado final...');
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

    console.log('\n📋 RESUMO:');
    console.log('- Tabela user_profiles: ' + (tableError ? '❌ Problema' : '✅ OK'));
    console.log('- Tabela role_permissions: ' + (rolePermsError ? '❌ Não existe' : '✅ OK'));
    console.log('- Perfil admin_lify: ' + (profileError ? '❌ Não encontrado' : '✅ Criado'));

    if (tableError || rolePermsError) {
      console.log('\n💡 PRÓXIMOS PASSOS:');
      console.log('1. Execute o script SQL para criar/corrigir as tabelas');
      console.log('2. Execute este script novamente para configurar os dados');
    }

  } catch (error) {
    console.error('❌ Erro durante correção:', error);
  }
}

fixTablesStructure(); 