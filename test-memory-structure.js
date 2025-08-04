// Script para testar a estrutura da tabela conversation_memory
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function testMemoryStructure() {
  try {
    console.log('🔍 Testando estrutura da tabela conversation_memory...');
    
    // 1. Verificar se a tabela existe
    const { data: tables, error: tablesError } = await supabase
      .from('conversation_memory')
      .select('*')
      .limit(1);
    
    if (tablesError) {
      console.log('❌ Erro ao acessar conversation_memory:', tablesError.message);
      return;
    }
    
    console.log('✅ Tabela conversation_memory existe');
    
    // 2. Buscar dados do Lucas
    const { data: lucasData, error: lucasError } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', '554797192447')
      .single();
    
    if (lucasError) {
      console.log('❌ Erro ao buscar dados do Lucas:', lucasError.message);
      return;
    }
    
    console.log('✅ Dados do Lucas encontrados:', {
      phone_number: lucasData.phone_number,
      user_name: lucasData.user_name,
      interaction_count: lucasData.interaction_count,
      has_memory_data: !!lucasData.memory_data
    });
    
    // 3. Verificar estrutura do memory_data
    if (lucasData.memory_data) {
      console.log('📋 Estrutura do memory_data:');
      console.log('  - history:', lucasData.memory_data.history?.length || 0, 'mensagens');
      console.log('  - userProfile:', lucasData.memory_data.userProfile ? 'existe' : 'não existe');
      console.log('  - context:', lucasData.memory_data.context ? 'existe' : 'não existe');
      
      // Mostrar última mensagem
      if (lucasData.memory_data.history && lucasData.memory_data.history.length > 0) {
        const lastMessage = lucasData.memory_data.history[lucasData.memory_data.history.length - 1];
        console.log('  - última mensagem:', lastMessage.role, ':', lastMessage.content.substring(0, 50) + '...');
      }
    }
    
    // 4. Testar carregamento de memória
    console.log('\n🧠 Testando carregamento de memória...');
    const { data: memoryData, error: memoryError } = await supabase
      .from('conversation_memory')
      .select('memory_data')
      .eq('phone_number', '554797192447')
      .single();
    
    if (memoryError) {
      console.log('❌ Erro ao carregar memória:', memoryError.message);
    } else {
      console.log('✅ Memória carregada com sucesso');
      console.log('  - Estrutura:', Object.keys(memoryData.memory_data || {}));
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testMemoryStructure(); 