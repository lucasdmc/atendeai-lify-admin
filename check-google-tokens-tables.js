import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niakqdolcdwxtrkbqmdi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw";

async function checkGoogleTokensTables() {
  console.log('🔍 Verificando tabelas de tokens Google...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // 1. Verificar tabela google_calendar_tokens
    console.log('\n1️⃣ Verificando tabela google_calendar_tokens...');
    const { data: calendarTokens, error: calendarError } = await supabase
      .from('google_calendar_tokens')
      .select('*');
    
    if (calendarError) {
      console.error('❌ Erro ao buscar google_calendar_tokens:', calendarError);
    } else {
      console.log(`📊 google_calendar_tokens: ${calendarTokens?.length || 0} registros`);
      
      if (calendarTokens && calendarTokens.length > 0) {
        const userCounts = {};
        calendarTokens.forEach(token => {
          userCounts[token.user_id] = (userCounts[token.user_id] || 0) + 1;
        });
        
        console.log('   📋 Distribuição por usuário:');
        Object.entries(userCounts).forEach(([userId, count]) => {
          console.log(`      Usuário ${userId}: ${count} registro(s)`);
        });
      }
    }
    
    // 2. Verificar tabela google_tokens
    console.log('\n2️⃣ Verificando tabela google_tokens...');
    const { data: tokens, error: tokensError } = await supabase
      .from('google_tokens')
      .select('*');
    
    if (tokensError) {
      console.error('❌ Erro ao buscar google_tokens:', tokensError);
    } else {
      console.log(`📊 google_tokens: ${tokens?.length || 0} registros`);
      
      if (tokens && tokens.length > 0) {
        const userCounts = {};
        tokens.forEach(token => {
          userCounts[token.user_id] = (userCounts[token.user_id] || 0) + 1;
        });
        
        console.log('   📋 Distribuição por usuário:');
        Object.entries(userCounts).forEach(([userId, count]) => {
          console.log(`      Usuário ${userId}: ${count} registro(s)`);
        });
      }
    }
    
    // 3. Verificar estrutura das tabelas
    console.log('\n3️⃣ Verificando estrutura das tabelas...');
    
    // Tentar inserir um registro de teste em cada tabela
    const testData = {
      user_id: 'test-user-id',
      access_token: 'test_access_token',
      expires_at: new Date().toISOString(),
      scope: 'test_scope'
    };
    
    // Testar google_calendar_tokens
    try {
      const { error: insertCalendarError } = await supabase
        .from('google_calendar_tokens')
        .insert(testData);
      
      if (insertCalendarError) {
        console.log('   📋 google_calendar_tokens: Erro ao inserir -', insertCalendarError.message);
      } else {
        console.log('   ✅ google_calendar_tokens: Estrutura válida');
        // Limpar registro de teste
        await supabase
          .from('google_calendar_tokens')
          .delete()
          .eq('user_id', 'test-user-id');
      }
    } catch (error) {
      console.log('   ❌ google_calendar_tokens: Erro na estrutura');
    }
    
    // Testar google_tokens
    try {
      const { error: insertTokensError } = await supabase
        .from('google_tokens')
        .insert(testData);
      
      if (insertTokensError) {
        console.log('   📋 google_tokens: Erro ao inserir -', insertTokensError.message);
      } else {
        console.log('   ✅ google_tokens: Estrutura válida');
        // Limpar registro de teste
        await supabase
          .from('google_tokens')
          .delete()
          .eq('user_id', 'test-user-id');
      }
    } catch (error) {
      console.log('   ❌ google_tokens: Erro na estrutura');
    }
    
    // 4. Verificar qual tabela está sendo usada no código
    console.log('\n4️⃣ Verificando qual tabela está sendo usada no código...');
    
    const codeAnalysis = {
      'google_calendar_tokens': [
        'src/services/google/tokens.ts - saveTokens()',
        'src/services/google/tokens.ts - getStoredTokens()',
        'src/components/agendamentos/GoogleCalendarSelector.tsx'
      ],
      'google_tokens': [
        'Migrations antigas',
        'Scripts de correção'
      ]
    };
    
    console.log('   📋 Tabelas referenciadas no código:');
    Object.entries(codeAnalysis).forEach(([table, references]) => {
      console.log(`      ${table}:`);
      references.forEach(ref => console.log(`         - ${ref}`));
    });
    
    console.log('\n✅ Análise concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
  }
}

// Executar o script
checkGoogleTokensTables(); 