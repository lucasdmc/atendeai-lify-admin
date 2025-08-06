import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase (mesma configuração do serviço principal)
const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMemoryIssue() {
  console.log('🔧 CORREÇÃO: Verificando e corrigindo problema da memória de conversação');
  
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

    // 2. Verificar se há registros antigos que precisam ser atualizados
    console.log('\n🔍 Verificando registros antigos...');
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    console.log(`📅 Data de hoje: ${startOfDay.toISOString()}`);
    
    if (currentMemory && currentMemory.length > 0) {
      const oldRecord = currentMemory[0];
      const recordDate = new Date(oldRecord.last_interaction);
      
      console.log(`📅 Data do registro: ${recordDate.toISOString()}`);
      console.log(`📊 É de hoje? ${recordDate >= startOfDay ? 'SIM' : 'NÃO'}`);
      
      // Se o registro é antigo, atualizar para hoje
      if (recordDate < startOfDay) {
        console.log('\n🔄 Atualizando registro antigo para hoje...');
        
        const { error: updateError } = await supabase
          .from('conversation_memory')
          .update({
            last_interaction: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('phone_number', phoneNumber);

        if (updateError) {
          console.error('❌ Erro ao atualizar registro:', updateError);
          return;
        }

        console.log('✅ Registro atualizado com sucesso!');
      }
    }

    // 3. Verificar se isFirstConversationOfDay agora funciona corretamente
    console.log('\n🎯 Verificando isFirstConversationOfDay após correção...');
    
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
    console.log(`🎯 isFirstConversationOfDay após correção: ${isFirstConversationOfDay}`);
    console.log(`📊 Dados encontrados: ${firstConversationCheck?.length || 0}`);

    if (!isFirstConversationOfDay) {
      console.log('✅ CORRETO: isFirstConversationOfDay agora retorna false, indicando que não é a primeira conversa do dia.');
      console.log('🔍 Isso significa que a saudação não deve ser aplicada em mensagens subsequentes.');
    } else {
      console.log('⚠️ PROBLEMA: isFirstConversationOfDay ainda retorna true.');
    }

    // 4. Verificar estado final
    console.log('\n📊 Estado final da conversation_memory:');
    
    const { data: finalMemory, error: finalError } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', phoneNumber);

    if (finalError) {
      console.error('❌ Erro ao buscar memória final:', finalError);
      return;
    }

    console.log(`📋 Registros finais: ${finalMemory?.length || 0}`);
    
    if (finalMemory && finalMemory.length > 0) {
      finalMemory.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.last_interaction} - ${record.memory_data?.history?.length || 0} mensagens`);
      });
    }

  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
}

// Executar correção
fixMemoryIssue().then(() => {
  console.log('\n✅ Correção concluída!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
}); 