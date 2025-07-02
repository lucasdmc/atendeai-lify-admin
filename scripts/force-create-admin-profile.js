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

async function forceCreateAdminProfile() {
  console.log('🔧 Forçando criação do perfil admin_lify...\n');

  try {
    // 1. Verificar se há sessão ativa
    console.log('1️⃣ Verificando sessão ativa...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao verificar sessão:', sessionError);
      return;
    }

    if (!session) {
      console.log('⚠️  Nenhuma sessão ativa encontrada');
      console.log('💡 Faça login no frontend primeiro');
      return;
    }

    console.log('✅ Sessão ativa encontrada');
    console.log(`👤 User ID: ${session.user.id}`);
    console.log(`📧 Email: ${session.user.email}\n`);

    // 2. Deletar perfil existente (se houver)
    console.log('2️⃣ Deletando perfil existente...');
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', session.user.id);

    if (deleteError) {
      console.log('⚠️  Erro ao deletar perfil (pode não existir):', deleteError.message);
    } else {
      console.log('✅ Perfil existente deletado');
    }

    // 3. Criar novo perfil como admin_lify
    console.log('3️⃣ Criando novo perfil como admin_lify...');
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: session.user.id,
        email: session.user.email,
        name: 'Lucas Admin Lify',
        role: 'admin_lify',
        status: true
      })
      .select('*')
      .single();

    if (createError) {
      console.error('❌ Erro ao criar perfil:', createError);
      return;
    }

    console.log('✅ Perfil criado com sucesso:', newProfile);

    // 4. Verificar se as permissões existem
    console.log('4️⃣ Verificando permissões...');
    const { data: permissions, error: permError } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role', 'admin_lify');

    if (permError) {
      console.error('❌ Erro ao buscar permissões:', permError);
    } else {
      console.log(`✅ ${permissions.length} permissões encontradas para admin_lify`);
    }

    // 5. Testar acesso ao perfil
    console.log('5️⃣ Testando acesso ao perfil...');
    const { data: testProfile, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (testError) {
      console.error('❌ Erro ao testar acesso:', testError);
    } else {
      console.log('✅ Acesso ao perfil funcionando:', testProfile);
    }

    console.log('\n🎉 Perfil admin_lify criado com sucesso!');
    console.log('🔄 Recarregue a página para ver as mudanças no sidebar.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
forceCreateAdminProfile().catch(console.error); 