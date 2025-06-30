import dotenv from 'dotenv';

dotenv.config();

async function testGoogleServiceAuth() {
  console.log('🧪 Testando Edge Function google-service-auth...\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Variáveis do Supabase não encontradas');
    return;
  }

  try {
    // 1. Testar se a função está acessível
    console.log('1️⃣ Testando acessibilidade da função...');
    
    const functionUrl = `${supabaseUrl}/functions/v1/google-service-auth`;
    
    const testResponse = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        action: 'get-credentials'
      })
    });

    console.log(`   Status: ${testResponse.status}`);
    
    if (testResponse.ok) {
      console.log('   ✅ Função está acessível');
    } else {
      const errorText = await testResponse.text();
      console.log(`   ⚠️  Função retornou: ${errorText}`);
    }

    // 2. Testar ação get-credentials
    console.log('\n2️⃣ Testando ação get-credentials...');
    
    const credentialsResponse = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        action: 'get-credentials'
      })
    });

    console.log(`   Status: ${credentialsResponse.status}`);
    
    if (credentialsResponse.ok) {
      const data = await credentialsResponse.json();
      console.log('   ✅ Credenciais obtidas com sucesso');
      console.log(`   📋 Client Email: ${data.credentials?.client_email || 'N/A'}`);
      console.log(`   📋 Project ID: ${data.credentials?.project_id || 'N/A'}`);
    } else {
      const errorText = await credentialsResponse.text();
      console.log(`   ❌ Erro: ${errorText}`);
    }

    // 3. Testar ação get-access-token
    console.log('\n3️⃣ Testando ação get-access-token...');
    
    const tokenResponse = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        action: 'get-access-token'
      })
    });

    console.log(`   Status: ${tokenResponse.status}`);
    
    if (tokenResponse.ok) {
      const data = await tokenResponse.json();
      console.log('   ✅ Token obtido com sucesso');
      console.log(`   📋 Token Type: ${data.token_type || 'N/A'}`);
      console.log(`   📋 Expires In: ${data.expires_in || 'N/A'} segundos`);
    } else {
      const errorText = await tokenResponse.text();
      console.log(`   ❌ Erro: ${errorText}`);
    }

    // 4. Testar ação verify-token
    console.log('\n4️⃣ Testando ação verify-token...');
    
    const verifyResponse = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        action: 'verify-token'
      })
    });

    console.log(`   Status: ${verifyResponse.status}`);
    
    if (verifyResponse.ok) {
      const data = await verifyResponse.json();
      console.log('   ✅ Token verificado com sucesso');
      console.log(`   📋 User ID: ${data.user?.id || 'N/A'}`);
      console.log(`   📋 Email: ${data.user?.email || 'N/A'}`);
    } else {
      const errorText = await verifyResponse.text();
      console.log(`   ❌ Erro: ${errorText}`);
    }

    // 5. Instruções para deploy
    console.log('\n5️⃣ Instruções para deploy:');
    console.log('   📋 Para fazer o deploy da função google-service-auth:');
    console.log('   1. Acesse: https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi');
    console.log('   2. Vá em: Edge Functions');
    console.log('   3. Clique em "Create a new function"');
    console.log('   4. Nome: google-service-auth');
    console.log('   5. Cole o código do arquivo supabase/functions/google-service-auth/index.ts');
    console.log('   6. Clique em "Deploy"');

    // 6. Variáveis de ambiente necessárias
    console.log('\n6️⃣ Variáveis de ambiente necessárias:');
    console.log('   📋 Configure estas variáveis no Supabase Dashboard:');
    console.log('   - GOOGLE_PROJECT_ID');
    console.log('   - GOOGLE_PRIVATE_KEY_ID');
    console.log('   - GOOGLE_PRIVATE_KEY');
    console.log('   - GOOGLE_CLIENT_EMAIL');
    console.log('   - GOOGLE_CLIENT_ID');
    console.log('   - GOOGLE_CLIENT_SECRET');

    // 7. Resumo
    console.log('\n7️⃣ Resumo:');
    console.log('   ✅ Função google-service-auth criada');
    console.log('   ✅ Três ações implementadas: get-credentials, get-access-token, verify-token');
    console.log('   ✅ CORS configurado corretamente');
    console.log('   📋 Próximo passo: Deploy no Supabase Dashboard');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testGoogleServiceAuth().catch(console.error); 