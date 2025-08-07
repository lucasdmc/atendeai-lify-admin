// ========================================
// DIAGNÓSTICO DETALHADO - PROBLEMA DE SALVAMENTO DE MENSAGENS
// ========================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M'
);

async function diagnoseWebhookSaveIssue() {
  console.log('🔍 INICIANDO DIAGNÓSTICO DETALHADO DO WEBHOOK');
  console.log('================================================');

  // 1. VERIFICAR ESTRUTURA DAS TABELAS
  console.log('\n📋 1. VERIFICANDO ESTRUTURA DAS TABELAS');
  
  try {
    const { data: clinicNumbers, error: clinicError } = await supabase
      .from('clinic_whatsapp_numbers')
      .select('*')
      .limit(5);

    if (clinicError) {
      console.error('❌ Erro ao buscar clinic_whatsapp_numbers:', clinicError);
    } else {
      console.log('✅ clinic_whatsapp_numbers encontradas:', clinicNumbers?.length || 0);
      console.log('📊 Dados:', clinicNumbers);
    }

    const { data: conversations, error: convError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .limit(5);

    if (convError) {
      console.error('❌ Erro ao buscar whatsapp_conversations_improved:', convError);
    } else {
      console.log('✅ whatsapp_conversations_improved encontradas:', conversations?.length || 0);
      console.log('📊 Dados:', conversations);
    }

    const { data: messages, error: msgError } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .limit(5);

    if (msgError) {
      console.error('❌ Erro ao buscar whatsapp_messages_improved:', msgError);
    } else {
      console.log('✅ whatsapp_messages_improved encontradas:', messages?.length || 0);
      console.log('📊 Dados:', messages);
    }

  } catch (error) {
    console.error('❌ Erro geral na verificação das tabelas:', error);
  }

  // 2. VERIFICAR CONFIGURAÇÕES DO WHATSAPP
  console.log('\n📋 2. VERIFICANDO CONFIGURAÇÕES DO WHATSAPP');
  
  const whatsappConfig = {
    accessToken: process.env.WHATSAPP_META_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_META_PHONE_NUMBER_ID
  };

  console.log('📊 Configurações WhatsApp:', {
    hasAccessToken: !!whatsappConfig.accessToken,
    hasPhoneNumberId: !!whatsappConfig.phoneNumberId,
    phoneNumberId: whatsappConfig.phoneNumberId
  });

  // 3. SIMULAR PROCESSAMENTO DE WEBHOOK
  console.log('\n📋 3. SIMULANDO PROCESSAMENTO DE WEBHOOK');
  
  const mockWebhookData = {
    entry: [{
      id: 'test-entry',
      changes: [{
        field: 'messages',
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '554730915628',
            phone_number_id: whatsappConfig.phoneNumberId
          },
          contacts: [{
            profile: { name: 'Test User' },
            wa_id: '5547999999999'
          }],
          messages: [{
            from: '5547999999999',
            id: 'test-message-id',
            timestamp: '1234567890',
            type: 'text',
            text: { body: 'Teste de mensagem' }
          }]
        }
      }]
    }]
  };

  console.log('📊 Dados simulados do webhook:', JSON.stringify(mockWebhookData, null, 2));

  // 4. TESTAR FUNÇÃO DE SALVAMENTO
  console.log('\n📋 4. TESTANDO FUNÇÃO DE SALVAMENTO');
  
  try {
    // Testar busca da clínica
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinic_whatsapp_numbers')
      .select('clinic_id')
      .eq('whatsapp_number', '554730915628')
      .eq('is_active', true)
      .single();

    console.log('🔍 Busca da clínica:', {
      found: !!clinicData,
      error: clinicError,
      data: clinicData
    });

    if (clinicData) {
      // Testar criação de conversa
      const { data: conversationData, error: conversationError } = await supabase
        .from('whatsapp_conversations_improved')
        .upsert({
          clinic_id: clinicData.clinic_id,
          patient_phone_number: '5547999999999',
          clinic_whatsapp_number: '554730915628',
          last_message_preview: 'Teste de mensagem',
          unread_count: 1,
          last_message_at: new Date().toISOString()
        }, {
          onConflict: 'clinic_id,patient_phone_number,clinic_whatsapp_number',
          ignoreDuplicates: false
        })
        .select()
        .single();

      console.log('🔍 Criação de conversa:', {
        success: !!conversationData,
        error: conversationError,
        data: conversationData
      });

      if (conversationData) {
        // Testar salvamento de mensagem
        const { data: messageData, error: messageError } = await supabase
          .from('whatsapp_messages_improved')
          .insert({
            conversation_id: conversationData.id,
            sender_phone: '5547999999999',
            receiver_phone: '554730915628',
            content: 'Teste de mensagem',
            message_type: 'received',
            whatsapp_message_id: 'test-message-id'
          })
          .select()
          .single();

        console.log('🔍 Salvamento de mensagem:', {
          success: !!messageData,
          error: messageError,
          data: messageData
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro no teste de salvamento:', error);
  }

  // 5. VERIFICAR PROBLEMAS COMUNS
  console.log('\n📋 5. VERIFICANDO PROBLEMAS COMUNS');
  
  // Verificar se o número do WhatsApp está correto
  const { data: clinicNumbers, error: clinicError } = await supabase
    .from('clinic_whatsapp_numbers')
    .select('*');

  if (clinicNumbers) {
    console.log('📊 Números de WhatsApp cadastrados:');
    clinicNumbers.forEach(clinic => {
      console.log(`   - Clínica ${clinic.clinic_id}: ${clinic.whatsapp_number} (ativo: ${clinic.is_active})`);
    });
  }

  // Verificar se há conversas existentes
  const { data: existingConversations, error: convError } = await supabase
    .from('whatsapp_conversations_improved')
    .select('*');

  if (existingConversations) {
    console.log('📊 Conversas existentes:', existingConversations.length);
    existingConversations.forEach(conv => {
      console.log(`   - ${conv.patient_phone_number} -> ${conv.clinic_whatsapp_number} (${conv.last_message_preview})`);
    });
  }

  // 6. RECOMENDAÇÕES
  console.log('\n📋 6. RECOMENDAÇÕES');
  
  console.log('🔧 Possíveis problemas identificados:');
  console.log('   1. Número do WhatsApp não encontrado na tabela clinic_whatsapp_numbers');
  console.log('   2. Estrutura do webhook diferente do esperado');
  console.log('   3. Problemas de permissão no Supabase');
  console.log('   4. Campos obrigatórios não preenchidos');
  
  console.log('\n🔧 Ações recomendadas:');
  console.log('   1. Verificar se o número do WhatsApp está cadastrado corretamente');
  console.log('   2. Verificar logs do webhook para ver a estrutura real dos dados');
  console.log('   3. Testar com dados reais do webhook');
  console.log('   4. Verificar permissões RLS no Supabase');

  console.log('\n✅ DIAGNÓSTICO CONCLUÍDO');
}

// Executar diagnóstico
diagnoseWebhookSaveIssue().catch(console.error); 