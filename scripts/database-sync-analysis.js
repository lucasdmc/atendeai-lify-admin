import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabaseSync() {
  console.log('🔍 ANÁLISE COMPLETA DO BANCO DE DADOS');
  console.log('=====================================\n');

  // 1. Verificar tabelas principais
  console.log('📊 TABELAS PRINCIPAIS:');
  
  try {
    // user_profiles
    const { data: userProfiles, error: upError } = await supabase
      .from('user_profiles')
      .select('*');
    
    console.log(`✅ user_profiles: ${userProfiles?.length || 0} registros`);
    if (userProfiles?.length > 0) {
      console.log(`   - Roles: ${[...new Set(userProfiles.map(u => u.role))].join(', ')}`);
    }

    // agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*');
    
    console.log(`✅ agents: ${agents?.length || 0} registros`);
    if (agents?.length > 0) {
      console.log(`   - Agentes ativos: ${agents.filter(a => a.is_active).length}`);
    }

    // clinics
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*');
    
    console.log(`✅ clinics: ${clinics?.length || 0} registros`);

    // agent_whatsapp_connections
    const { data: connections, error: connError } = await supabase
      .from('agent_whatsapp_connections')
      .select('*');
    
    console.log(`✅ agent_whatsapp_connections: ${connections?.length || 0} registros`);
    if (connections?.length > 0) {
      const connected = connections.filter(c => c.connection_status === 'connected');
      console.log(`   - Conexões ativas: ${connected.length}`);
    }

    // appointments
    const { data: appointments, error: appError } = await supabase
      .from('appointments')
      .select('*');
    
    console.log(`✅ appointments: ${appointments?.length || 0} registros`);

    // conversations
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*');
    
    console.log(`✅ conversations: ${conversations?.length || 0} registros`);

    // role_permissions
    const { data: permissions, error: permError } = await supabase
      .from('role_permissions')
      .select('*');
    
    console.log(`✅ role_permissions: ${permissions?.length || 0} registros`);

  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error);
  }

  console.log('\n🔧 VERIFICAÇÕES DE SINCRONIZAÇÃO:');
  console.log('==================================');

  // 2. Verificar se usuários têm perfis
  console.log('\n👥 VERIFICAÇÃO DE USUÁRIOS:');
  try {
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('⚠️ Não foi possível verificar usuários (sem permissão admin)');
    } else {
      console.log(`📊 Total de usuários: ${users?.users?.length || 0}`);
      
      // Verificar se todos os usuários têm perfis
      const { data: profiles } = await supabase.from('user_profiles').select('user_id');
      const profileUserIds = profiles?.map(p => p.user_id) || [];
      
      const usersWithoutProfiles = users?.users?.filter(u => 
        !profileUserIds.includes(u.id)
      ) || [];
      
      if (usersWithoutProfiles.length > 0) {
        console.log(`⚠️ Usuários sem perfil: ${usersWithoutProfiles.length}`);
        usersWithoutProfiles.forEach(u => {
          console.log(`   - ${u.email} (${u.id})`);
        });
      } else {
        console.log('✅ Todos os usuários têm perfis');
      }
    }
  } catch (error) {
    console.log('⚠️ Erro ao verificar usuários:', error.message);
  }

  // 3. Verificar agentes e suas conexões
  console.log('\n🤖 VERIFICAÇÃO DE AGENTES:');
  try {
    const { data: agents } = await supabase.from('agents').select('*');
    const { data: connections } = await supabase.from('agent_whatsapp_connections').select('*');
    
    if (agents?.length > 0) {
      console.log(`📊 Total de agentes: ${agents.length}`);
      
      agents.forEach(agent => {
        const agentConnections = connections?.filter(c => c.agent_id === agent.id) || [];
        const activeConnections = agentConnections.filter(c => c.connection_status === 'connected');
        
        console.log(`   - ${agent.name}: ${activeConnections.length} conexão(ões) ativa(s)`);
      });
    }
  } catch (error) {
    console.log('❌ Erro ao verificar agentes:', error.message);
  }

  // 4. Verificar clínicas e usuários
  console.log('\n🏥 VERIFICAÇÃO DE CLÍNICAS:');
  try {
    const { data: clinics } = await supabase.from('clinics').select('*');
    const { data: profiles } = await supabase.from('user_profiles').select('*');
    
    if (clinics?.length > 0) {
      console.log(`📊 Total de clínicas: ${clinics.length}`);
      
      clinics.forEach(clinic => {
        const clinicUsers = profiles?.filter(p => p.clinic_id === clinic.id) || [];
        console.log(`   - ${clinic.name}: ${clinicUsers.length} usuário(s)`);
      });
    }
  } catch (error) {
    console.log('❌ Erro ao verificar clínicas:', error.message);
  }

  // 5. Verificar permissões
  console.log('\n🔐 VERIFICAÇÃO DE PERMISSÕES:');
  try {
    const { data: permissions } = await supabase.from('role_permissions').select('*');
    
    if (permissions?.length > 0) {
      const roles = [...new Set(permissions.map(p => p.role))];
      const modules = [...new Set(permissions.map(p => p.module_name))];
      
      console.log(`📊 Total de permissões: ${permissions.length}`);
      console.log(`   - Roles: ${roles.join(', ')}`);
      console.log(`   - Módulos: ${modules.join(', ')}`);
    }
  } catch (error) {
    console.log('❌ Erro ao verificar permissões:', error.message);
  }

  // 6. Verificar integridade referencial
  console.log('\n🔗 VERIFICAÇÃO DE INTEGRIDADE:');
  try {
    // Verificar se agentes têm clínicas válidas
    const { data: agents } = await supabase.from('agents').select('clinic_id');
    const { data: clinics } = await supabase.from('clinics').select('id');
    
    const clinicIds = clinics?.map(c => c.id) || [];
    const invalidAgents = agents?.filter(a => a.clinic_id && !clinicIds.includes(a.clinic_id)) || [];
    
    if (invalidAgents.length > 0) {
      console.log(`⚠️ Agentes com clínicas inválidas: ${invalidAgents.length}`);
    } else {
      console.log('✅ Todos os agentes têm clínicas válidas');
    }
  } catch (error) {
    console.log('❌ Erro ao verificar integridade:', error.message);
  }

  console.log('\n🎯 RECOMENDAÇÕES:');
  console.log('==================');
  
  // Gerar recomendações baseadas na análise
  const recommendations = [];
  
  try {
    const { data: profiles } = await supabase.from('user_profiles').select('*');
    const { data: agents } = await supabase.from('agents').select('*');
    const { data: connections } = await supabase.from('agent_whatsapp_connections').select('*');
    
    if (profiles?.length === 0) {
      recommendations.push('❌ Criar perfis para usuários');
    }
    
    if (agents?.length === 0) {
      recommendations.push('❌ Criar agentes para o sistema');
    }
    
    if (connections?.length === 0) {
      recommendations.push('⚠️ Nenhuma conexão WhatsApp configurada');
    }
    
    const activeConnections = connections?.filter(c => c.connection_status === 'connected') || [];
    if (activeConnections.length === 0) {
      recommendations.push('⚠️ Nenhuma conexão WhatsApp ativa');
    }
    
    if (recommendations.length === 0) {
      console.log('✅ Sistema bem configurado!');
    } else {
      recommendations.forEach(rec => console.log(rec));
    }
    
  } catch (error) {
    console.log('❌ Erro ao gerar recomendações:', error.message);
  }

  console.log('\n📋 RESUMO:');
  console.log('==========');
  console.log('✅ Análise completa concluída');
  console.log('✅ Verificações de integridade realizadas');
  console.log('✅ Recomendações geradas');
}

// Executar análise
analyzeDatabaseSync().then(() => {
  console.log('\n🎉 Análise do banco de dados finalizada!');
}); 