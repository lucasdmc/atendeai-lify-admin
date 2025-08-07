// ========================================
// TESTE DA CORREÇÃO DO WEBHOOK
// ========================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M'
);

async function testWebhookCorrection() {
  console.log('🧪 TESTANDO CORREÇÃO DO WEBHOOK');
  console.log('================================');

  // 1. SIMULAR WEBHOOK REAL DA META
  console.log('\n📋 1. SIMULANDO WEBHOOK REAL DA META');
  
  const mockWebhookData = {
    entry: [{
      id: 'test-entry-id',
      changes: [{
        field: 'messages',
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '554730915628',
            phone_number_id: '123456789'
          },
          contacts: [{
            profile: { name: 'Test User' },
            wa_id: '5547999999999'
          }],
          messages: [{
            from: '5547999999999',
            id: 'test-message-id-123',
            timestamp: '1234567890',
            type: 'text',
            text: { body: 'Teste de mensagem corrigida' }
          }]
        }
      }]
    }]
  };

  console.log('📊 Webhook simulado:', JSON.stringify(mockWebhookData, null, 2));

  // 2. TESTAR EXTRAÇÃO CORRIGIDA
  console.log('\n📋 2. TESTANDO EXTRAÇÃO CORRIGIDA');
  
  const whatsappConfig = {
    accessToken: process.env.WHATSAPP_META_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_META_PHONE_NUMBER_ID
  };

  for (const entry of mockWebhookData.entry) {
    for (const change of entry.changes) {
      if (change.value.messages && change.value.messages.length > 0) {
        for (const message of change.value.messages) {
          // CORREÇÃO APLICADA
          const toNumber = change.value.metadata?.phone_number_id || whatsappConfig.phoneNumberId;
          
          console.log('🔍 Extração do número de destino:', {
            original: 'message.to (não existe)',
            corrected: toNumber,
            metadata: change.value.metadata,
            fallback: whatsappConfig.phoneNumberId
          });

          // 3. TESTAR SALVAMENTO NO BANCO
          console.log('\n📋 3. TESTANDO SALVAMENTO NO BANCO');
          
          try {
            // Buscar clínica
            const { data: clinicData, error: clinicError } = await supabase
              .from('clinic_whatsapp_numbers')
              .select('clinic_id')
              .eq('whatsapp_number', toNumber)
              .eq('is_active', true)
              .single();

            console.log('🔍 Busca de clínica:', {
              toNumber,
              found: !!clinicData,
              error: clinicError,
              data: clinicData
            });

            if (clinicData) {
              // Criar conversa
              const { data: conversationData, error: conversationError } = await supabase
                .from('whatsapp_conversations_improved')
                .upsert({
                  clinic_id: clinicData.clinic_id,
                  patient_phone_number: message.from,
                  clinic_whatsapp_number: toNumber,
                  last_message_preview: message.text.body,
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
                // Salvar mensagem
                const { data: messageData, error: messageError } = await supabase
                  .from('whatsapp_messages_improved')
                  .insert({
                    conversation_id: conversationData.id,
                    sender_phone: message.from,
                    receiver_phone: toNumber,
                    content: message.text.body,
                    message_type: 'received',
                    whatsapp_message_id: message.id
                  })
                  .select()
                  .single();

                console.log('🔍 Salvamento de mensagem:', {
                  success: !!messageData,
                  error: messageError,
                  data: messageData
                });

                if (messageData) {
                  console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
                  console.log('📊 Mensagem salva com ID:', messageData.id);
                  console.log('📊 Conversa ID:', conversationData.id);
                } else {
                  console.log('❌ FALHA NO SALVAMENTO DA MENSAGEM');
                }
              } else {
                console.log('❌ FALHA NA CRIAÇÃO DA CONVERSA');
              }
            } else {
              console.log('❌ CLÍNICA NÃO ENCONTRADA');
              console.log('💡 Verifique se o número', toNumber, 'está cadastrado em clinic_whatsapp_numbers');
            }

          } catch (error) {
            console.error('❌ ERRO GERAL:', error);
          }
        }
      }
    }
  }

  // 4. VERIFICAR DADOS NO BANCO
  console.log('\n📋 4. VERIFICANDO DADOS NO BANCO');
  
  const { data: recentMessages, error: msgError } = await supabase
    .from('whatsapp_messages_improved')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (recentMessages) {
    console.log('📊 Últimas mensagens no banco:', recentMessages.length);
    recentMessages.forEach(msg => {
      console.log(`   - ${msg.sender_phone} -> ${msg.receiver_phone}: ${msg.content.substring(0, 50)}...`);
    });
  }

  console.log('\n✅ TESTE CONCLUÍDO');
}

// Executar teste
testWebhookCorrection().catch(console.error); 