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

async function testUserProfileAccess() {
  console.log('🧪 Testando acesso ao perfil do usuário...\n');

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

    // 2. Tentar buscar perfil do usuário
    console.log('2️⃣ Buscando perfil do usuário...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      
      // 3. Se não encontrou perfil, tentar criar
      if (profileError.code === 'PGRST116') {
        console.log('\n3️⃣ Perfil não encontrado. Tentando criar...');
        
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: session.user.id,
            email: session.user.email,
            name: session.user.email?.split('@')[0] || 'Usuário',
            role: 'admin_lify',
            status: true
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Erro ao criar perfil:', createError);
          return;
        }

        console.log('✅ Perfil criado com sucesso:', newProfile);
      }
      return;
    }

    console.log('✅ Perfil encontrado:', profile);

    // 4. Verificar permissões
    console.log('\n4️⃣ Verificando permissões...');
    const { data: permissions, error: permError } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role', profile.role);

    if (permError) {
      console.error('❌ Erro ao buscar permissões:', permError);
    } else {
      console.log(`✅ ${permissions.length} permissões encontradas para role '${profile.role}'`);
      permissions.forEach(perm => {
        console.log(`   - ${perm.module_name}: ${perm.can_access ? '✅' : '❌'}`);
      });
    }

    // 5. Testar módulos que devem aparecer no sidebar
    console.log('\n5️⃣ Testando módulos do sidebar...');
    const modules = [
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

    modules.forEach(module => {
      const hasAccess = permissions?.some(p => p.module_name === module && p.can_access);
      console.log(`   ${module}: ${hasAccess ? '✅' : '❌'}`);
    });

    console.log('\n🎯 Resumo:');
    console.log(`   Role: ${profile.role}`);
    console.log(`   Módulos com acesso: ${permissions?.filter(p => p.can_access).length || 0}`);
    console.log(`   Total de módulos: ${modules.length}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testUserProfileAccess().catch(console.error); 