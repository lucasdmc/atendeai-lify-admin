import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase (mesma configuração do serviço principal)
const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugWhatsAppSaudacao() {
  console.log('🔍 DEBUG: Verificando problema da saudação no WhatsApp');
  
  const phoneNumber = '554730915628'; // Número do exemplo
  
  try {
    // 1. Verificar estado atual da conversation_memory
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
        if (record.memory_data?.history) {
          console.log(`     Histórico: ${record.memory_data.history.length} mensagens`);
          record.memory_data.history.forEach((msg, i) => {
            console.log(`       ${i + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
          });
        }
      });
    }

    // 2. Verificar se há interações hoje
    console.log('\n📅 Verificando interações de hoje:');
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    console.log(`📅 Data de hoje: ${startOfDay.toISOString()}`);
    
    const { data: todayInteractions, error: todayError } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', phoneNumber)
      .gte('last_interaction', startOfDay.toISOString())
      .order('last_interaction', { ascending: false });

    if (todayError) {
      console.error('❌ Erro ao buscar interações de hoje:', todayError);
      return;
    }

    console.log(`📊 Interações encontradas hoje: ${todayInteractions?.length || 0}`);
    
    if (todayInteractions && todayInteractions.length > 0) {
      todayInteractions.forEach((interaction, index) => {
        console.log(`  ${index + 1}. ${interaction.last_interaction} - ${interaction.memory_data?.history?.length || 0} mensagens`);
      });
    }

    // 3. Simular o método isFirstConversationOfDay
    console.log('\n🧪 Simulando isFirstConversationOfDay...');
    
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
    console.log(`🎯 isFirstConversationOfDay: ${isFirstConversationOfDay}`);
    console.log(`📊 Dados encontrados: ${firstConversationCheck?.length || 0}`);

    // 4. Verificar se o problema pode estar na lógica de salvar
    console.log('\n🔍 Verificando se as mensagens estão sendo salvas corretamente...');
    
    if (currentMemory && currentMemory.length > 0) {
      const record = currentMemory[0];
      const lastInteraction = new Date(record.last_interaction);
      const isFromToday = lastInteraction >= startOfDay;
      
      console.log(`📅 Última interação: ${record.last_interaction}`);
      console.log(`📊 É de hoje? ${isFromToday ? 'SIM' : 'NÃO'}`);
      
      if (!isFromToday) {
        console.log('⚠️ PROBLEMA: A última interação não é de hoje, mas o sistema pode estar considerando como primeira conversa.');
      }
    }

    // 5. Verificar se há problema na lógica do applyResponseLogic
    console.log('\n🔧 Verificando lógica do applyResponseLogic...');
    
    if (isFirstConversationOfDay) {
      console.log('✅ CORRETO: isFirstConversationOfDay = true, saudação deve ser aplicada.');
    } else {
      console.log('❌ PROBLEMA: isFirstConversationOfDay = false, mas saudação ainda está sendo aplicada.');
      console.log('🔍 Isso indica que o problema pode estar no método applyResponseLogic ou na lógica de verificação.');
    }

    // 6. Verificar se há múltiplos registros
    console.log('\n🔍 Verificando se há múltiplos registros...');
    
    if (currentMemory && currentMemory.length > 1) {
      console.log('⚠️ ATENÇÃO: Há múltiplos registros para o mesmo número de telefone!');
      console.log('🔍 Isso pode causar problemas na verificação da primeira conversa.');
    }

  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

// Executar debug
debugWhatsAppSaudacao().then(() => {
  console.log('\n✅ Debug concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
}); 