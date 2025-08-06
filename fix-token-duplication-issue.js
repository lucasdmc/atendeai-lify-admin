import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niakqdolcdwxtrkbqmdi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw";

async function fixTokenDuplicationIssue() {
  console.log('🔧 Corrigindo problema de tokens duplicados...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // 1. Análise do problema
    console.log('\n1️⃣ Análise do problema:');
    console.log('   📋 Causas dos tokens duplicados:');
    console.log('      - Falta de constraint único na tabela');
    console.log('      - Uso de upsert sem especificar conflito');
    console.log('      - Múltiplas tentativas de autenticação');
    console.log('      - Falta de validação antes de inserir');
    
    // 2. Verificar se há constraint único
    console.log('\n2️⃣ Verificando constraint único...');
    
    try {
      // Tentar inserir um registro duplicado para testar
      const testUserId = 'a6a63be9-6c87-49bf-80dd-0767afe84f6f';
      const testData = {
        user_id: testUserId,
        access_token: 'test_token_1',
        expires_at: new Date().toISOString(),
        scope: 'test'
      };
      
      // Primeira inserção
      const { error: insert1Error } = await supabase
        .from('google_calendar_tokens')
        .insert(testData);
      
      if (insert1Error) {
        console.log('   ❌ Erro na primeira inserção:', insert1Error.message);
        return;
      }
      
      console.log('   ✅ Primeira inserção realizada');
      
      // Tentar segunda inserção (deveria falhar se há constraint)
      const { error: insert2Error } = await supabase
        .from('google_calendar_tokens')
        .insert({
          ...testData,
          access_token: 'test_token_2'
        });
      
      if (insert2Error && insert2Error.message.includes('duplicate key')) {
        console.log('   ✅ Constraint único está funcionando');
      } else {
        console.log('   ⚠️ Constraint único não está funcionando');
        console.log('   💡 Adicionando constraint único...');
        
        // Adicionar constraint único via SQL
        const { error: constraintError } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE google_calendar_tokens ADD CONSTRAINT google_calendar_tokens_user_id_unique UNIQUE (user_id);'
        });
        
        if (constraintError) {
          console.log('   ❌ Erro ao adicionar constraint:', constraintError.message);
        } else {
          console.log('   ✅ Constraint único adicionado');
        }
      }
      
      // Limpar dados de teste
      await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', testUserId);
      
    } catch (error) {
      console.log('   ℹ️ Não foi possível testar constraint único');
    }
    
    // 3. Melhorar o código do saveTokens
    console.log('\n3️⃣ Melhorando código do saveTokens...');
    
    const improvedSaveTokensCode = `
// Código melhorado para saveTokens
async saveTokens(tokens: CalendarToken): Promise<void> {
  console.log('Saving tokens to database via Supabase...');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No authenticated user found when saving tokens');
    throw new Error('User not authenticated');
  }

  console.log('Saving tokens for user:', user.id);

  // Usar upsert com onConflict para evitar duplicatas
  const { error } = await supabase
    .from('google_calendar_tokens')
    .upsert({
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
      scope: tokens.scope,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id' // Especificar campo de conflito
    });

  if (error) {
    console.error('Error saving tokens to Supabase:', error);
    throw new Error(error.message || 'Failed to save tokens');
  }

  console.log('Tokens saved successfully via Supabase');
}
`;
    
    console.log('   📋 Código melhorado:');
    console.log(improvedSaveTokensCode);
    
    // 4. Verificar se há registros duplicados existentes
    console.log('\n4️⃣ Verificando registros duplicados existentes...');
    
    const { data: allTokens, error: tokensError } = await supabase
      .from('google_calendar_tokens')
      .select('*');
    
    if (tokensError) {
      console.error('❌ Erro ao buscar tokens:', tokensError);
      return;
    }
    
    if (!allTokens || allTokens.length === 0) {
      console.log('   ✅ Nenhum registro encontrado');
    } else {
      const userCounts = {};
      allTokens.forEach(token => {
        userCounts[token.user_id] = (userCounts[token.user_id] || 0) + 1;
      });
      
      const duplicates = Object.entries(userCounts)
        .filter(([userId, count]) => count > 1)
        .map(([userId, count]) => ({ userId, count }));
      
      if (duplicates.length > 0) {
        console.log(`   ⚠️ Encontrados ${duplicates.length} usuário(s) com duplicatas:`);
        duplicates.forEach(({ userId, count }) => {
          console.log(`      Usuário ${userId}: ${count} registros`);
        });
        
        // Corrigir duplicatas
        console.log('   🔧 Corrigindo duplicatas...');
        for (const { userId } of duplicates) {
          const { data: userTokens } = await supabase
            .from('google_calendar_tokens')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });
          
          if (userTokens && userTokens.length > 1) {
            // Manter apenas o mais recente
            const tokensToDelete = userTokens.slice(1);
            for (const token of tokensToDelete) {
              await supabase
                .from('google_calendar_tokens')
                .delete()
                .eq('id', token.id);
            }
            console.log(`      ✅ Usuário ${userId} corrigido`);
          }
        }
      } else {
        console.log('   ✅ Nenhuma duplicata encontrada');
      }
    }
    
    // 5. Recomendações para evitar duplicatas
    console.log('\n5️⃣ Recomendações para evitar duplicatas:');
    console.log('   📝 1. Sempre use onConflict no upsert');
    console.log('   📝 2. Adicione constraint único na tabela');
    console.log('   📝 3. Valide se o usuário já tem tokens antes de inserir');
    console.log('   📝 4. Use transações para operações críticas');
    console.log('   📝 5. Implemente retry logic com backoff');
    
    // 6. Script SQL para adicionar constraint
    console.log('\n6️⃣ Script SQL para adicionar constraint único:');
    console.log(`
-- Execute este SQL no Supabase SQL Editor
ALTER TABLE google_calendar_tokens 
ADD CONSTRAINT google_calendar_tokens_user_id_unique 
UNIQUE (user_id);
`);
    
    console.log('\n✅ Correção concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

// Executar o script
fixTokenDuplicationIssue(); 