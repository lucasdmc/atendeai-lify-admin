// Script para testar diretamente o LLMOrchestratorService
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function testLLMService() {
  try {
    console.log('🤖 Testando LLMOrchestratorService...');
    
    // Simular exatamente o que o service faz
    const phoneNumber = '554797192447';
    const userMessage = 'Olá, qual é o meu nome?';
    
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
    messages.push({ role: 'user', content: userMessage });
    console.log('  - Mensagem atual: user:', userMessage.substring(0, 30) + '...');
    console.log('  - Total de mensagens:', messages.length);
    
    // Verificar se o nome do usuário está no histórico
    console.log('\n🔍 Verificando se o nome está no histórico...');
    let foundName = null;
    
    if (memory.history) {
      for (const msg of memory.history) {
        if (msg.role === 'user' && msg.content.toLowerCase().includes('meu nome é')) {
          const nameMatch = msg.content.match(/meu nome é (\w+)/i);
          if (nameMatch) {
            foundName = nameMatch[1];
            console.log('  - Nome encontrado:', foundName);
            break;
          }
        }
      }
    }
    
    if (!foundName && memory.userProfile?.name) {
      foundName = memory.userProfile.name;
      console.log('  - Nome no userProfile:', foundName);
    }
    
    console.log('\n✅ Teste concluído!');
    console.log('  - Nome encontrado:', foundName || 'Nenhum');
    console.log('  - Se o nome foi encontrado mas a IA não responde, há um problema no prompt');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testLLMService(); 