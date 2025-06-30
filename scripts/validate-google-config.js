import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente
dotenv.config();

async function validateGoogleConfig() {
  console.log('🔍 Validando configurações do Google OAuth2...\n');

  // 1. Verificar variáveis de ambiente locais
  console.log('1️⃣ Verificando variáveis de ambiente locais:');
  
  const localVars = {
    'VITE_GOOGLE_CLIENT_ID': process.env.VITE_GOOGLE_CLIENT_ID,
    'VITE_GOOGLE_CLIENT_SECRET': process.env.VITE_GOOGLE_CLIENT_SECRET,
    'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY,
  };

  let hasLocalConfig = true;
  for (const [key, value] of Object.entries(localVars)) {
    if (value) {
      if (key.includes('SECRET')) {
        console.log(`   ✅ ${key}: ${value.substring(0, 10)}...`);
      } else {
        console.log(`   ✅ ${key}: ${value}`);
      }
    } else {
      console.log(`   ❌ ${key}: NÃO CONFIGURADO`);
      hasLocalConfig = false;
    }
  }

  if (!hasLocalConfig) {
    console.log('\n⚠️  Variáveis de ambiente locais não encontradas.');
    console.log('   Isso é normal se você estiver usando apenas as variáveis do Supabase.');
  }

  // 2. Verificar configuração do Supabase
  console.log('\n2️⃣ Verificando configuração do Supabase:');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('   ❌ Não é possível conectar ao Supabase sem URL e chave anônima.');
    console.log('   Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Verificar se conseguimos conectar ao Supabase
    const { data, error } = await supabase.from('user_calendars').select('count').limit(1);
    
    if (error) {
      console.log('   ❌ Erro ao conectar ao Supabase:', error.message);
      return;
    }

    console.log('   ✅ Conectado ao Supabase com sucesso');
    console.log('   📋 Project ID:', supabaseUrl.split('//')[1].split('.')[0]);

    // 3. Verificar se as Edge Functions estão acessíveis
    console.log('\n3️⃣ Verificando Edge Functions:');
    
    try {
      const functionUrl = `${supabaseUrl}/functions/v1/google-user-auth`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          action: 'initiate-auth',
          state: 'test',
          userId: 'test-user'
        })
      });

      if (response.status === 200) {
        console.log('   ✅ Edge Function google-user-auth está acessível');
      } else {
        console.log(`   ⚠️  Edge Function retornou status: ${response.status}`);
        const errorText = await response.text();
        console.log('   📄 Resposta:', errorText.substring(0, 200) + '...');
      }
    } catch (error) {
      console.log('   ❌ Erro ao acessar Edge Function:', error.message);
    }

  } catch (error) {
    console.log('   ❌ Erro ao conectar ao Supabase:', error.message);
  }

  // 4. Checklist de validação
  console.log('\n4️⃣ Checklist de validação:');
  console.log('   📋 Para resolver o erro 401 invalid_client:');
  console.log('   1. Verifique se VITE_GOOGLE_CLIENT_ID está correto no Supabase Dashboard');
  console.log('   2. Verifique se VITE_GOOGLE_CLIENT_SECRET está correto no Supabase Dashboard');
  console.log('   3. Confirme se a redirect URI está cadastrada no Google Cloud Console:');
  console.log('      - https://atendeai.lify.com.br/agendamentos');
  console.log('      - http://localhost:8080/agendamentos (desenvolvimento)');
  console.log('   4. Redeploye a Edge Function após alterar variáveis de ambiente');
  console.log('   5. Limpe o cache do navegador e teste novamente');

  // 5. Comandos úteis
  console.log('\n5️⃣ Comandos úteis:');
  console.log('   Para verificar logs da Edge Function:');
  console.log('   - Acesse o Supabase Dashboard > Edge Functions > google-user-auth > Logs');
  console.log('   - Ou use: supabase functions logs google-user-auth');
  console.log('');
  console.log('   Para redeployar a função:');
  console.log('   - supabase functions deploy google-user-auth');
  console.log('');
  console.log('   Para verificar variáveis de ambiente:');
  console.log('   - Supabase Dashboard > Settings > Environment Variables');
}

// Executar validação
validateGoogleConfig().catch(console.error); 