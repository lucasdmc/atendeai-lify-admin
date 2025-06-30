const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sua-chave-anon-aqui';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGoogleAuthFunction() {
  try {
    console.log('🔍 Testando função google-user-auth...');
    
    // Primeiro, vamos verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Usuário não autenticado:', authError?.message);
      console.log('💡 Faça login primeiro no frontend e depois execute este teste');
      return;
    }
    
    console.log('✅ Usuário autenticado:', user.email);
    
    // Teste 1: Verificar se a função responde
    console.log('\n🔄 Teste 1: Verificando se a função responde...');
    
    const testResponse = await fetch(`${supabaseUrl}/functions/v1/google-user-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({
        action: 'complete-auth',
        code: 'test-code',
        redirect_uri: 'https://preview--atendeai-lify-admin.lovable.app/agendamentos',
        client_id: 'test-client-id'
      })
    });
    
    console.log('Status da resposta:', testResponse.status);
    console.log('Headers da resposta:', Object.fromEntries(testResponse.headers.entries()));
    
    const responseText = await testResponse.text();
    console.log('Corpo da resposta:', responseText);
    
    if (testResponse.ok) {
      console.log('✅ Função está respondendo corretamente');
    } else {
      console.log('❌ Função retornou erro:', testResponse.status);
      console.log('Detalhes:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar o teste
testGoogleAuthFunction(); 