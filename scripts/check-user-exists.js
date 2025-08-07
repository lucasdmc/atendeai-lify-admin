import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserExists() {
  console.log('🔍 Verificando usuários existentes...\n');

  try {
    // 1. Buscar todos os usuários na tabela user_profiles
    console.log('1️⃣ Buscando todos os usuários...');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    console.log(`✅ Total de usuários: ${users?.length || 0}`);
    
    if (users && users.length > 0) {
      console.log('\n📋 Lista de usuários:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.user_id})`);
        console.log(`   - Nome: ${user.name}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Clinic ID: ${user.clinic_id}`);
        console.log(`   - Status: ${user.status}`);
        console.log('');
      });
    }

    // 2. Buscar especificamente o usuário cardio@lify.com.br
    console.log('2️⃣ Buscando usuário cardio@lify.com.br...');
    const { data: cardioUser, error: cardioError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'cardio@lify.com.br');

    if (cardioError) {
      console.error('❌ Erro ao buscar usuário cardio:', cardioError);
    } else {
      console.log(`✅ Usuários com email cardio@lify.com.br: ${cardioUser?.length || 0}`);
      if (cardioUser && cardioUser.length > 0) {
        cardioUser.forEach(user => {
          console.log(`   - ${user.email} (${user.user_id})`);
        });
      }
    }

    // 3. Buscar pelo ID específico
    console.log('\n3️⃣ Buscando pelo ID b9deffd7-febe-463d-922d-d77033660783...');
    const { data: specificUser, error: specificError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', 'b9deffd7-febe-463d-922d-d77033660783');

    if (specificError) {
      console.error('❌ Erro ao buscar usuário específico:', specificError);
    } else {
      console.log(`✅ Usuários com ID específico: ${specificUser?.length || 0}`);
      if (specificUser && specificUser.length > 0) {
        specificUser.forEach(user => {
          console.log(`   - ${user.email} (${user.user_id})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
checkUserExists(); 