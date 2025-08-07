import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugWebhookSaving() {
  console.log('🔍 DEBUGANDO SALVAMENTO DO WEBHOOK');
  console.log('===================================');

  try {
    // 1. Verificar se há mensagens das últimas horas
    const last2Hours = new Date();
    last2Hours.setHours(last2Hours.getHours() - 2);
    
    console.log('🔍 Buscando mensagens das últimas 2 horas...');
    const { data: recentMessages, error: messagesError } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .gte('created_at', last2Hours.toISOString())
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('❌ Erro ao buscar mensagens recentes:', messagesError);
      return;
    }

    console.log('✅ Mensagens das últimas 2 horas:', recentMessages.length);
    recentMessages.forEach((msg, index) => {
      const date = new Date(msg.created_at);
      console.log(`   ${index + 1}. ${date.toLocaleString('pt-BR')} | De: ${msg.sender_phone} | Para: ${msg.receiver_phone} | Tipo: ${msg.message_type} | Conteúdo: ${msg.content.substring(0, 50)}...`);
    });

    // 2. Verificar se há conversas das últimas 2 horas
    console.log('\n🔍 Buscando conversas das últimas 2 horas...');
    const { data: recentConversations, error: conversationsError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .gte('created_at', last2Hours.toISOString())
      .order('created_at', { ascending: false });

    if (conversationsError) {
      console.error('❌ Erro ao buscar conversas recentes:', conversationsError);
      return;
    }

    console.log('✅ Conversas das últimas 2 horas:', recentConversations.length);
    recentConversations.forEach((conv, index) => {
      const date = new Date(conv.created_at);
      console.log(`   ${index + 1}. ${date.toLocaleString('pt-BR')} | Paciente: ${conv.patient_phone_number} | Clínica: ${conv.clinic_whatsapp_number} | Última: ${conv.last_message_preview}`);
    });

    // 3. Análise crítica
    console.log('\n🎯 ANÁLISE CRÍTICA:');
    console.log('===================');
    
    if (recentMessages.length === 0) {
      console.log('❌ NENHUMA mensagem recente encontrada');
      console.log('❌ O webhook NÃO está salvando mensagens no banco');
      console.log('🔧 POSSÍVEIS CAUSAS:');
      console.log('   1. Erro no código do webhook ao salvar no banco');
      console.log('   2. Variáveis de ambiente incorretas no Railway');
      console.log('   3. Permissões do Supabase incorretas');
      console.log('   4. Estrutura de dados incorreta');
    } else {
      console.log('✅ Mensagens recentes encontradas');
      console.log('✅ O webhook ESTÁ salvando mensagens no banco');
      
      // Verificar se há mensagens do seu número
      const messagesFromUser = recentMessages.filter(msg => 
        msg.sender_phone === '5547997192447' && 
        msg.message_type === 'received'
      );
      
      if (messagesFromUser.length === 0) {
        console.log('⚠️  Nenhuma mensagem do seu número encontrada');
        console.log('🔧 POSSÍVEIS CAUSAS:');
        console.log('   1. Mensagens não estão sendo processadas pelo webhook');
        console.log('   2. Erro no processamento das mensagens');
        console.log('   3. Problema na estrutura de dados');
      } else {
        console.log('✅ Mensagens do seu número encontradas');
        console.log('✅ Sistema funcionando corretamente');
      }
    }

    // 4. Verificar estrutura de dados
    console.log('\n🔧 VERIFICANDO ESTRUTURA:');
    console.log('==========================');
    
    if (recentMessages.length > 0) {
      const sampleMessage = recentMessages[0];
      console.log('📋 Estrutura da mensagem:', Object.keys(sampleMessage));
      console.log('📋 Dados da mensagem:', sampleMessage);
    }

    if (recentConversations.length > 0) {
      const sampleConversation = recentConversations[0];
      console.log('📋 Estrutura da conversa:', Object.keys(sampleConversation));
      console.log('📋 Dados da conversa:', sampleConversation);
    }

    // 5. Simular o que o webhook deveria fazer
    console.log('\n🧪 SIMULANDO PROCESSAMENTO DO WEBHOOK:');
    console.log('=====================================');
    
    // Simular mensagem recebida
    const testMessage = {
      from: '5547997192447',
      to: '554730915628',
      content: 'Teste de debug',
      whatsappMessageId: `debug-${Date.now()}`
    };

    console.log('📝 Simulando mensagem:', testMessage);

    // 1. Identificar clínica
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinic_whatsapp_numbers')
      .select('clinic_id')
      .eq('whatsapp_number', testMessage.to)
      .eq('is_active', true)
      .single();

    if (clinicError || !clinicData) {
      console.error('❌ Clínica não encontrada para o número:', testMessage.to);
      return;
    }

    console.log('✅ Clínica encontrada:', clinicData.clinic_id);

    // 2. Criar/atualizar conversa
    const { data: conversationData, error: conversationError } = await supabase
      .from('whatsapp_conversations_improved')
      .upsert({
        clinic_id: clinicData.clinic_id,
        patient_phone_number: testMessage.from,
        clinic_whatsapp_number: testMessage.to,
        last_message_preview: testMessage.content,
        last_message_at: new Date().toISOString()
      }, {
        onConflict: 'clinic_id,patient_phone_number,clinic_whatsapp_number'
      })
      .select()
      .single();

    if (conversationError) {
      console.error('❌ Erro ao criar/atualizar conversa:', conversationError);
      return;
    }

    console.log('✅ Conversa criada/atualizada:', conversationData.id);

    // 3. Salvar mensagem
    const { data: messageData, error: messageError } = await supabase
      .from('whatsapp_messages_improved')
      .insert({
        conversation_id: conversationData.id,
        sender_phone: testMessage.from,
        receiver_phone: testMessage.to,
        content: testMessage.content,
        message_type: 'received',
        whatsapp_message_id: testMessage.whatsappMessageId
      })
      .select()
      .single();

    if (messageError) {
      console.error('❌ Erro ao salvar mensagem:', messageError);
      return;
    }

    console.log('✅ Mensagem salva:', messageData.id);

    console.log('\n🎉 SIMULAÇÃO CONCLUÍDA!');
    console.log('✅ Processo de salvamento está funcionando');
    console.log('✅ O problema pode estar no webhook do Railway');

  } catch (error) {
    console.error('💥 Erro no debug:', error);
  }
}

debugWebhookSaving(); 