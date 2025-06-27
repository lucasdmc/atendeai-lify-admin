import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL() {
  try {
    console.log('🚀 Executando script SQL no Supabase...');
    
    // 1. Verificar se o usuário existe
    console.log('\n1. Verificando usuário...');
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', 'lucasdmc@lify.com')
      .single();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }
    
    console.log('✅ Usuário encontrado:', user);

    // 2. Garantir que o usuário tem perfil com role admin_lify
    console.log('\n2. Atualizando perfil do usuário...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        name: 'Lucas Admin',
        role: 'admin_lify',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('❌ Erro ao atualizar perfil:', profileError);
      return;
    }

    console.log('✅ Perfil atualizado:', profile);

    // 3. Limpar permissões antigas para admin_lify
    console.log('\n3. Limpando permissões antigas...');
    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role', 'admin_lify');

    if (deleteError) {
      console.error('❌ Erro ao limpar permissões:', deleteError);
      return;
    }

    console.log('✅ Permissões antigas removidas');

    // 4. Inserir TODAS as permissões para admin_lify
    console.log('\n4. Inserindo novas permissões...');
    const permissions = [
      'dashboard',
      'conversas',
      'conectar_whatsapp',
      'agentes',
      'agendamentos',
      'clinicas',
      'contextualizar',
      'gestao_usuarios',
      'configuracoes'
    ];

    const permissionsData = permissions.map(module => ({
      role: 'admin_lify',
      module_name: module,
      can_access: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data: permissionsResult, error: permissionsError } = await supabase
      .from('role_permissions')
      .insert(permissionsData);

    if (permissionsError) {
      console.error('❌ Erro ao inserir permissões:', permissionsError);
      return;
    }

    console.log('✅ Permissões inseridas:', permissionsResult);

    // 5. Verificar resultado
    console.log('\n5. Verificando resultado...');
    const { data: finalProfile, error: finalProfileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (finalProfileError) {
      console.error('❌ Erro ao verificar perfil final:', finalProfileError);
      return;
    }

    const { data: finalPermissions, error: finalPermissionsError } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role', 'admin_lify');

    if (finalPermissionsError) {
      console.error('❌ Erro ao verificar permissões finais:', finalPermissionsError);
      return;
    }

    console.log('\n🎉 SCRIPT EXECUTADO COM SUCESSO!');
    console.log('\n📊 RESULTADO FINAL:');
    console.log('Perfil:', finalProfile);
    console.log('Total de permissões:', finalPermissions.length);
    console.log('Permissões:', finalPermissions.map(p => p.module_name));

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

executeSQL(); 