
// ========================================
// TESTE DO SISTEMA DE MEMÓRIA CORRIGIDO
// ========================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function testMemorySystem() {
  console.log('🧪 Testando Sistema de Memória Corrigido...\n');
  
  const testPhone = '+5547999999999';
  const testAgent = 'test_clinic';
  
  // Teste 1: Carregar memória vazia
  console.log('📝 Teste 1: Carregando memória vazia');
  try {
    const { data, error } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', testPhone + '_new')
      .eq('agent_id', testAgent)
      .limit(5);
    
    if (error) {
      console.log('❌ Erro ao carregar memória:', error.message);
    } else {
      console.log('✅ Memória vazia carregada corretamente');
      console.log('📊 Registros encontrados:', data?.length || 0);
    }
  } catch (error) {
    console.log('❌ Erro crítico:', error.message);
  }
  
  // Teste 2: Salvar primeira interação
  console.log('\n📝 Teste 2: Salvando primeira interação');
  try {
    const insertData = {
      phone_number: testPhone,
      agent_id: testAgent,
      user_message: 'Olá!',
      bot_response: 'Olá! Como posso ajudar?',
      intent: 'GREETING',
      confidence: 0.95,
      user_name: null,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('conversation_memory')
      .insert(insertData)
      .select();
    
    if (error) {
      console.log('❌ Erro ao salvar interação:', error.message);
    } else {
      console.log('✅ Primeira interação salva com sucesso!');
      console.log('📋 ID do registro:', data[0]?.id);
    }
  } catch (error) {
    console.log('❌ Erro crítico ao salvar:', error.message);
  }
  
  // Teste 3: Salvar interação com nome
  console.log('\n📝 Teste 3: Salvando interação com nome');
  try {
    const insertData2 = {
      phone_number: testPhone,
      agent_id: testAgent,
      user_message: 'Meu nome é Lucas',
      bot_response: 'Olá Lucas! Prazer em conhecê-lo!',
      intent: 'INTRODUCTION',
      confidence: 0.90,
      user_name: 'Lucas',
      has_introduced: true,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('conversation_memory')
      .insert(insertData2)
      .select();
    
    if (error) {
      console.log('❌ Erro ao salvar interação com nome:', error.message);
    } else {
      console.log('✅ Interação com nome salva com sucesso!');
      console.log('📋 ID do registro:', data[0]?.id);
    }
  } catch (error) {
    console.log('❌ Erro crítico ao salvar com nome:', error.message);
  }
  
  // Teste 4: Carregar memória com dados
  console.log('\n📝 Teste 4: Carregando memória com dados');
  try {
    const { data, error } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', testPhone)
      .eq('agent_id', testAgent)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('❌ Erro ao carregar memória com dados:', error.message);
    } else {
      console.log('✅ Memória com dados carregada com sucesso!');
      console.log('📊 Total de registros:', data?.length || 0);
      
      if (data && data.length > 0) {
        const userName = data.find(record => record.user_name)?.user_name;
        console.log('👤 Nome do usuário encontrado:', userName || 'Nenhum');
        
        const lastMessage = data[0];
        console.log('💬 Última mensagem:', lastMessage.user_message);
        console.log('🤖 Última resposta:', lastMessage.bot_response);
      }
    }
  } catch (error) {
    console.log('❌ Erro crítico ao carregar dados:', error.message);
  }
  
  console.log('\n🎉 Teste do Sistema de Memória Concluído!');
}

// Executar teste
testMemorySystem().catch(console.error);
