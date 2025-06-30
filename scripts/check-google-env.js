import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sua-chave-anon-aqui';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGoogleEnvironment() {
  try {
    console.log('🔍 Verificando variáveis de ambiente do Google...');
    
    // Primeiro, vamos verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Usuário não autenticado:', authError?.message);
      console.log('💡 Faça login primeiro no frontend e depois execute este teste');
      return;
    }
    
    console.log('✅ Usuário autenticado:', user.email);
    
    // Teste: Verificar se as variáveis de ambiente estão configuradas
    console.log('\n🔄 Verificando configuração das variáveis de ambiente...');
    
    const envResponse = await fetch(`${supabaseUrl}/functions/v1/google-user-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({
        action: 'check-env',
        code: 'test-code',
        redirect_uri: 'https://preview--atendeai-lify-admin.lovable.app/agendamentos'
      })
    });
    
    console.log('Status da resposta:', envResponse.status);
    
    const responseText = await envResponse.text();
    console.log('Corpo da resposta:', responseText);
    
    if (envResponse.ok) {
      console.log('✅ Variáveis de ambiente estão configuradas');
    } else {
      console.log('❌ Erro ao verificar variáveis de ambiente:', envResponse.status);
      console.log('Detalhes:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar o teste
checkGoogleEnvironment(); 