import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase (mesma configuração do serviço principal)
const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMemorySave() {
  console.log('🧪 TESTE: Verificando se as interações estão sendo salvas corretamente');
  
  const phoneNumber = '554730915628'; // Número do exemplo
  
  try {
    // 1. Verificar estado atual
    console.log('\n📊 Estado atual da conversation_memory:');
    
    const { data: currentMemory, error: currentError } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', phoneNumber);

    if (currentError) {
      console.error('❌ Erro ao buscar memória atual:', currentError);
      return;
    }

    console.log(`📋 Registros encontrados: ${currentMemory?.length || 0}`);
    
    if (currentMemory && currentMemory.length > 0) {
      currentMemory.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.last_interaction} - ${record.memory_data?.history?.length || 0} mensagens`);
      });
    }

    // 2. Simular uma nova interação
    console.log('\n🔄 Simulando nova interação...');
    
    const { data: existingMemory } = await supabase
      .from('conversation_memory')
      .select('memory_data')
      .eq('phone_number', phoneNumber)
      .single();

    const memoryData = existingMemory?.memory_data || { history: [], userProfile: {} };
    
    // Garantir que history existe
    if (!memoryData.history) {
      memoryData.history = [];
    }
    
    // Adicionar nova interação de teste
    memoryData.history.push({
      role: 'user',
      content: 'Teste de mensagem do usuário',
      timestamp: new Date().toISOString()
    });
    
    memoryData.history.push({
      role: 'assistant',
      content: 'Teste de resposta do assistente',
      timestamp: new Date().toISOString()
    });

    // Manter apenas últimas 10 interações
    if (memoryData.history.length > 10) {
      memoryData.history = memoryData.history.slice(-10);
    }

    // Upsert na tabela
    const { error: saveError } = await supabase
      .from('conversation_memory')
      .upsert({
        phone_number: phoneNumber,
        memory_data: memoryData,
        last_interaction: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (saveError) {
      console.error('❌ Erro ao salvar memória:', saveError);
      return;
    }

    console.log('✅ Interação salva com sucesso!');

    // 3. Verificar se a interação foi salva
    console.log('\n🔍 Verificando se a interação foi salva...');
    
    const { data: updatedMemory, error: updatedError } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', phoneNumber);

    if (updatedError) {
      console.error('❌ Erro ao verificar memória atualizada:', updatedError);
      return;
    }

    console.log(`📊 Registros após salvar: ${updatedMemory?.length || 0}`);
    
    if (updatedMemory && updatedMemory.length > 0) {
      updatedMemory.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.last_interaction} - ${record.memory_data?.history?.length || 0} mensagens`);
      });
    }

    // 4. Verificar se isFirstConversationOfDay agora retorna false
    console.log('\n🎯 Verificando isFirstConversationOfDay após salvar...');
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const { data: firstConversationCheck, error: firstError } = await supabase
      .from('conversation_memory')
      .select('last_interaction')
      .eq('phone_number', phoneNumber)
      .gte('last_interaction', startOfDay.toISOString())
      .order('last_interaction', { ascending: false })
      .limit(1);

    if (firstError) {
      console.error('❌ Erro na verificação de primeira conversa:', firstError);
      return;
    }

    const isFirstConversationOfDay = !firstConversationCheck || firstConversationCheck.length === 0;
    console.log(`🎯 isFirstConversationOfDay após salvar: ${isFirstConversationOfDay}`);
    console.log(`📊 Dados encontrados: ${firstConversationCheck?.length || 0}`);

    if (!isFirstConversationOfDay) {
      console.log('✅ CORRETO: isFirstConversationOfDay agora retorna false após salvar a interação.');
    } else {
      console.log('⚠️ PROBLEMA: isFirstConversationOfDay ainda retorna true mesmo após salvar a interação.');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testMemorySave().then(() => {
  console.log('\n✅ Teste concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
}); 