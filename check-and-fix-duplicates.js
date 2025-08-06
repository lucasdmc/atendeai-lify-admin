import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niakqdolcdwxtrkbqmdi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw";

async function checkAndFixDuplicates() {
  console.log('🔍 Verificando registros duplicados na tabela google_calendar_tokens...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // 1. Verificar todos os registros
    console.log('\n1️⃣ Buscando todos os registros...');
    const { data: allTokens, error: allError } = await supabase
      .from('google_calendar_tokens')
      .select('*');
    
    if (allError) {
      console.error('❌ Erro ao buscar registros:', allError);
      return;
    }
    
    console.log(`📊 Total de registros encontrados: ${allTokens?.length || 0}`);
    
    if (!allTokens || allTokens.length === 0) {
      console.log('✅ Nenhum registro encontrado');
      return;
    }
    
    // 2. Agrupar por user_id e contar
    const userCounts = {};
    allTokens.forEach(token => {
      userCounts[token.user_id] = (userCounts[token.user_id] || 0) + 1;
    });
    
    console.log('\n2️⃣ Análise por usuário:');
    Object.entries(userCounts).forEach(([userId, count]) => {
      console.log(`   Usuário ${userId}: ${count} registro(s)`);
    });
    
    // 3. Identificar usuários com múltiplos registros
    const usersWithDuplicates = Object.entries(userCounts)
      .filter(([userId, count]) => count > 1)
      .map(([userId, count]) => ({ userId, count }));
    
    if (usersWithDuplicates.length === 0) {
      console.log('\n✅ Nenhum usuário com registros duplicados encontrado');
      return;
    }
    
    console.log(`\n⚠️ Encontrados ${usersWithDuplicates.length} usuário(s) com registros duplicados:`);
    usersWithDuplicates.forEach(({ userId, count }) => {
      console.log(`   Usuário ${userId}: ${count} registros`);
    });
    
    // 4. Corrigir registros duplicados
    console.log('\n3️⃣ Corrigindo registros duplicados...');
    
    for (const { userId, count } of usersWithDuplicates) {
      console.log(`\n🔧 Corrigindo usuário ${userId} (${count} registros)...`);
      
      // Buscar todos os registros do usuário
      const { data: userTokens, error: userError } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (userError) {
        console.error(`❌ Erro ao buscar tokens do usuário ${userId}:`, userError);
        continue;
      }
      
      if (!userTokens || userTokens.length <= 1) {
        console.log(`ℹ️ Usuário ${userId} não tem duplicatas`);
        continue;
      }
      
      // Manter apenas o registro mais recente
      const tokenToKeep = userTokens[0];
      const tokensToDelete = userTokens.slice(1);
      
      console.log(`   📅 Mantendo registro mais recente: ${tokenToKeep.id}`);
      console.log(`   🗑️ Removendo ${tokensToDelete.length} registro(s) duplicado(s)...`);
      
      // Deletar registros duplicados
      for (const token of tokensToDelete) {
        const { error: deleteError } = await supabase
          .from('google_calendar_tokens')
          .delete()
          .eq('id', token.id);
        
        if (deleteError) {
          console.error(`   ❌ Erro ao deletar token ${token.id}:`, deleteError);
        } else {
          console.log(`   ✅ Token ${token.id} removido`);
        }
      }
      
      console.log(`   ✅ Usuário ${userId} corrigido`);
    }
    
    // 5. Verificar resultado final
    console.log('\n4️⃣ Verificando resultado final...');
    const { data: finalTokens, error: finalError } = await supabase
      .from('google_calendar_tokens')
      .select('*');
    
    if (finalError) {
      console.error('❌ Erro ao verificar resultado:', finalError);
      return;
    }
    
    const finalUserCounts = {};
    finalTokens.forEach(token => {
      finalUserCounts[token.user_id] = (finalUserCounts[token.user_id] || 0) + 1;
    });
    
    console.log('\n📊 Resultado final:');
    Object.entries(finalUserCounts).forEach(([userId, count]) => {
      console.log(`   Usuário ${userId}: ${count} registro(s)`);
    });
    
    // 6. Verificar se há constraint único
    console.log('\n5️⃣ Verificando constraint único...');
    
    try {
      // Tentar inserir um registro duplicado para testar
      const testUserId = Object.keys(finalUserCounts)[0];
      if (testUserId) {
        const { error: testError } = await supabase
          .from('google_calendar_tokens')
          .insert({
            user_id: testUserId,
            access_token: 'test_token',
            expires_at: new Date().toISOString(),
            scope: 'test'
          });
        
        if (testError && testError.message.includes('duplicate key')) {
          console.log('✅ Constraint único está funcionando');
          
          // Limpar registro de teste
          await supabase
            .from('google_calendar_tokens')
            .delete()
            .eq('access_token', 'test_token');
        } else {
          console.log('⚠️ Constraint único não está funcionando');
          console.log('💡 Execute este SQL no Supabase:');
          console.log('   ALTER TABLE google_calendar_tokens ADD CONSTRAINT google_calendar_tokens_user_id_unique UNIQUE (user_id);');
        }
      }
    } catch (error) {
      console.log('ℹ️ Não foi possível testar constraint único');
    }
    
    console.log('\n✅ Correção concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

// Executar o script
checkAndFixDuplicates(); 