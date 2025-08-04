// Script para testar a funcionalidade de memória
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function testMemoryFunctionality() {
  try {
    console.log('🧠 Testando funcionalidade de memória...');
    
    // 1. Carregar memória do Lucas
    const { data: memoryData, error: memoryError } = await supabase
      .from('conversation_memory')
      .select('memory_data')
      .eq('phone_number', '554797192447')
      .single();
    
    if (memoryError) {
      console.log('❌ Erro ao carregar memória:', memoryError.message);
      return;
    }
    
    console.log('✅ Memória carregada');
    console.log('  - Estrutura:', Object.keys(memoryData.memory_data));
    
    // 2. Verificar se tem histórico
    if (memoryData.memory_data.history) {
      console.log('  - Histórico:', memoryData.memory_data.history.length, 'mensagens');
      
      // Mostrar últimas 3 mensagens
      const lastMessages = memoryData.memory_data.history.slice(-6);
      console.log('  - Últimas mensagens:');
      lastMessages.forEach((msg, index) => {
        console.log(`    ${index + 1}. ${msg.role}: ${msg.content.substring(0, 50)}...`);
      });
    }
    
    // 3. Verificar se tem userProfile
    if (memoryData.memory_data.userProfile) {
      console.log('  - UserProfile:', memoryData.memory_data.userProfile.name || 'Sem nome');
    }
    
    // 4. Simular carregamento como o LLMOrchestratorService faria
    console.log('\n🔄 Simulando carregamento do LLMOrchestratorService...');
    
    const memory = memoryData.memory_data || { history: [], userProfile: {} };
    
    // Simular buildMessages
    const systemPrompt = "Você é uma recepcionista virtual da CardioPrime.";
    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Adicionar histórico relevante
    if (memory.history && memory.history.length > 0) {
      const recentHistory = memory.history.slice(-6);
      recentHistory.forEach(h => {
        if (h.role && h.content) {
          messages.push({ role: h.role, content: h.content });
        }
      });
    }
    
    console.log('✅ Mensagens construídas:', messages.length, 'total');
    console.log('  - System prompt:', messages[0].content.substring(0, 50) + '...');
    console.log('  - Histórico:', messages.length - 1, 'mensagens');
    
    // 5. Testar com uma nova mensagem
    const userMessage = "Olá, qual é o meu nome?";
    messages.push({ role: 'user', content: userMessage });
    
    console.log('\n📝 Testando com nova mensagem:', userMessage);
    console.log('✅ Estrutura final:', messages.length, 'mensagens');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testMemoryFunctionality(); 