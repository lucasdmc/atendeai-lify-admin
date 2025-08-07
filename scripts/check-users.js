import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('👥 Verificando usuários no sistema...\n');

  try {
    // 1. Buscar todos os usuários na tabela user_profiles
    console.log('1️⃣ Buscando usuários na tabela user_profiles...');
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Erro ao buscar user_profiles:', profilesError);
      return;
    }

    console.log(`✅ Usuários encontrados: ${userProfiles?.length || 0}`);
    userProfiles?.forEach(profile => {
      console.log(`   - ${profile.email} (${profile.name}) - Role: ${profile.role} - Clinic: ${profile.clinic_id || 'Sem clínica'}`);
    });

    // 2. Buscar clínicas
    console.log('\n2️⃣ Buscando clínicas...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*')
      .order('name');

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log(`✅ Clínicas encontradas: ${clinics?.length || 0}`);
    clinics?.forEach(clinic => {
      console.log(`   - ${clinic.name} (${clinic.id}) - WhatsApp: ${clinic.whatsapp_phone || 'Sem número'}`);
    });

    // 3. Buscar associações clinic_users
    console.log('\n3️⃣ Buscando associações clinic_users...');
    const { data: clinicUsers, error: clinicUsersError } = await supabase
      .from('clinic_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (clinicUsersError) {
      console.error('❌ Erro ao buscar clinic_users:', clinicUsersError);
      return;
    }

    console.log(`✅ Associações encontradas: ${clinicUsers?.length || 0}`);
    clinicUsers?.forEach(association => {
      console.log(`   - User: ${association.user_id} - Clinic: ${association.clinic_id} - Role: ${association.role}`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
checkUsers(); 