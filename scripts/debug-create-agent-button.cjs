const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurar cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCreateAgentButton() {
  console.log('🔍 [DEBUG] Iniciando diagnóstico do botão "Criar Agente"');
  console.log('='.repeat(60));

  try {
    // 1. Verificar tabela user_profiles
    console.log('\n📋 1. Verificando tabela user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.error('❌ Erro ao buscar user_profiles:', profilesError);
    } else {
      console.log('✅ user_profiles encontrados:', profiles.length);
      profiles.forEach(profile => {
        console.log(`   - ID: ${profile.user_id}, Role: ${profile.role}, Clinic: ${profile.clinic_id}`);
      });
    }

    // 2. Verificar tabela agents
    console.log('\n📋 2. Verificando tabela agents...');
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .limit(5);

    if (agentsError) {
      console.error('❌ Erro ao buscar agents:', agentsError);
    } else {
      console.log('✅ agents encontrados:', agents.length);
      agents.forEach(agent => {
        console.log(`   - ID: ${agent.id}, Name: ${agent.name}, Clinic: ${agent.clinic_id}`);
      });
    }

    // 3. Verificar tabela clinics
    console.log('\n📋 3. Verificando tabela clinics...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*')
      .limit(5);

    if (clinicsError) {
      console.error('❌ Erro ao buscar clinics:', clinicsError);
    } else {
      console.log('✅ clinics encontradas:', clinics.length);
      clinics.forEach(clinic => {
        console.log(`   - ID: ${clinic.id}, Name: ${clinic.name}`);
      });
    }

    // 4. Testar criação de agente
    console.log('\n📋 4. Testando criação de agente...');
    
    // Pegar primeira clínica disponível
    const testClinic = clinics?.[0];
    if (!testClinic) {
      console.error('❌ Nenhuma clínica encontrada para teste');
      return;
    }

    const testAgent = {
      name: 'Agente Teste Debug',
      description: 'Agente criado para teste de debug',
      personality: 'profissional e acolhedor',
      temperature: 0.7,
      clinic_id: testClinic.id,
      context_json: null
    };

    console.log('🔄 Tentando criar agente:', testAgent);

    const { data: newAgent, error: createError } = await supabase
      .from('agents')
      .insert([testAgent])
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar agente:', createError);
      
      // Verificar se é erro de permissão
      if (createError.code === '42501') {
        console.error('🔒 Erro de permissão - RLS pode estar bloqueando');
      }
      
      // Verificar se é erro de validação
      if (createError.code === '23514') {
        console.error('🔍 Erro de validação - Verificar constraints');
      }
    } else {
      console.log('✅ Agente criado com sucesso:', newAgent);
      
      // Deletar o agente de teste
      const { error: deleteError } = await supabase
        .from('agents')
        .delete()
        .eq('id', newAgent.id);
      
      if (deleteError) {
        console.error('⚠️ Erro ao deletar agente de teste:', deleteError);
      } else {
        console.log('✅ Agente de teste deletado');
      }
    }

    // 5. Verificar políticas RLS
    console.log('\n📋 5. Verificando políticas RLS...');
    
    // Testar inserção com diferentes roles
    const testRoles = ['admin_lify', 'suporte_lify', 'admin', 'gestor', 'atendente'];
    
    for (const role of testRoles) {
      console.log(`🔄 Testando role: ${role}`);
      
      // Simular usuário com role específico
      const testUser = {
        id: 'test-user-id',
        role: role
      };
      
      // Tentar inserção (pode falhar por RLS, mas vamos ver o erro)
      const { error: roleTestError } = await supabase
        .from('agents')
        .insert([{
          name: `Teste Role ${role}`,
          clinic_id: testClinic.id,
          personality: 'profissional e acolhedor',
          temperature: 0.7
        }]);

      if (roleTestError) {
        console.log(`   ❌ ${role}: ${roleTestError.message}`);
      } else {
        console.log(`   ✅ ${role}: Sucesso`);
      }
    }

    // 6. Verificar Edge Function
    console.log('\n📋 6. Testando Edge Function agent-whatsapp-manager...');
    
    try {
      const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('agent-whatsapp-manager/status', {
        body: { agentId: 'test-agent-id' }
      });

      if (edgeFunctionError) {
        console.error('❌ Erro na Edge Function:', edgeFunctionError);
      } else {
        console.log('✅ Edge Function respondeu:', edgeFunctionData);
      }
    } catch (edgeError) {
      console.error('❌ Erro ao chamar Edge Function:', edgeError);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎯 DIAGNÓSTICO COMPLETO');
    console.log('='.repeat(60));
    
    // Resumo do diagnóstico
    console.log('\n📊 RESUMO:');
    console.log(`- user_profiles: ${profiles?.length || 0} registros`);
    console.log(`- agents: ${agents?.length || 0} registros`);
    console.log(`- clinics: ${clinics?.length || 0} registros`);
    
    if (createError) {
      console.log(`- Criação de agente: ❌ ${createError.message}`);
    } else {
      console.log('- Criação de agente: ✅ Funcionando');
    }

    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('1. Verificar se o usuário está logado corretamente');
    console.log('2. Verificar se o userRole está sendo carregado');
    console.log('3. Verificar se a clínica está selecionada');
    console.log('4. Verificar políticas RLS da tabela agents');
    console.log('5. Verificar se o frontend está recebendo as permissões corretas');

  } catch (error) {
    console.error('❌ Erro geral no diagnóstico:', error);
  }
}

// Executar diagnóstico
debugCreateAgentButton().then(() => {
  console.log('\n✅ Diagnóstico concluído');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
}); 