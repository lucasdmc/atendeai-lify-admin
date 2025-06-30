import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectInvoke() {
  try {
    console.log('🔍 Testando chamada direta para google-user-auth...');
    
    // Primeiro, vamos verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Usuário não autenticado:', authError?.message);
      console.log('💡 Faça login primeiro no frontend e depois execute este teste');
      return;
    }
    
    console.log('✅ Usuário autenticado:', user.email);
    
    // Teste: Verificar se as variáveis de ambiente estão configuradas
    console.log('\n🔄 Testando action check-env...');
    
    const envResponse = await supabase.functions.invoke('google-user-auth', {
      body: {
        action: 'check-env'
      }
    });
    
    console.log('Resposta check-env:', envResponse);
    
    if (envResponse.error) {
      console.error('❌ Erro no check-env:', envResponse.error);
    } else {
      console.log('✅ check-env funcionou:', envResponse.data);
    }
    
    // Teste: Verificar se o payload está sendo enviado corretamente
    console.log('\n🔄 Testando action complete-auth com payload...');
    
    const authResponse = await supabase.functions.invoke('google-user-auth', {
      body: {
        action: 'complete-auth',
        code: 'test-code-123',
        redirect_uri: 'https://atendeai.lify.com.br/agendamentos'
      }
    });
    
    console.log('Resposta complete-auth:', authResponse);
    
    if (authResponse.error) {
      console.error('❌ Erro no complete-auth:', authResponse.error);
    } else {
      console.log('✅ complete-auth funcionou:', authResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar o teste
testDirectInvoke(); 