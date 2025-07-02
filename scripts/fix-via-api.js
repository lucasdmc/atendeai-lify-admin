// Script para corrigir estrutura via API
// Execute: node scripts/fix-via-api.js

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

async function fixViaAPI() {
  console.log('🔧 Corrigindo estrutura via API...\n');

  try {
    // 1. Verificar estrutura atual
    console.log('1️⃣ Verificando estrutura atual...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Erro ao acessar tabela user_profiles:', tableError.message);
      return;
    }

    console.log('✅ Tabela user_profiles acessível');
    console.log('📊 Colunas encontradas:', Object.keys(tableInfo[0] || {}));

    // 2. Tentar inserir perfil admin_lify
    console.log('\n2️⃣ Inserindo perfil admin_lify...');
    
    const adminUserId = 'a6a63be9-6c87-49bf-80dd-0767afe84f6f';
    
    // Tentar inserir com estrutura mínima
    const { error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: adminUserId,
        email: 'lucasdmc@lify.com',
        role: 'admin_lify'
      });

    if (insertError) {
      console.error('❌ Erro ao inserir perfil:', insertError.message);
      
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
      console.log('⚠️ Tabela role_permissions não existe');
      console.log('💡 Execute o script SQL para criar a tabela');
    } else {
      console.log('✅ Tabela role_permissions acessível');
      
      // Inserir permissões básicas
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

    // 4. Verificar resultado
    console.log('\n5️⃣ Verificando resultado...');
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
    console.log('- Tabela user_profiles: ✅ OK');
    console.log('- Tabela role_permissions: ' + (rolePermsError ? '❌ Não existe' : '✅ OK'));
    console.log('- Perfil admin_lify: ' + (profileError ? '❌ Não encontrado' : '✅ Criado'));

    if (rolePermsError) {
      console.log('\n💡 PRÓXIMO PASSO:');
      console.log('Execute o script SQL para criar a tabela role_permissions:');
      console.log('scripts/complete-database-fix.sql');
    }

  } catch (error) {
    console.error('❌ Erro durante correção:', error);
  }
}

fixViaAPI(); 