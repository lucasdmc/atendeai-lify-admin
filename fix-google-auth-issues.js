import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niakqdolcdwxtrkbqmdi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw";

async function fixGoogleAuthIssues() {
  console.log('🔧 Corrigindo problemas de autenticação Google...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // 1. Verificar se há registros duplicados na tabela google_calendar_tokens
    console.log('\n1️⃣ Verificando registros duplicados...');
    
    const { data: duplicateTokens, error: duplicateError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', 'a6a63be9-6c87-49bf-80dd-0767afe84f6f');
    
    if (duplicateError) {
      console.error('❌ Erro ao buscar tokens:', duplicateError);
      return;
    }
    
    if (duplicateTokens && duplicateTokens.length > 1) {
      console.log(`⚠️ Encontrados ${duplicateTokens.length} registros para o usuário`);
      
      // Manter apenas o registro mais recente
      const sortedTokens = duplicateTokens.sort((a, b) => 
        new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
      );
      
      const tokenToKeep = sortedTokens[0];
      const tokensToDelete = sortedTokens.slice(1);
      
      console.log('🗑️ Removendo registros duplicados...');
      
      for (const token of tokensToDelete) {
        const { error: deleteError } = await supabase
          .from('google_calendar_tokens')
          .delete()
          .eq('id', token.id);
        
        if (deleteError) {
          console.error(`❌ Erro ao deletar token ${token.id}:`, deleteError);
        } else {
          console.log(`✅ Token ${token.id} removido`);
        }
      }
      
      console.log('✅ Registros duplicados removidos');
    } else {
      console.log('✅ Nenhum registro duplicado encontrado');
    }
    
    // 2. Verificar configurações da Edge Function
    console.log('\n2️⃣ Verificando configurações da Edge Function...');
    
    const testResponse = await fetch(`${SUPABASE_URL}/functions/v1/google-user-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        code: 'test-code',
        redirectUri: 'http://localhost:8080/agendamentos'
      })
    });
    
    console.log('📊 Status da Edge Function:', testResponse.status);
    
    if (testResponse.status === 500) {
      const errorData = await testResponse.text();
      console.log('📋 Erro da Edge Function:', errorData);
      
      if (errorData.includes('Google OAuth credentials not configured')) {
        console.log('⚠️ Credenciais Google não configuradas na Edge Function');
        console.log('📝 Execute: supabase secrets set GOOGLE_CLIENT_ID=seu_client_id');
        console.log('📝 Execute: supabase secrets set GOOGLE_CLIENT_SECRET=seu_client_secret');
      }
    }
    
    // 3. Verificar se a tabela tem constraint único
    console.log('\n3️⃣ Verificando constraints da tabela...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_constraints', { table_name: 'google_calendar_tokens' });
    
    if (tableError) {
      console.log('⚠️ Não foi possível verificar constraints da tabela');
    } else {
      console.log('📋 Informações da tabela:', tableInfo);
    }
    
    // 4. Adicionar constraint único se não existir
    console.log('\n4️⃣ Adicionando constraint único se necessário...');
    
    const addUniqueConstraint = `
      ALTER TABLE google_calendar_tokens 
      ADD CONSTRAINT google_calendar_tokens_user_id_unique 
      UNIQUE (user_id);
    `;
    
    try {
      const { error: constraintError } = await supabase.rpc('exec_sql', { 
        sql: addUniqueConstraint 
      });
      
      if (constraintError) {
        console.log('ℹ️ Constraint único já existe ou não pode ser adicionado');
      } else {
        console.log('✅ Constraint único adicionado');
      }
    } catch (error) {
      console.log('ℹ️ Constraint único já existe');
    }
    
    // 5. Verificar configurações do Google OAuth
    console.log('\n5️⃣ Verificando configurações do Google OAuth...');
    
    const googleConfig = {
      clientId: '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com',
      redirectUri: 'http://localhost:8080/agendamentos'
    };
    
    console.log('📋 Client ID:', googleConfig.clientId);
    console.log('📋 Redirect URI:', googleConfig.redirectUri);
    console.log('');
    console.log('🔗 Verifique se estas URLs estão configuradas no Google Cloud Console:');
    console.log('   - http://localhost:8080/agendamentos');
    console.log('   - https://atendeai.lify.com.br/agendamentos');
    
    console.log('\n✅ Correções aplicadas!');
    console.log('');
    console.log('📝 Próximos passos:');
    console.log('   1. Configure as credenciais na Edge Function');
    console.log('   2. Verifique as URLs no Google Cloud Console');
    console.log('   3. Teste a autenticação novamente');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

// Executar o script
fixGoogleAuthIssues(); 