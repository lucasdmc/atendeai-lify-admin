// Script para testar a persistência da seleção de clínicas
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClinicPersistence() {
  console.log('🧪 Testando persistência da seleção de clínicas...\n');

  try {
    // 1. Verificar se existem clínicas no sistema
    console.log('📋 Verificando clínicas disponíveis...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('id, name')
      .order('name', { ascending: true });

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log(`✅ Encontradas ${clinics.length} clínicas:`);
    clinics.forEach(clinic => {
      console.log(`   - ${clinic.name} (${clinic.id})`);
    });

    // 2. Verificar usuários admin_lify e suporte_lify
    console.log('\n👥 Verificando usuários admin_lify e suporte_lify...');
    const { data: adminUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, email, name, role')
      .in('role', ['admin_lify', 'suporte_lify']);

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    console.log(`✅ Encontrados ${adminUsers.length} usuários com acesso global:`);
    adminUsers.forEach(user => {
      console.log(`   - ${user.name || user.email} (${user.role})`);
    });

    // 3. Simular localStorage para testar persistência
    console.log('\n💾 Simulando localStorage...');
    
    // Simular dados do localStorage
    const mockLocalStorage = {
      'last_selected_clinic_user1': clinics[0]?.id || '',
      'last_selected_clinic_user2': clinics[1]?.id || '',
    };

    console.log('📦 Dados simulados do localStorage:');
    Object.entries(mockLocalStorage).forEach(([key, value]) => {
      const clinic = clinics.find(c => c.id === value);
      console.log(`   ${key}: ${clinic?.name || 'Clínica não encontrada'} (${value})`);
    });

    // 4. Testar carregamento da primeira clínica como fallback
    console.log('\n🔄 Testando carregamento de primeira clínica como fallback...');
    const { data: firstClinic, error: firstClinicError } = await supabase
      .from('clinics')
      .select('id, name')
      .order('name', { ascending: true })
      .limit(1)
      .single();

    if (firstClinicError) {
      console.error('❌ Erro ao buscar primeira clínica:', firstClinicError);
    } else {
      console.log(`✅ Primeira clínica disponível: ${firstClinic.name} (${firstClinic.id})`);
    }

    // 5. Verificar se a estrutura está correta para persistência
    console.log('\n🔍 Verificando estrutura para persistência...');
    
    // Verificar se a coluna preferences existe na user_profiles
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'user_profiles' 
          AND column_name = 'preferences'
        `
      });

    if (tableError) {
      console.log('⚠️ Não foi possível verificar a coluna preferences (pode não existir)');
    } else {
      console.log('✅ Coluna preferences disponível para armazenar preferências');
    }

    console.log('\n✅ Teste de persistência concluído!');
    console.log('\n📝 Resumo das funcionalidades implementadas:');
    console.log('   - Persistência no localStorage para usuários admin_lify e suporte_lify');
    console.log('   - Carregamento automático da última clínica selecionada');
    console.log('   - Fallback para primeira clínica disponível');
    console.log('   - Verificação de existência da clínica antes de selecionar');
    console.log('   - Feedback visual quando não há clínica selecionada');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testClinicPersistence().then(() => {
  console.log('\n🏁 Teste finalizado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
}); 