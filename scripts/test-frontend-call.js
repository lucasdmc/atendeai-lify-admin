#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Testando chamada como o frontend...\n');

async function testFrontendCall() {
  try {
    console.log('1. Testando chamada exata do AgentWhatsAppManager:');
    console.log('   agent-whatsapp-manager/generate-qr');
    
    const { data, error } = await supabase.functions.invoke('agent-whatsapp-manager/generate-qr', {
      body: { agentId: '8aae1bc7-07b7-40ba-9ff3-e13fc32caa0b' }
    });
    
    if (error) {
      console.log('   ❌ Erro:', error.message);
      console.log('   📊 Detalhes do erro:', error);
    } else {
      console.log('   ✅ Sucesso:', data);
    }
    
    console.log('\n2. Testando chamada do useAgentWhatsAppConnection:');
    console.log('   agent-whatsapp-manager/generate-qr');
    
    const { data: data2, error: error2 } = await supabase.functions.invoke('agent-whatsapp-manager/generate-qr', {
      body: { agentId: '8aae1bc7-07b7-40ba-9ff3-e13fc32caa0b' }
    });
    
    if (error2) {
      console.log('   ❌ Erro:', error2.message);
      console.log('   📊 Detalhes do erro:', error2);
    } else {
      console.log('   ✅ Sucesso:', data2);
    }
    
    console.log('\n3. Testando chamada do useWhatsAppActions:');
    console.log('   agent-whatsapp-manager/generate-qr');
    
    const { data: data3, error: error3 } = await supabase.functions.invoke('agent-whatsapp-manager/generate-qr', {
      body: { agentId: '8aae1bc7-07b7-40ba-9ff3-e13fc32caa0b' }
    });
    
    if (error3) {
      console.log('   ❌ Erro:', error3.message);
      console.log('   📊 Detalhes do erro:', error3);
    } else {
      console.log('   ✅ Sucesso:', data3);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testFrontendCall(); 