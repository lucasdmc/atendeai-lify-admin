import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

async function testBackendUsers() {
  console.log('🔍 Testando endpoint de usuários no backend...\n');

  try {
    // 1. Fazer login
    console.log('1️⃣ Fazendo login...');
    const { data: { user }, error: loginError } = await supabaseAuth.auth.signInWithPassword({
      email: 'lucasdmc@lify.com',
      password: 'lify@1234'
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError);
      return;
    }

    console.log('✅ Login realizado:', user.id);
    const token = (await supabaseAuth.auth.getSession()).data.session?.access_token;
    console.log('✅ Token obtido');

    // 2. Testar endpoint de usuários
    console.log('\n2️⃣ Testando endpoint /api/users/list...');
    const response = await fetch('https://atendeai-backend-production.up.railway.app/api/users/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('📊 Status:', response.status);
    console.log('📊 Resposta:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Endpoint funcionando corretamente!');
      console.log(`📊 Usuários encontrados: ${data.users?.length || 0}`);
    } else {
      console.log('\n❌ Erro no endpoint');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testBackendUsers(); 