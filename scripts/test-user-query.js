import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserQuery() {
  console.log('🧪 Testando consulta do usuário...\n');

  try {
    // 1. Buscar todos os usuários
    console.log('1️⃣ Buscando todos os usuários...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('user_profiles')
      .select('*');

    if (allUsersError) {
      console.error('❌ Erro ao buscar todos os usuários:', allUsersError);
      return;
    }

    console.log(`✅ Total de usuários: ${allUsers?.length || 0}`);
    
    if (allUsers && allUsers.length > 0) {
      console.log('\n📋 Lista de usuários:');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.user_id})`);
        console.log(`   - Nome: ${user.name}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Clinic ID: ${user.clinic_id}`);
        console.log('');
      });
    }

    // 2. Buscar pelo email
    console.log('\n2️⃣ Buscando por email cardio@lify.com.br...');
    const { data: emailUsers, error: emailError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'cardio@lify.com.br');

    if (emailError) {
      console.error('❌ Erro ao buscar por email:', emailError);
    } else {
      console.log(`✅ Usuários com email cardio@lify.com.br: ${emailUsers?.length || 0}`);
      if (emailUsers && emailUsers.length > 0) {
        emailUsers.forEach(user => {
          console.log(`   - ${user.email} (${user.user_id})`);
        });
      }
    }

    // 3. Buscar pelo user_id específico
    console.log('\n3️⃣ Buscando por user_id 7e4e0041-f547-445d-a81c-4605d12c1e27...');
    const { data: specificUsers, error: specificError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', '7e4e0041-f547-445d-a81c-4605d12c1e27');

    if (specificError) {
      console.error('❌ Erro ao buscar por user_id:', specificError);
    } else {
      console.log(`✅ Usuários com user_id específico: ${specificUsers?.length || 0}`);
      if (specificUsers && specificUsers.length > 0) {
        specificUsers.forEach(user => {
          console.log(`   - ${user.email} (${user.user_id})`);
        });
      }
    }

    // 4. Testar com .single()
    console.log('\n4️⃣ Testando com .single()...');
    try {
      const { data: singleUser, error: singleError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', '7e4e0041-f547-445d-a81c-4605d12c1e27')
        .single();

      if (singleError) {
        console.error('❌ Erro com .single():', singleError);
      } else {
        console.log('✅ .single() funcionou:', singleUser);
      }
    } catch (error) {
      console.error('❌ Erro geral com .single():', error);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
testUserQuery(); 