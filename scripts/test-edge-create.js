import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCreateUser() {
  const testUserData = {
    name: 'Usuário Teste Debug',
    email: `debug.teste.${Date.now()}@exemplo.com`,
    password: '123456',
    role: 'atendente',
    clinicId: '00000000-0000-0000-0000-000000000001' // coloque o ID de uma clínica válida aqui!
  };

  const { data, error } = await supabase.functions.invoke('create-user-auth', {
    body: testUserData
  });

  console.log('RESULTADO:', { data, error });
}

testCreateUser(); 