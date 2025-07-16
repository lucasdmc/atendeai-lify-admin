import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://atendeai-lify-admin.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0ZW5kZWFpLWxpZnktYWRtaW4iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzE5NzI5MCwiZXhwIjoyMDUyNzc3MjkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUserPermissions() {
  console.log('🔍 Debugando permissões do usuário admin_lify...\n');

  try {
    // 1. Buscar o perfil do usuário admin_lify
    console.log('1. Buscando perfil do usuário admin_lify...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'admin_lify');

    if (profileError) {
      console.error('❌ Erro ao buscar perfis:', profileError);
      return;
    }

    console.log(`✅ Encontrados ${profiles.length} perfis com role admin_lify:`);
    profiles.forEach(profile => {
      console.log(`   - ID: ${profile.user_id}`);
      console.log(`   - Email: ${profile.email}`);
      console.log(`   - Nome: ${profile.name}`);
      console.log(`   - Role: ${profile.role}`);
      console.log(`   - Status: ${profile.status}`);
      console.log('');
    });

    // 2. Verificar permissões definidas no código
    console.log('2. Verificando permissões definidas para admin_lify...');
    const rolePermissions = {
      admin_lify: [
        'conectar_whatsapp',
        'agendamentos',
        'conversas',
        'dashboard',
        'agentes',
        'contextualizar',
        'gestao_usuarios',
        'clinicas',
        'configuracoes'
      ]
    };

    const adminLifyPermissions = rolePermissions.admin_lify;
    console.log('✅ Permissões definidas para admin_lify:');
    adminLifyPermissions.forEach(permission => {
      console.log(`   - ${permission}`);
    });

    // 3. Verificar se a permissão 'agentes' está incluída
    console.log('\n3. Verificando se a permissão "agentes" está incluída...');
    const hasAgentesPermission = adminLifyPermissions.includes('agentes');
    console.log(`✅ admin_lify tem permissão 'agentes': ${hasAgentesPermission}`);

    // 4. Simular a lógica da página de Agentes
    console.log('\n4. Simulando lógica da página de Agentes...');
    const userRole = 'admin_lify';
    const userPermissions = adminLifyPermissions;
    
    const canCreateAgents = userRole === 'admin_lify' || 
                           userRole === 'suporte_lify' || 
                           userPermissions?.includes('agentes');
    
    console.log(`   - userRole: ${userRole}`);
    console.log(`   - userPermissions inclui 'agentes': ${userPermissions?.includes('agentes')}`);
    console.log(`   - canCreateAgents: ${canCreateAgents}`);

    // 5. Verificar se há algum problema com a condição
    console.log('\n5. Análise da condição canCreateAgents...');
    console.log(`   - userRole === 'admin_lify': ${userRole === 'admin_lify'}`);
    console.log(`   - userRole === 'suporte_lify': ${userRole === 'suporte_lify'}`);
    console.log(`   - userPermissions?.includes('agentes'): ${userPermissions?.includes('agentes')}`);
    
    const condition1 = userRole === 'admin_lify';
    const condition2 = userRole === 'suporte_lify';
    const condition3 = userPermissions?.includes('agentes');
    
    console.log(`   - Condição 1 (admin_lify): ${condition1}`);
    console.log(`   - Condição 2 (suporte_lify): ${condition2}`);
    console.log(`   - Condição 3 (includes 'agentes'): ${condition3}`);
    console.log(`   - Resultado final: ${condition1 || condition2 || condition3}`);

    // 6. Verificar se há usuários ativos com role admin_lify
    console.log('\n6. Verificando usuários ativos com role admin_lify...');
    const { data: activeProfiles, error: activeError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'admin_lify')
      .eq('status', true);

    if (activeError) {
      console.error('❌ Erro ao buscar perfis ativos:', activeError);
    } else {
      console.log(`✅ Encontrados ${activeProfiles.length} perfis ativos com role admin_lify:`);
      activeProfiles.forEach(profile => {
        console.log(`   - ${profile.name} (${profile.email})`);
      });
    }

    console.log('\n🎯 CONCLUSÃO:');
    if (canCreateAgents) {
      console.log('✅ O usuário admin_lify DEVE ter acesso ao botão "Novo Agente"');
      console.log('🔍 Se o botão não está aparecendo, o problema pode ser:');
      console.log('   - Cache do navegador');
      console.log('   - Problema no carregamento das permissões');
      console.log('   - Erro no hook useAuth');
    } else {
      console.log('❌ O usuário admin_lify NÃO tem acesso ao botão "Novo Agente"');
      console.log('🔍 Verificar se há algum problema na lógica de permissões');
    }

  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  }
}

// Executar o debug
debugUserPermissions(); 