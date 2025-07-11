import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugEdgeFunction() {
  console.log('🔍 Debugando Edge Function create-user-auth\n');

  try {
    // 1. Verificar se a função existe
    console.log('1️⃣ Verificando se a função existe...');
    
    try {
      const { data: functions, error } = await supabase.functions.list();
      if (error) {
        console.error('❌ Erro ao listar funções:', error);
        return;
      }
      
      const createUserFunction = functions.find(f => f.name === 'create-user-auth');
      if (createUserFunction) {
        console.log('✅ Função create-user-auth encontrada');
        console.log('   Status:', createUserFunction.status);
        console.log('   Versão:', createUserFunction.version);
      } else {
        console.log('❌ Função create-user-auth não encontrada');
        return;
      }
    } catch (error) {
      console.error('❌ Erro ao verificar funções:', error);
      return;
    }

    // 2. Verificar estrutura das tabelas
    console.log('\n2️⃣ Verificando estrutura das tabelas...');
    
    const { data: userProfiles, error: userProfilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (userProfilesError) {
      console.error('❌ Erro ao verificar user_profiles:', userProfilesError);
    } else {
      console.log('✅ user_profiles acessível');
      console.log('   Colunas:', Object.keys(userProfiles[0] || {}));
    }

    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*')
      .limit(1);

    if (clinicsError) {
      console.error('❌ Erro ao verificar clinics:', clinicsError);
    } else {
      console.log('✅ clinics acessível');
      console.log('   Colunas:', Object.keys(clinics[0] || {}));
    }

    const { data: clinicUsers, error: clinicUsersError } = await supabase
      .from('clinic_users')
      .select('*')
      .limit(1);

    if (clinicUsersError) {
      console.error('❌ Erro ao verificar clinic_users:', clinicUsersError);
    } else {
      console.log('✅ clinic_users acessível');
      console.log('   Colunas:', Object.keys(clinicUsers[0] || {}));
    }

    // 3. Testar criação de usuário sem clínica (usuário mestre)
    console.log('\n3️⃣ Testando criação de usuário mestre (sem clínica)...');
    
    const masterUserData = {
      name: 'Usuário Mestre Teste',
      email: `mestre.teste.${Date.now()}@exemplo.com`,
      password: '123456',
      role: 'admin_lify'
      // Sem clinicId
    };

    console.log('📝 Dados do usuário mestre:', masterUserData);

    try {
      const { data: masterResult, error: masterError } = await supabase.functions.invoke('create-user-auth', {
        body: masterUserData
      });

      if (masterError) {
        console.error('❌ Erro ao criar usuário mestre:', masterError);
        console.error('   Detalhes:', masterError.message);
      } else if (masterResult?.success) {
        console.log('✅ Usuário mestre criado com sucesso:', masterResult.user);
        
        // Limpar usuário de teste
        await supabase.auth.admin.deleteUser(masterResult.user.id);
        await supabase.from('user_profiles').delete().eq('user_id', masterResult.user.id);
        console.log('✅ Usuário mestre removido');
      }
    } catch (error) {
      console.error('❌ Erro ao testar criação de usuário mestre:', error);
    }

    // 4. Testar criação de usuário com clínica
    console.log('\n4️⃣ Testando criação de usuário normal (com clínica)...');
    
    // Buscar uma clínica para usar no teste
    const { data: availableClinics } = await supabase
      .from('clinics')
      .select('id, name')
      .limit(1);

    if (!availableClinics || availableClinics.length === 0) {
      console.log('⚠️ Nenhuma clínica disponível para teste');
      return;
    }

    const normalUserData = {
      name: 'Usuário Normal Teste',
      email: `normal.teste.${Date.now()}@exemplo.com`,
      password: '123456',
      role: 'atendente',
      clinicId: availableClinics[0].id
    };

    console.log('📝 Dados do usuário normal:', normalUserData);

    try {
      const { data: normalResult, error: normalError } = await supabase.functions.invoke('create-user-auth', {
        body: normalUserData
      });

      if (normalError) {
        console.error('❌ Erro ao criar usuário normal:', normalError);
        console.error('   Detalhes:', normalError.message);
        
        // Tentar obter mais detalhes do erro
        if (normalError.context) {
          console.error('   Contexto:', normalError.context);
        }
      } else if (normalResult?.success) {
        console.log('✅ Usuário normal criado com sucesso:', normalResult.user);
        
        // Verificar se a associação foi criada
        const { data: newUserProfile } = await supabase
          .from('user_profiles')
          .select('*, clinics(name)')
          .eq('user_id', normalResult.user.id)
          .single();

        if (newUserProfile) {
          console.log('✅ Perfil criado:', {
            name: newUserProfile.name,
            role: newUserProfile.role,
            clinic: newUserProfile.clinics?.name || 'Sem clínica'
          });
        }

        // Verificar associação na tabela clinic_users
        const { data: clinicAssociation } = await supabase
          .from('clinic_users')
          .select('*')
          .eq('user_id', normalResult.user.id)
          .single();

        if (clinicAssociation) {
          console.log('✅ Associação clinic_users criada:', {
            clinic_id: clinicAssociation.clinic_id,
            role: clinicAssociation.role,
            is_active: clinicAssociation.is_active
          });
        }

        // Limpar usuário de teste
        await supabase.auth.admin.deleteUser(normalResult.user.id);
        await supabase.from('user_profiles').delete().eq('user_id', normalResult.user.id);
        await supabase.from('clinic_users').delete().eq('user_id', normalResult.user.id);
        console.log('✅ Usuário normal removido');
      }
    } catch (error) {
      console.error('❌ Erro ao testar criação de usuário normal:', error);
    }

    // 5. Verificar logs da função
    console.log('\n5️⃣ Verificando logs da função...');
    console.log('💡 Para ver logs em tempo real, execute:');
    console.log('   npx supabase functions logs create-user-auth --follow');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugEdgeFunction(); 