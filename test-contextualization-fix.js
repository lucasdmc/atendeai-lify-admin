// ========================================
// TESTE DAS CORREÇÕES DE CONTEXTUALIZAÇÃO
// ========================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M'
);

async function testContextualizationFix() {
  try {
    console.log('🧪 [TESTE] Iniciando teste das correções de contextualização...');
    console.log('🔑 [TESTE] URL Supabase:', process.env.SUPABASE_URL);
    console.log('🔑 [TESTE] Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA');
    
    // 1. Testar busca de clínicas com contextualização
    console.log('\n🔍 [TESTE] 1. Buscando clínicas com contextualização...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('name, whatsapp_phone, id, has_contextualization, contextualization_json')
      .eq('has_contextualization', true);
    
    if (clinicsError) {
      console.error('❌ [TESTE] Erro ao buscar clínicas:', clinicsError);
      return;
    }
    
    console.log(`✅ [TESTE] ${clinics.length} clínicas encontradas:`);
    clinics.forEach(clinic => {
      console.log(`   - ${clinic.name} (ID: ${clinic.id})`);
      console.log(`     WhatsApp: ${clinic.whatsapp_phone}`);
      console.log(`     Tem JSON: ${!!clinic.contextualization_json}`);
      if (clinic.contextualization_json) {
        console.log(`     Estrutura JSON:`, Object.keys(clinic.contextualization_json));
      }
    });
    
    // 2. Testar busca de memória de conversa
    console.log('\n🔍 [TESTE] 2. Testando busca de memória de conversa...');
    const testPhone = '554730915628'; // Número do Lucas
    
    const { data: memory, error: memoryError } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', testPhone)
      .single();
    
    if (memoryError && memoryError.code !== 'PGRST116') {
      console.error('❌ [TESTE] Erro ao buscar memória:', memoryError);
    } else if (memory) {
      console.log('✅ [TESTE] Memória encontrada:', {
        phoneNumber: memory.phone_number,
        hasUserProfile: !!memory.user_profile,
        userProfileData: memory.user_profile,
        hasHistory: !!memory.conversation_history,
        historyLength: memory.conversation_history?.length || 0,
        lastInteraction: memory.last_interaction,
        updatedAt: memory.updated_at
      });
    } else {
      console.log('📝 [TESTE] Nenhuma memória encontrada para o número de teste');
    }
    
    // 3. Testar inserção de memória
    console.log('\n🔍 [TESTE] 3. Testando inserção de memória...');
    const testMemory = {
      phone_number: testPhone,
      user_profile: { name: 'Lucas Cantoni' },
      conversation_history: [
        {
          timestamp: new Date().toISOString(),
          user: 'Olá, me chamo Lucas, tudo bem?',
          bot: 'Olá! Como posso ajudá-lo hoje, Lucas?',
          intent: 'GREETING'
        }
      ],
      last_interaction: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { error: insertError } = await supabase
      .from('conversation_memory')
      .upsert(testMemory, { onConflict: 'phone_number' });
    
    if (insertError) {
      console.error('❌ [TESTE] Erro ao inserir memória:', insertError);
    } else {
      console.log('✅ [TESTE] Memória de teste inserida com sucesso');
    }
    
    // 4. Testar verificação de primeira conversa do dia
    console.log('\n🔍 [TESTE] 4. Testando verificação de primeira conversa do dia...');
    
    // Buscar memória atualizada
    const { data: updatedMemory, error: updatedMemoryError } = await supabase
      .from('conversation_memory')
      .select('last_interaction, updated_at')
      .eq('phone_number', testPhone)
      .single();
    
    if (updatedMemoryError) {
      console.error('❌ [TESTE] Erro ao buscar memória atualizada:', updatedMemoryError);
    } else if (updatedMemory) {
      const lastInteraction = updatedMemory.last_interaction || updatedMemory.updated_at;
      const lastConversation = new Date(lastInteraction);
      const today = new Date();
      
      const lastConversationDate = lastConversation.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const todayDate = today.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      
      const isFirstOfDay = lastConversationDate !== todayDate;
      
      console.log('✅ [TESTE] Verificação de primeira conversa:', {
        lastConversation: lastConversationDate,
        today: todayDate,
        isFirstOfDay,
        lastInteraction: lastInteraction
      });
    }
    
    console.log('\n🎉 [TESTE] Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('💥 [TESTE] Erro durante o teste:', error);
  }
}

// Executar teste
testContextualizationFix();
