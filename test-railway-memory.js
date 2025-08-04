// Script para testar memória diretamente no Railway
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function testRailwayMemory() {
  try {
    console.log('🚂 Testando memória no Railway...');
    
    // Simular exatamente o que o LLMOrchestratorService faz
    const phoneNumber = '554797192447';
    
    console.log('🔍 Carregando memória para:', phoneNumber);
    
    const { data } = await supabase
      .from('conversation_memory')
      .select('memory_data')
      .eq('phone_number', phoneNumber)
      .single();

    console.log('✅ Memória carregada:', data ? 'encontrada' : 'não encontrada');
    
    if (data?.memory_data) {
      console.log('  - Histórico:', data.memory_data.history?.length || 0, 'mensagens');
      console.log('  - UserProfile:', data.memory_data.userProfile?.name || 'sem nome');
      
      // Mostrar últimas mensagens
      if (data.memory_data.history && data.memory_data.history.length > 0) {
        const lastMessages = data.memory_data.history.slice(-4);
        console.log('  - Últimas mensagens:');
        lastMessages.forEach((msg, index) => {
          console.log(`    ${index + 1}. ${msg.role}: ${msg.content.substring(0, 50)}...`);
        });
      }
    }

    const memory = data?.memory_data || { history: [], userProfile: {} };
    
    // Simular buildMessages
    console.log('\n🧠 Simulando buildMessages...');
    const systemPrompt = "Você é uma recepcionista virtual da CardioPrime.";
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    console.log('  - Histórico disponível:', memory.history?.length || 0, 'mensagens');

    // Adicionar histórico relevante
    if (memory.history && memory.history.length > 0) {
      const recentHistory = memory.history.slice(-6);
      console.log('  - Usando últimas:', recentHistory.length, 'mensagens');
      
      recentHistory.forEach((h, index) => {
        if (h.role && h.content) {
          messages.push({ role: h.role, content: h.content });
          console.log(`    ${index + 1}. ${h.role}: ${h.content.substring(0, 30)}...`);
        }
      });
    }

    // Adicionar mensagem atual
    const userMessage = "Olá, qual é o meu nome?";
    messages.push({ role: 'user', content: userMessage });
    console.log('  - Mensagem atual: user:', userMessage.substring(0, 30) + '...');
    console.log('  - Total de mensagens:', messages.length);
    
    console.log('\n✅ Teste concluído!');
    console.log('  - Se a memória está sendo carregada, o problema pode estar no OpenAI');
    console.log('  - Se não está carregando, há um problema na estrutura');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testRailwayMemory(); 