import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixWebhookConversationSaving() {
  console.log('🔧 CORRIGINDO: Salvamento de Conversas no Webhook');
  console.log('==================================================');

  try {
    // 1. Verificar se a função process_incoming_message existe
    console.log('\n1️⃣ Verificando função process_incoming_message...');
    
    const { data: functionExists, error: functionError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_name = 'process_incoming_message'
      `
    });

    if (functionError) {
      console.log('⚠️ Erro ao verificar função:', functionError);
    } else {
      console.log('✅ Função process_incoming_message existe');
    }

    // 2. Criar função de salvamento de conversa se não existir
    console.log('\n2️⃣ Criando função de salvamento de conversa...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION process_incoming_message(
        p_from_number VARCHAR(20),
        p_to_number VARCHAR(20),
        p_content TEXT,
        p_whatsapp_message_id TEXT DEFAULT NULL
      )
      RETURNS UUID AS $$
      DECLARE
        v_clinic_id UUID;
        v_conversation_id UUID;
        v_message_id UUID;
      BEGIN
        -- 1. Identificar clínica pelo número que recebeu
        SELECT clinic_id INTO v_clinic_id
        FROM clinic_whatsapp_numbers
        WHERE whatsapp_number = p_to_number
          AND is_active = true
        LIMIT 1;

        IF v_clinic_id IS NULL THEN
          RAISE EXCEPTION 'Clínica não encontrada para o número %', p_to_number;
        END IF;

        -- 2. Criar ou atualizar conversa
        INSERT INTO whatsapp_conversations_improved (
          clinic_id,
          patient_phone_number,
          clinic_whatsapp_number,
          last_message_preview,
          unread_count,
          last_message_at
        )
        VALUES (
          v_clinic_id,
          p_from_number,
          p_to_number,
          p_content,
          1,
          NOW()
        )
        ON CONFLICT (clinic_id, patient_phone_number, clinic_whatsapp_number)
        DO UPDATE SET
          last_message_preview = p_content,
          unread_count = whatsapp_conversations_improved.unread_count + 1,
          last_message_at = NOW(),
          updated_at = NOW()
        RETURNING id INTO v_conversation_id;

        -- 3. Salvar mensagem
        INSERT INTO whatsapp_messages_improved (
          conversation_id,
          sender_phone,
          receiver_phone,
          content,
          message_type,
          whatsapp_message_id
        )
        VALUES (
          v_conversation_id,
          p_from_number,
          p_to_number,
          p_content,
          'received',
          p_whatsapp_message_id
        )
        RETURNING id INTO v_message_id;

        RETURN v_conversation_id;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: createFunctionError } = await supabase.rpc('exec_sql', { 
      sql_query: createFunctionSQL 
    });

    if (createFunctionError) {
      console.error('❌ Erro ao criar função:', createFunctionError);
    } else {
      console.log('✅ Função process_incoming_message criada/atualizada');
    }

    // 3. Testar a função com dados reais
    console.log('\n3️⃣ Testando função com dados reais...');
    
    const testData = {
      from_number: '5547997192447', // Seu número
      to_number: '554730915628',    // Número da CardioPrime
      content: 'Oi',
      whatsapp_message_id: 'test_message_001'
    };

    console.log(`📨 Testando com dados: ${testData.from_number} → ${testData.to_number}: "${testData.content}"`);
    
    const { data: testResult, error: testError } = await supabase.rpc('process_incoming_message', {
      p_from_number: testData.from_number,
      p_to_number: testData.to_number,
      p_content: testData.content,
      p_whatsapp_message_id: testData.whatsapp_message_id
    });

    if (testError) {
      console.error('❌ Erro ao testar função:', testError);
    } else {
      console.log('✅ Função testada com sucesso! Conversation ID:', testResult);
    }

    // 4. Verificar se a conversa foi salva
    console.log('\n4️⃣ Verificando se a conversa foi salva...');
    
    const { data: savedConversation, error: checkError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .eq('patient_phone_number', testData.from_number)
      .eq('clinic_whatsapp_number', testData.to_number)
      .single();

    if (checkError) {
      console.error('❌ Erro ao verificar conversa salva:', checkError);
    } else if (savedConversation) {
      console.log('✅ Conversa salva com sucesso!');
      console.log('   ID:', savedConversation.id);
      console.log('   Clínica:', savedConversation.clinic_id);
      console.log('   Última mensagem:', savedConversation.last_message_preview);
      console.log('   Não lidas:', savedConversation.unread_count);
    } else {
      console.log('⚠️ Conversa não encontrada após salvar');
    }

    // 5. Verificar mensagens salvas
    console.log('\n5️⃣ Verificando mensagens salvas...');
    
    const { data: savedMessages, error: messagesError } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .eq('sender_phone', testData.from_number)
      .eq('receiver_phone', testData.to_number)
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('❌ Erro ao verificar mensagens:', messagesError);
    } else {
      console.log(`✅ Mensagens encontradas: ${savedMessages?.length || 0}`);
      savedMessages?.forEach((msg, index) => {
        console.log(`   ${index + 1}. Conteúdo: "${msg.content}" | Tipo: ${msg.message_type} | Data: ${msg.created_at}`);
      });
    }

    // 6. Criar código atualizado do webhook
    console.log('\n6️⃣ Criando código atualizado do webhook...');
    
    const updatedWebhookCode = `
// ========================================
// WEBHOOK ATUALIZADO COM SALVAMENTO DE CONVERSAS
// ========================================

import express from 'express';
import { sendWhatsAppTextMessage } from '../services/whatsappMetaService.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Configuração do Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M'
);

// Webhook para receber mensagens do WhatsApp
router.post('/whatsapp-meta', async (req, res) => {
  try {
    console.log('🚨 [Webhook-Atualizado] WEBHOOK CHAMADO!');
    console.log('[Webhook-Atualizado] Mensagem recebida:', {
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    // Verificar se é um desafio de verificação
    if (req.body.mode === 'subscribe' && req.body['hub.challenge']) {
      console.log('[Webhook-Atualizado] Respondendo ao desafio de verificação');
      return res.status(200).send(req.body['hub.challenge']);
    }

    // Processar mensagens
    if (req.body.entry && req.body.entry.length > 0) {
      const webhookData = req.body;
      
      // Configuração do WhatsApp
      const whatsappConfig = {
        accessToken: process.env.WHATSAPP_META_ACCESS_TOKEN,
        phoneNumberId: process.env.WHATSAPP_META_PHONE_NUMBER_ID
      };

      // Processar com SALVAMENTO DE CONVERSAS
      const result = await processWhatsAppWebhookWithSaving(
        webhookData,
        whatsappConfig
      );

      if (result.success) {
        console.log('[Webhook-Atualizado] Processamento concluído com sucesso');
        return res.status(200).json({ 
          success: true, 
          message: 'Webhook processado com Salvamento de Conversas',
          processed: result.processed
        });
      } else {
        console.error('[Webhook-Atualizado] Erro no processamento:', result.error);
        return res.status(500).json({ 
          success: false, 
          error: result.error 
        });
      }
    }

    // Se não há mensagens para processar
    return res.status(200).json({ 
      success: true, 
      message: 'Webhook recebido, mas sem mensagens para processar' 
    });

  } catch (error) {
    console.error('[Webhook-Atualizado] Erro geral:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Processa webhook com salvamento de conversas
 */
async function processWhatsAppWebhookWithSaving(webhookData, whatsappConfig) {
  try {
    console.log('🚨 [Webhook-Atualizado] FUNÇÃO CHAMADA!');
    
    const processed = [];

    for (const entry of webhookData.entry) {
      for (const change of entry.changes) {
        if (change.value.messages && change.value.messages.length > 0) {
          for (const message of change.value.messages) {
            console.log('[Webhook-Atualizado] Processando mensagem:', {
              from: message.from,
              messageType: message.type,
              timestamp: message.timestamp
            });

            // Extrair texto da mensagem
            const messageText = message.text?.body || '';
            
            if (!messageText) {
              console.log('[Webhook-Atualizado] Mensagem sem texto, ignorando');
              continue;
            }

            // 1. SALVAR CONVERSA NO BANCO DE DADOS
            console.log('[Webhook-Atualizado] Salvando conversa no banco...');
            const conversationId = await saveConversationToDatabase(
              message.from,
              message.to || whatsappConfig.phoneNumberId,
              messageText,
              message.id
            );

            if (conversationId) {
              console.log('[Webhook-Atualizado] Conversa salva com ID:', conversationId);
            }

            // 2. Processar com IA
            const aiResult = await processMessageWithAI(
              messageText, 
              message.from, 
              whatsappConfig
            );

            if (aiResult.success) {
              // 3. SALVAR RESPOSTA NO BANCO DE DADOS
              console.log('[Webhook-Atualizado] Salvando resposta no banco...');
              await saveResponseToDatabase(
                conversationId,
                message.from,
                message.to || whatsappConfig.phoneNumberId,
                aiResult.response,
                'sent',
                null
              );

              // 4. Enviar resposta via WhatsApp
              await sendAIResponseViaWhatsApp(
                message.from, 
                aiResult, 
                whatsappConfig
              );

              processed.push({
                phoneNumber: message.from,
                message: messageText,
                response: aiResult.response,
                conversationId: conversationId,
                intent: aiResult.intent,
                confidence: aiResult.confidence
              });
            }
          }
        }
      }
    }

    return { success: true, processed };

  } catch (error) {
    console.error('[Webhook-Atualizado] Erro no processamento:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Salva conversa no banco de dados
 */
async function saveConversationToDatabase(fromNumber, toNumber, content, whatsappMessageId) {
  try {
    console.log('[Webhook-Atualizado] Salvando conversa:', { fromNumber, toNumber, content });
    
    const { data: result, error } = await supabase.rpc('process_incoming_message', {
      p_from_number: fromNumber,
      p_to_number: toNumber,
      p_content: content,
      p_whatsapp_message_id: whatsappMessageId
    });

    if (error) {
      console.error('[Webhook-Atualizado] Erro ao salvar conversa:', error);
      return null;
    }

    console.log('[Webhook-Atualizado] Conversa salva com sucesso, ID:', result);
    return result;

  } catch (error) {
    console.error('[Webhook-Atualizado] Erro ao salvar conversa:', error);
    return null;
  }
}

/**
 * Salva resposta no banco de dados
 */
async function saveResponseToDatabase(conversationId, fromNumber, toNumber, content, messageType, whatsappMessageId) {
  try {
    console.log('[Webhook-Atualizado] Salvando resposta:', { conversationId, content });
    
    const { data: result, error } = await supabase
      .from('whatsapp_messages_improved')
      .insert({
        conversation_id: conversationId,
        sender_phone: fromNumber,
        receiver_phone: toNumber,
        content: content,
        message_type: messageType,
        whatsapp_message_id: whatsappMessageId
      })
      .select()
      .single();

    if (error) {
      console.error('[Webhook-Atualizado] Erro ao salvar resposta:', error);
      return null;
    }

    console.log('[Webhook-Atualizado] Resposta salva com sucesso, ID:', result.id);
    return result.id;

  } catch (error) {
    console.error('[Webhook-Atualizado] Erro ao salvar resposta:', error);
    return null;
  }
}

/**
 * Processa mensagem com IA
 */
async function processMessageWithAI(messageText, phoneNumber, config) {
  try {
    console.log('🤖 [Webhook-Atualizado] Gerando resposta com IA', { 
      phoneNumber, 
      messageLength: messageText.length 
    });

    // Usar LLMOrchestratorService
    const { LLMOrchestratorService } = await import('../services/llmOrchestratorService.js');
    
    const request = {
      phoneNumber: phoneNumber,
      message: messageText,
      conversationId: \`whatsapp-\${phoneNumber}-\${Date.now()}\`,
      userId: phoneNumber
    };

    console.log('[Webhook-Atualizado] Chamando LLMOrchestratorService...');
    const response = await LLMOrchestratorService.processMessage(request);

    console.log('✅ [Webhook-Atualizado] Resposta gerada:', {
      response: response.response,
      intent: response.intent?.name,
      confidence: response.intent?.confidence
    });

    return {
      success: true,
      response: response.response,
      intent: response.intent,
      confidence: response.intent?.confidence || 0.8
    };

  } catch (error) {
    console.error('💥 [Webhook-Atualizado] Erro ao gerar resposta:', error);
    return {
      success: false,
      response: 'Desculpe, estou com dificuldades técnicas no momento. Por favor, entre em contato pelo telefone.',
      error: error.message
    };
  }
}

/**
 * Envia resposta via WhatsApp
 */
async function sendAIResponseViaWhatsApp(to, aiResponse, config) {
  try {
    console.log('[Webhook-Atualizado] Enviando resposta via WhatsApp para:', to);
    
    const response = await sendWhatsAppTextMessage(
      to,
      aiResponse.response,
      config.accessToken,
      config.phoneNumberId
    );

    console.log('[Webhook-Atualizado] Resposta enviada com sucesso');
    return response;

  } catch (error) {
    console.error('[Webhook-Atualizado] Erro ao enviar resposta:', error);
    return null;
  }
}

export default router;
    `;

    // Salvar o código atualizado
    const fs = await import('fs');
    fs.writeFileSync('routes/webhook-updated.js', updatedWebhookCode);
    console.log('✅ Código do webhook atualizado salvo em routes/webhook-updated.js');

    // 7. Instruções finais
    console.log('\n🔧 INSTRUÇÕES PARA APLICAR A CORREÇÃO:');
    console.log('==========================================');
    console.log('1. Substitua o arquivo routes/webhook-contextualized.js pelo novo código');
    console.log('2. Reinicie o servidor para aplicar as mudanças');
    console.log('3. Teste enviando uma nova mensagem para o WhatsApp');
    console.log('4. Verifique se a conversa aparece na tela de Conversas');

    console.log('\n✅ Correção concluída!');

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

// Executar correção
fixWebhookConversationSaving().then(() => {
  console.log('\n✅ Correção finalizada!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
}); 