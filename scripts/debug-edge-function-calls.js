#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Testando chamadas da Edge Function...\n');

async function testEdgeFunctionCalls() {
  try {
    console.log('1. Testando chamada CORRETA com endpoint específico:');
    console.log('   agent-whatsapp-manager/generate-qr');
    
    const { data, error } = await supabase.functions.invoke('agent-whatsapp-manager/generate-qr', {
      body: { agentId: 'test-agent' }
    });
    
    if (error) {
      console.log('   ❌ Erro:', error.message);
    } else {
      console.log('   ✅ Sucesso:', data);
    }
    
    console.log('\n2. Testando chamada INCORRETA sem endpoint:');
    console.log('   agent-whatsapp-manager');
    
    // CORRIGIDO: usar endpoint específico
    const { data: data2, error: error2 } = await supabase.functions.invoke('agent-whatsapp-manager/generate-qr', {
      body: { agentId: 'test-agent' }
    });
    
    if (error2) {
      console.log('   ❌ Erro (esperado):', error2.message);
    } else {
      console.log('   ⚠️ Sucesso (inesperado):', data2);
    }
    
    console.log('\n3. Testando chamada com método POST e headers:');
    console.log('   agent-whatsapp-manager/generate-qr com headers customizados');
    
    const { data: data3, error: error3 } = await supabase.functions.invoke('agent-whatsapp-manager/generate-qr', {
      body: { agentId: 'test-agent' },
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Path': 'generate-qr'
      }
    });
    
    if (error3) {
      console.log('   ❌ Erro:', error3.message);
    } else {
      console.log('   ✅ Sucesso:', data3);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testEdgeFunctionCalls(); 