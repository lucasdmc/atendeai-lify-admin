// Script para testar a Edge Function diretamente
console.log('=== TESTE DA EDGE FUNCTION ===');

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzE5NzQsImV4cCI6MjA1MDU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEdgeFunction() {
  console.log('Testando Edge Function google-user-auth...');
  
  try {
    // Teste 1: Verificar se a função responde
    console.log('\n1. Testando resposta básica...');
    const { data, error } = await supabase.functions.invoke('google-user-auth', {
      body: {
        action: 'list-calendars',
        userId: 'test-user-id'
      }
    });
    
    console.log('Response:', { data, error });
    
    if (error) {
      console.log('❌ Erro na função:', error);
    } else {
      console.log('✅ Função responde corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar função:', error);
  }
}

async function testWithMockData() {
  console.log('\n2. Testando com dados mock...');
  
  try {
    const mockData = {
      action: 'handle-callback',
      code: 'mock_code_123',
      state: 'test-user-id:dummy_state',
      userId: 'test-user-id'
    };
    
    console.log('Enviando dados:', mockData);
    
    const { data, error } = await supabase.functions.invoke('google-user-auth', {
      body: mockData
    });
    
    console.log('Response:', { data, error });
    
    if (error) {
      console.log('❌ Erro com dados mock:', error);
    } else {
      console.log('✅ Função processou dados mock');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar com dados mock:', error);
  }
}

async function runTests() {
  console.log('=== TESTE COMPLETO DA EDGE FUNCTION ===');
  
  await testEdgeFunction();
  await testWithMockData();
  
  console.log('\n=== CONCLUSÃO ===');
  console.log('Se a função retorna erro 400:');
  console.log('1. Verifique se os dados estão sendo enviados corretamente');
  console.log('2. Verifique se a Edge Function está processando os dados');
  console.log('3. Verifique os logs da Edge Function no dashboard do Supabase');
}

runTests(); 