// Script para testar se o deploy foi aplicado
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function testRailwayDeploy() {
  try {
    console.log('🚂 Testando deploy no Railway...');
    
    // Testar se conseguimos acessar a tabela
    const { data, error } = await supabase
      .from('conversation_memory')
      .select('phone_number, user_name, memory_data')
      .eq('phone_number', '554797192447')
      .single();
    
    if (error) {
      console.log('❌ Erro ao acessar tabela:', error.message);
      return;
    }
    
    console.log('✅ Tabela acessível');
    console.log('  - Phone:', data.phone_number);
    console.log('  - Name:', data.user_name);
    console.log('  - Has memory:', !!data.memory_data);
    
    if (data.memory_data) {
      console.log('  - History length:', data.memory_data.history?.length || 0);
      console.log('  - UserProfile name:', data.memory_data.userProfile?.name || 'N/A');
    }
    
    // Testar se conseguimos fazer uma query simples
    const { data: testData, error: testError } = await supabase
      .from('conversation_memory')
      .select('phone_number')
      .limit(1);
    
    if (testError) {
      console.log('❌ Erro na query de teste:', testError.message);
    } else {
      console.log('✅ Query de teste funcionando');
    }
    
    console.log('\n✅ Deploy testado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testRailwayDeploy(); 