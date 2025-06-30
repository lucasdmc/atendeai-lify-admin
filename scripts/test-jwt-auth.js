import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testJWTAuth() {
  console.log('🔍 Testando autenticação JWT...\n');

  // Configurar Supabase Client
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variáveis de ambiente não encontradas:');
    console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 1. Verificar se o usuário está autenticado
    console.log('1️⃣ Verificando autenticação atual...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erro ao verificar autenticação:', authError.message);
      console.log('\n💡 Solução: Faça login primeiro no frontend');
      return;
    }

    if (!user) {
      console.log('⚠️  Usuário não autenticado');
      console.log('💡 Faça login no frontend primeiro');
      return;
    }

    console.log('✅ Usuário autenticado:', user.email);
    console.log('   ID:', user.id);

    // 2. Verificar se o JWT está disponível
    console.log('\n2️⃣ Verificando JWT...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError.message);
      return;
    }

    if (!session) {
      console.log('⚠️  Nenhuma sessão ativa');
      return;
    }

    console.log('✅ Sessão ativa encontrada');
    console.log('   Token expira em:', new Date(session.expires_at * 1000).toLocaleString());

    // 3. Testar chamada para Edge Function
    console.log('\n3️⃣ Testando chamada para Edge Function...');
    
    const functionUrl = `${supabaseUrl}/functions/v1/google-user-auth`;
    
    console.log('   URL:', functionUrl);
    
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Resposta da Edge Function:', data);
    } else {
      const errorText = await response.text();
      console.error('❌ Erro na Edge Function:');
      console.error('   Status:', response.status);
      console.error('   Resposta:', errorText);
      
      if (response.status === 400) {
        console.log('\n🔍 Diagnóstico:');
        console.log('   - Status 400 indica problema com os parâmetros da requisição');
        console.log('   - Verifique se a Edge Function está esperando os parâmetros corretos');
        console.log('   - O JWT está sendo enviado, mas pode haver problema na validação');
      } else if (response.status === 401) {
        console.log('\n🔍 Diagnóstico:');
        console.log('   - Status 401 indica problema de autenticação');
        console.log('   - O JWT pode estar inválido ou expirado');
        console.log('   - Verifique se o token está sendo enviado corretamente');
      }
    }

    // 4. Verificar headers da requisição
    console.log('\n4️⃣ Verificando headers da requisição...');
    console.log('   Authorization:', session.access_token ? `Bearer ${session.access_token.substring(0, 20)}...` : 'Não encontrado');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar o teste
testJWTAuth().catch(console.error); 