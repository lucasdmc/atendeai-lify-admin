import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Simular o cliente do frontend (com anon key)
const supabaseFrontend = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8');

// Simular o cliente do backend (com service key)
const supabaseBackend = createClient(supabaseUrl, supabaseServiceKey);

async function debugFrontendPayload() {
  console.log('🔍 Debugando payload do frontend...\n');

  // 1. Testar com dados exatos do frontend
  const frontendUserData = {
    name: 'Usuário Frontend Teste',
    email: `frontend.teste.${Date.now()}@exemplo.com`,
    password: '123456',
    role: 'atendente',
    clinicId: '00000000-0000-0000-0000-000000000001'
  };

  console.log('📝 Dados sendo enviados:', frontendUserData);

  // 2. Testar com cliente frontend (como no navegador)
  console.log('\n2️⃣ Testando com cliente frontend (como no navegador)...');
  try {
    const { data: frontendResult, error: frontendError } = await supabaseFrontend.functions.invoke('create-user-auth', {
      body: frontendUserData
    });

    console.log('✅ Resultado frontend:', { data: frontendResult, error: frontendError });
  } catch (error) {
    console.error('❌ Erro frontend:', error);
  }

  // 3. Testar com cliente backend (como no script anterior)
  console.log('\n3️⃣ Testando com cliente backend...');
  try {
    const { data: backendResult, error: backendError } = await supabaseBackend.functions.invoke('create-user-auth', {
      body: frontendUserData
    });

    console.log('✅ Resultado backend:', { data: backendResult, error: backendError });
  } catch (error) {
    console.error('❌ Erro backend:', error);
  }

  // 4. Testar sem clinicId (usuário mestre)
  console.log('\n4️⃣ Testando usuário mestre (sem clinicId)...');
  const masterUserData = {
    name: 'Usuário Mestre Frontend',
    email: `mestre.frontend.${Date.now()}@exemplo.com`,
    password: '123456',
    role: 'admin_lify'
    // Sem clinicId
  };

  try {
    const { data: masterResult, error: masterError } = await supabaseFrontend.functions.invoke('create-user-auth', {
      body: masterUserData
    });

    console.log('✅ Resultado mestre:', { data: masterResult, error: masterError });
  } catch (error) {
    console.error('❌ Erro mestre:', error);
  }

  // 5. Testar com clinicId undefined
  console.log('\n5️⃣ Testando com clinicId undefined...');
  const undefinedClinicData = {
    name: 'Usuário Undefined Clinic',
    email: `undefined.clinic.${Date.now()}@exemplo.com`,
    password: '123456',
    role: 'atendente',
    clinicId: undefined
  };

  try {
    const { data: undefinedResult, error: undefinedError } = await supabaseFrontend.functions.invoke('create-user-auth', {
      body: undefinedClinicData
    });

    console.log('✅ Resultado undefined:', { data: undefinedResult, error: undefinedError });
  } catch (error) {
    console.error('❌ Erro undefined:', error);
  }
}

debugFrontendPayload(); 