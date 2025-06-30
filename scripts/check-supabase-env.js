import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function checkSupabaseEnvironment() {
  console.log('🔍 Verificando variáveis de ambiente no Supabase...\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Variáveis do Supabase não encontradas localmente');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 1. Verificar variáveis locais
    console.log('1️⃣ Variáveis locais (.env):');
    const localClientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const localClientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET;
    
    console.log(`   VITE_GOOGLE_CLIENT_ID: ${localClientId || 'NÃO CONFIGURADO'}`);
    console.log(`   VITE_GOOGLE_CLIENT_SECRET: ${localClientSecret ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);

    // 2. Testar Edge Function para ver se as variáveis estão sendo lidas
    console.log('\n2️⃣ Testando Edge Function para verificar variáveis:');
    
    const functionUrl = `${supabaseUrl}/functions/v1/google-user-auth`;
    
    // Teste 1: Iniciar autenticação (vai mostrar o client_id nos logs)
    console.log('   Testando initiate-auth...');
    const response1 = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        action: 'initiate-auth',
        state: 'test-validation',
        userId: 'test-user'
      })
    });

    if (response1.ok) {
      const data1 = await response1.json();
      console.log('   ✅ initiate-auth funcionou');
      
      // Verificar se a URL gerada contém o client_id correto
      if (data1.authUrl && data1.authUrl.includes(localClientId)) {
        console.log('   ✅ Client ID na Edge Function está correto');
      } else {
        console.log('   ⚠️  Client ID na Edge Function pode estar diferente');
        console.log(`   📋 URL gerada: ${data1.authUrl}`);
      }
    } else {
      console.log(`   ❌ initiate-auth falhou: ${response1.status}`);
      const error1 = await response1.text();
      console.log(`   📄 Erro: ${error1}`);
    }

    // 3. Verificar se a Edge Function está usando as variáveis corretas
    console.log('\n3️⃣ Verificando se as variáveis estão sendo usadas corretamente:');
    
    // Fazer uma requisição que vai gerar logs na Edge Function
    console.log('   Fazendo requisição para gerar logs na Edge Function...');
    console.log('   (Verifique os logs no Supabase Dashboard para ver os valores das variáveis)');
    
    const response2 = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        action: 'handle-callback',
        code: 'invalid-code-for-testing',
        state: 'test-user:test-state'
      })
    });

    console.log(`   Status da requisição: ${response2.status}`);
    
    if (response2.status === 400) {
      console.log('   ✅ Edge Function está respondendo (erro esperado para código inválido)');
    }

    // 4. Comparação e recomendações
    console.log('\n4️⃣ Análise e recomendações:');
    
    if (localClientId && localClientSecret) {
      console.log('   ✅ Variáveis locais estão configuradas');
      console.log('   📋 Para garantir que o Supabase use as mesmas variáveis:');
      console.log('   1. Acesse o Supabase Dashboard');
      console.log('   2. Vá em Settings > Environment Variables');
      console.log('   3. Configure:');
      console.log(`      VITE_GOOGLE_CLIENT_ID = ${localClientId}`);
      console.log(`      VITE_GOOGLE_CLIENT_SECRET = ${localClientSecret.substring(0, 10)}...`);
      console.log('   4. Salve e redeploye a Edge Function');
    } else {
      console.log('   ❌ Variáveis locais não estão configuradas');
      console.log('   📋 Configure o arquivo .env com as variáveis do Google OAuth2');
    }

    // 5. Próximos passos
    console.log('\n5️⃣ Próximos passos para resolver o erro 401:');
    console.log('   1. Verifique se o client_id e client_secret no Supabase são iguais aos do Google Cloud Console');
    console.log('   2. Confirme se a redirect URI está cadastrada no Google Cloud Console');
    console.log('   3. Redeploye a Edge Function após qualquer alteração');
    console.log('   4. Teste o fluxo completo no navegador');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
  }
}

checkSupabaseEnvironment().catch(console.error); 