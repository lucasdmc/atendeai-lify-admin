const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function addGoogleTokensConstraint() {
  console.log('🔧 Adicionando constraint única na tabela google_tokens...');
  
  try {
    // Primeiro, verificar se já há duplicatas
    console.log('📋 Verificando duplicatas...');
    
    const { data: duplicates, error: dupError } = await supabase
      .from('google_tokens')
      .select('user_id, count(*)')
      .group('user_id')
      .having('count(*) > 1');
    
    if (dupError) {
      console.log('ℹ️  Não foi possível verificar duplicatas (normal):', dupError.message);
    } else if (duplicates && duplicates.length > 0) {
      console.log(`⚠️  Encontradas ${duplicates.length} duplicatas. Limpando...`);
      
      // Para cada duplicata, manter apenas a mais recente
      for (const dup of duplicates) {
        const { data: records, error: selectError } = await supabase
          .from('google_tokens')
          .select('id, created_at')
          .eq('user_id', dup.user_id)
          .order('created_at', { ascending: false });
        
        if (!selectError && records && records.length > 1) {
          // Manter o primeiro (mais recente) e deletar os outros
          const toDelete = records.slice(1);
          for (const record of toDelete) {
            await supabase
              .from('google_tokens')
              .delete()
              .eq('id', record.id);
          }
          console.log(`✅ Limpeza concluída para user_id: ${dup.user_id}`);
        }
      }
    } else {
      console.log('✅ Nenhuma duplicata encontrada');
    }
    
    // Agora tentar fazer um upsert de teste para ver se a constraint existe
    console.log('🧪 Testando constraint atual...');
    
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { data: upsertData, error: upsertError } = await supabase
      .from('google_tokens')
      .upsert({
        user_id: testUserId,
        access_token: 'test_token',
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hora no futuro
        scope: 'test'
      }, {
        onConflict: 'user_id'
      });
    
    if (upsertError) {
      if (upsertError.message.includes('constraint matching the ON CONFLICT')) {
        console.log('❌ Constraint única não existe ainda');
        console.log('💡 Você precisa executar este SQL no Supabase Dashboard:');
        console.log('');
        console.log('ALTER TABLE public.google_tokens ADD CONSTRAINT google_tokens_user_id_unique UNIQUE (user_id);');
        console.log('');
        console.log('📋 Ou copie e cole o conteúdo do arquivo:');
        console.log('   scripts/add-google-tokens-unique-constraint.sql');
        console.log('');
        return false;
      } else {
        console.error('❌ Erro no teste de upsert:', upsertError);
        return false;
      }
    } else {
      console.log('✅ Constraint única já existe e está funcionando!');
      
      // Limpar dados de teste
      await supabase
        .from('google_tokens')
        .delete()
        .eq('user_id', testUserId);
      
      console.log('🎉 A tabela google_tokens está pronta para usar upsert!');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

addGoogleTokensConstraint().then(success => {
  if (success) {
    console.log('');
    console.log('🚀 Próximos passos:');
    console.log('1. Reinicie o backend: pkill -f "node server.js" && node server.js');
    console.log('2. Teste a conexão do Google Calendar no frontend');
  } else {
    console.log('');
    console.log('⚠️  Execute o SQL no Supabase Dashboard primeiro, depois rode este script novamente');
  }
}); 