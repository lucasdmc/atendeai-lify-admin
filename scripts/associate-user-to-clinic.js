import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function associateUserToClinic() {
  console.log('🔗 Verificando associação do usuário à clínica...\n');

  try {
    // 1. Buscar o usuário pelo ID correto
    console.log('1️⃣ Buscando usuário cardio@lify.com.br...');
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', '7e4e0041-f547-445d-a81c-4605d12c1e27')
      .single();

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }

    if (!userProfile) {
      console.error('❌ Usuário cardio@lify.com.br não encontrado');
      return;
    }

    console.log(`✅ Usuário encontrado: ${userProfile.email} (${userProfile.user_id})`);
    console.log(`   - Nome: ${userProfile.name}`);
    console.log(`   - Role: ${userProfile.role}`);
    console.log(`   - Clinic ID: ${userProfile.clinic_id}`);

    // 2. Buscar a clínica CardioPrime
    console.log('\n2️⃣ Buscando clínica CardioPrime...');
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', '4a73f615-b636-4134-8937-c20b5db5acac')
      .single();

    if (clinicError) {
      console.error('❌ Erro ao buscar clínica:', clinicError);
      return;
    }

    if (!clinic) {
      console.error('❌ Clínica CardioPrime não encontrada');
      return;
    }

    console.log(`✅ Clínica encontrada: ${clinic.name} (${clinic.id})`);

    // 3. Verificar se a associação já está correta
    if (userProfile.clinic_id === clinic.id) {
      console.log('✅ Usuário já está associado à clínica correta!');
    } else {
      console.log('⚠️  Usuário não está associado à clínica correta, atualizando...');
      
      // Atualizar perfil do usuário com a clínica
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          clinic_id: clinic.id,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', '7e4e0041-f547-445d-a81c-4605d12c1e27');

      if (updateError) {
        console.error('❌ Erro ao atualizar perfil:', updateError);
        return;
      }

      console.log('✅ Perfil atualizado com sucesso!');
    }

    // 4. Verificar se existe associação na tabela clinic_users
    console.log('\n4️⃣ Verificando associação na tabela clinic_users...');
    const { data: existingClinicUser, error: clinicUserError } = await supabase
      .from('clinic_users')
      .select('*')
      .eq('user_id', '7e4e0041-f547-445d-a81c-4605d12c1e27')
      .eq('clinic_id', clinic.id)
      .single();

    if (clinicUserError && clinicUserError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar associação:', clinicUserError);
      return;
    }

    if (!existingClinicUser) {
      console.log('✅ Criando associação na tabela clinic_users...');
      
      // Criar associação
      const { error: insertClinicUserError } = await supabase
        .from('clinic_users')
        .insert({
          user_id: '7e4e0041-f547-445d-a81c-4605d12c1e27',
          clinic_id: clinic.id,
          role: 'atendente',
          is_active: true
        });

      if (insertClinicUserError) {
        console.error('❌ Erro ao criar associação:', insertClinicUserError);
        return;
      }

      console.log('✅ Associação criada com sucesso!');
    } else {
      console.log('✅ Associação já existe na tabela clinic_users!');
    }

    // 5. Verificar resultado final
    console.log('\n5️⃣ Verificando resultado final...');
    const { data: finalProfile, error: finalError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', '7e4e0041-f547-445d-a81c-4605d12c1e27')
      .single();

    if (finalError) {
      console.error('❌ Erro ao verificar perfil final:', finalError);
    } else {
      console.log('✅ Perfil final:');
      console.log(`   - Email: ${finalProfile.email}`);
      console.log(`   - Nome: ${finalProfile.name}`);
      console.log(`   - Role: ${finalProfile.role}`);
      console.log(`   - Clinic ID: ${finalProfile.clinic_id}`);
      console.log(`   - Status: ${finalProfile.status}`);
    }

    console.log('\n🎉 Usuário associado à clínica com sucesso!');
    console.log('🔍 Agora o usuário cardio@lify.com.br deve ver apenas conversas da CardioPrime');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
associateUserToClinic(); 