import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAPIAccess() {
  console.log('🧪 Testando acesso via API...\n');

  try {
    // 1. Verificar sessão
    console.log('1️⃣ Verificando sessão...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao verificar sessão:', sessionError);
      return;
    }

    if (!session) {
      console.log('⚠️  Nenhuma sessão ativa');
      return;
    }

    console.log('✅ Sessão ativa:', session.user.email);

    // 2. Testar acesso à tabela user_profiles
    console.log('\n2️⃣ Testando acesso à user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id);

    if (profilesError) {
      console.error('❌ Erro ao acessar user_profiles:', profilesError);
    } else {
      console.log('✅ Acesso à user_profiles OK');
      console.log('📊 Perfis encontrados:', profiles.length);
      if (profiles.length > 0) {
        console.log('👤 Perfil:', profiles[0]);
      }
    }

    // 3. Testar acesso à tabela role_permissions
    console.log('\n3️⃣ Testando acesso à role_permissions...');
    const { data: permissions, error: permissionsError } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role', 'admin_lify');

    if (permissionsError) {
      console.error('❌ Erro ao acessar role_permissions:', permissionsError);
    } else {
      console.log('✅ Acesso à role_permissions OK');
      console.log('📊 Permissões encontradas:', permissions.length);
    }

    // 4. Testar inserção na user_profiles
    console.log('\n4️⃣ Testando inserção na user_profiles...');
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: session.user.id,
        email: session.user.email,
        name: 'Test User',
        role: 'admin_lify',
        status: true
      })
      .select();

    if (insertError) {
      console.error('❌ Erro ao inserir na user_profiles:', insertError);
    } else {
      console.log('✅ Inserção na user_profiles OK');
      console.log('📝 Dados inseridos:', insertData);
    }

    // 5. Testar atualização na user_profiles
    console.log('\n5️⃣ Testando atualização na user_profiles...');
    const { data: updateData, error: updateError } = await supabase
      .from('user_profiles')
      .update({ name: 'Lucas Admin Lify Updated' })
      .eq('user_id', session.user.id)
      .select();

    if (updateError) {
      console.error('❌ Erro ao atualizar user_profiles:', updateError);
    } else {
      console.log('✅ Atualização na user_profiles OK');
      console.log('📝 Dados atualizados:', updateData);
    }

    // 6. Teste final - buscar perfil específico
    console.log('\n6️⃣ Teste final - buscar perfil específico...');
    const { data: finalProfile, error: finalError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (finalError) {
      console.error('❌ Erro no teste final:', finalError);
    } else {
      console.log('✅ Teste final OK');
      console.log('🎯 Perfil final:', finalProfile);
    }

    console.log('\n🎉 Todos os testes concluídos!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
testAPIAccess().catch(console.error); 