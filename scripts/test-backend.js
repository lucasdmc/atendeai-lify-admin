import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';
const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3001';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBackend() {
  console.log('🧪 Testando backend...\n');

  try {
    // 1. Testar saúde do backend
    console.log('1️⃣ Testando saúde do backend...');
    const healthResponse = await fetch(`${backendUrl}/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend está funcionando:', healthData);
    } else {
      console.error('❌ Backend não está respondendo');
      return;
    }

    // 2. Fazer login para obter token
    console.log('\n2️⃣ Fazendo login para obter token...');
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'lucasdmc@lify.com',
      password: 'lify@1234'
    });

    if (loginError || !session) {
      console.error('❌ Erro ao fazer login:', loginError);
      return;
    }

    console.log('✅ Login realizado com sucesso');
    const token = session.access_token;

    // 3. Testar listagem de clínicas
    console.log('\n3️⃣ Testando listagem de clínicas...');
    const clinicsResponse = await fetch(`${backendUrl}/api/clinics`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (clinicsResponse.ok) {
      const clinicsData = await clinicsResponse.json();
      console.log('✅ Clínicas listadas com sucesso:', clinicsData.clinics?.length || 0, 'clínicas');
    } else {
      const errorData = await clinicsResponse.json();
      console.error('❌ Erro ao listar clínicas:', errorData);
    }

    // 4. Testar listagem de usuários
    console.log('\n4️⃣ Testando listagem de usuários...');
    const usersResponse = await fetch(`${backendUrl}/api/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Usuários listados com sucesso:', usersData.users?.length || 0, 'usuários');
    } else {
      const errorData = await usersResponse.json();
      console.error('❌ Erro ao listar usuários:', errorData);
    }

    // 5. Testar criação de usuário
    console.log('\n5️⃣ Testando criação de usuário...');
    const testUserData = {
      name: 'Usuário Teste Backend',
      email: `teste.backend.${Date.now()}@exemplo.com`,
      password: '123456',
      role: 'atendente',
      clinicId: '00000000-0000-0000-0000-000000000001' // ID de uma clínica válida
    };

    const createResponse = await fetch(`${backendUrl}/api/users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testUserData)
    });

    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ Usuário criado com sucesso:', createData.user);
      
      // Limpar usuário de teste
      console.log('🧹 Limpando usuário de teste...');
      await supabase.auth.admin.deleteUser(createData.user.id);
      console.log('✅ Usuário de teste removido');
    } else {
      const errorData = await createResponse.json();
      console.error('❌ Erro ao criar usuário:', errorData);
    }

    console.log('\n🎉 Teste do backend concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testBackend(); 