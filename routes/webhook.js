// ========================================
// WEBHOOK FINAL - TODAS AS FUNCIONALIDADES CONSOLIDADAS
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

// Webhook para verificação (GET) e receber mensagens (POST)
router.get('/whatsapp-meta', async (req, res) => {
  try {
    console.log('[Webhook-Final] Verificação GET recebida:', {
      query: req.query,
      headers: req.headers
    });

    // Verificar se é um desafio de verificação
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.challenge']) {
      console.log('[Webhook-Final] Respondendo ao desafio de verificação GET');
      
      // Verificar o token de verificação
      const verifyToken = req.query['hub.verify_token'];
      const expectedToken = process.env.WEBHOOK_VERIFY_TOKEN || 'atendeai-lify-backend';
      
      if (verifyToken !== expectedToken) {
        console.error('[Webhook-Final] Token de verificação inválido:', verifyToken);
        return res.status(403).send('Forbidden');
      }
      
      console.log('[Webhook-Final] Token de verificação válido (GET)');
      return res.status(200).send(req.query['hub.challenge']);
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('[Webhook-Final] Erro na verificação GET:', error.message);
    return res.status(500).send('Internal Server Error');
  }
});

// Webhook para receber mensagens do WhatsApp
router.post('/whatsapp-meta', async (req, res) => {
  try {
    console.log('🚨 [Webhook-Final] WEBHOOK FINAL CHAMADO!');
    console.log('[Webhook-Final] Mensagem recebida:', {
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    // Verificar se é um desafio de verificação
    if (req.body.mode === 'subscribe' && req.body['hub.challenge']) {
      console.log('[Webhook-Final] Respondendo ao desafio de verificação');
      
      // Verificar o token de verificação
      const verifyToken = req.body['hub.verify_token'];
      const expectedToken = process.env.WEBHOOK_VERIFY_TOKEN || 'atendeai-lify-backend';
      
      if (verifyToken !== expectedToken) {
        console.error('[Webhook-Final] Token de verificação inválido:', verifyToken);
        return res.status(403).send('Forbidden');
      }
      
      console.log('[Webhook-Final] Token de verificação válido');
      return res.status(200).send(req.body['hub.challenge']);
    }

    // Processar mensagens
    console.log('🚨 [Webhook-Final] Verificando estrutura:', {
      hasEntry: !!req.body.entry,
      entryLength: req.body.entry?.length || 0,
      bodyKeys: Object.keys(req.body)
    });
    
    if (req.body.entry && req.body.entry.length > 0) {
      const webhookData = req.body;
      
      console.log('[Webhook-Final] Estrutura do webhook:', JSON.stringify(webhookData, null, 2));
      
      // Configuração do WhatsApp
      const whatsappConfig = {
        accessToken: process.env.WHATSAPP_META_ACCESS_TOKEN,
        phoneNumberId: process.env.WHATSAPP_META_PHONE_NUMBER_ID
      };

      console.log('[Webhook-Final] Configuração WhatsApp:', {
        hasAccessToken: !!whatsappConfig.accessToken,
        hasPhoneNumberId: !!whatsappConfig.phoneNumberId
      });

      // Processar com TODAS AS FUNCIONALIDADES
      const result = await processWhatsAppWebhookFinal(
        webhookData,
        whatsappConfig
      );

      if (result.success) {
        console.log('[Webhook-Final] Processamento concluído com sucesso');
        return res.status(200).json({ 
          success: true, 
          message: 'Webhook processado com TODAS as funcionalidades',
          processed: result.processed
        });
      } else {
        console.error('[Webhook-Final] Erro no processamento:', result.error);
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
    console.error('[Webhook-Final] Erro geral:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Processa webhook com TODAS as funcionalidades
 */
async function processWhatsAppWebhookFinal(webhookData, whatsappConfig) {
  try {
    console.log('🚨 [Webhook-Final] FUNÇÃO CHAMADA!');
    console.log('🚨 [Webhook-Final] webhookData:', JSON.stringify(webhookData, null, 2));
    
    const processed = [];

    console.log('[Webhook-Final] Processando entries:', webhookData.entry?.length || 0);
    
    for (const entry of webhookData.entry) {
      console.log('[Webhook-Final] Processando entry:', entry.id);
      
      for (const change of entry.changes) {
        console.log('[Webhook-Final] Processando change:', change.field);
        
        console.log('[Webhook-Final] Verificando mensagens em change.value:', {
          hasMessages: !!change.value.messages,
          messagesLength: change.value.messages?.length || 0,
          changeValueKeys: Object.keys(change.value || {})
        });
        
        if (change.value.messages && change.value.messages.length > 0) {
          console.log('[Webhook-Final] Encontradas mensagens:', change.value.messages.length);
          for (const message of change.value.messages) {
            console.log('[Webhook-Final] Processando mensagem:', {
              from: message.from,
              messageType: message.type,
              timestamp: message.timestamp
            });

            // Extrair texto da mensagem
            const messageText = message.text?.body || '';
            
            if (!messageText) {
              console.log('[Webhook-Final] Mensagem sem texto, ignorando');
              continue;
            }

            // 1. VERIFICAR MODO DE SIMULAÇÃO DA CLÍNICA
            console.log('[Webhook-Final] Verificando modo de simulação...');
            const simulationCheck = await checkSimulationMode(
              message.to || whatsappConfig.phoneNumberId
            );

            if (simulationCheck.isSimulationMode) {
              console.log('🎭 [Webhook-Final] CLÍNICA EM MODO SIMULAÇÃO!');
              simulationMode = true;
              
              // Processar em modo simulação (não enviar para WhatsApp)
              const simulationResult = await processSimulationMode(
                messageText,
                message.from,
                message.to || whatsappConfig.phoneNumberId,
                simulationCheck.clinicId,
                simulationCheck.clinicName,
                message.id // Adicionar message.id
              );

              processed.push({
                phoneNumber: message.from,
                message: messageText,
                response: simulationResult.response,
                conversationId: simulationResult.conversationId,
                intent: simulationResult.intent,
                confidence: simulationResult.confidence,
                simulationMode: true,
                clinicName: simulationCheck.clinicName
              });
            } else {
              console.log('🚀 [Webhook-Final] CLÍNICA EM MODO PRODUÇÃO!');
              
              // Processar normalmente (enviar para WhatsApp)
              const productionResult = await processProductionMode(
                messageText,
                message.from,
                message.to || whatsappConfig.phoneNumberId,
                whatsappConfig,
                message.id // Adicionar message.id
              );

              processed.push({
                phoneNumber: message.from,
                message: messageText,
                response: productionResult.response,
                conversationId: productionResult.conversationId,
                intent: productionResult.intent,
                confidence: productionResult.confidence,
                simulationMode: false
              });
            }
          }
        }
      }
    }

    return { success: true, processed };

  } catch (error) {
    console.error('[Webhook-Final] Erro no processamento:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Salva conversa no banco de dados
 */
async function saveConversationToDatabase(fromNumber, toNumber, content, whatsappMessageId, clinicId = null) {
  try {
    console.log('[Webhook-Final] Salvando conversa:', { fromNumber, toNumber, content });
    
    // 1. Identificar clínica pelo número que recebeu (se não foi passado)
    if (!clinicId) {
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinic_whatsapp_numbers')
        .select('clinic_id')
        .eq('whatsapp_number', toNumber)
        .eq('is_active', true)
        .single();

      if (clinicError || !clinicData) {
        console.error('[Webhook-Final] Clínica não encontrada para o número:', toNumber);
        return null;
      }

      clinicId = clinicData.clinic_id;
    }

    // 2. Verificar se já existe uma conversa
    const { data: existingConversation, error: findError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('patient_phone_number', fromNumber)
      .eq('clinic_whatsapp_number', toNumber)
      .single();

    let conversationId;

    if (existingConversation) {
      // Conversa já existe, usar o ID existente
      conversationId = existingConversation.id;
      console.log('[Webhook-Final] Conversa existente encontrada, ID:', conversationId);
    } else {
      // Criar nova conversa
      const { data: newConversation, error: createError } = await supabase
        .from('whatsapp_conversations_improved')
        .insert({
          clinic_id: clinicId,
          patient_phone_number: fromNumber,
          clinic_whatsapp_number: toNumber,
          last_message_preview: content,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('[Webhook-Final] Erro ao criar conversa:', createError);
        return null;
      }

      conversationId = newConversation.id;
      console.log('[Webhook-Final] Nova conversa criada, ID:', conversationId);
    }

    // 2. Salvar a mensagem
    const { data: messageResult, error: messageError } = await supabase
      .from('whatsapp_messages_improved')
      .insert({
        conversation_id: conversationId,
        sender_phone: fromNumber,
        receiver_phone: toNumber,
        content: content,
        message_type: 'received',
        whatsapp_message_id: whatsappMessageId
      })
      .select()
      .single();

    if (messageError) {
      console.error('[Webhook-Final] Erro ao salvar mensagem:', messageError);
      return null;
    }

    console.log('[Webhook-Final] Mensagem salva com sucesso, ID:', messageResult.id);
    return conversationId;

  } catch (error) {
    console.error('[Webhook-Final] Erro ao salvar conversa:', error);
    return null;
  }
}

/**
 * Salva resposta no banco de dados
 */
async function saveResponseToDatabase(conversationId, fromNumber, toNumber, content, messageType, whatsappMessageId) {
  try {
    console.log('[Webhook-Final] Salvando resposta:', { conversationId, content });
    
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
      console.error('[Webhook-Final] Erro ao salvar resposta:', error);
      return null;
    }

    console.log('[Webhook-Final] Resposta salva com sucesso, ID:', result.id);
    return result.id;

  } catch (error) {
    console.error('[Webhook-Final] Erro ao salvar resposta:', error);
    return null;
  }
}

/**
 * Processa mensagem com contextualização completa e agendamento
 */
async function processMessageWithCompleteContext(messageText, phoneNumber, config) {
  try {
    console.log('🤖 [Webhook-Final] Gerando resposta inteligente COMPLETA', { 
      phoneNumber, 
      messageLength: messageText.length 
    });

    // Sistema de agendamento via WhatsApp será implementado em versão futura
    // Por enquanto, usamos apenas o LLMOrchestrator para todas as mensagens
    const { LLMOrchestratorService } = await import('../services/llmOrchestratorService.js');
    
    const request = {
      phoneNumber: phoneNumber,
      message: messageText,
      conversationId: `whatsapp-${phoneNumber}-${Date.now()}`,
      userId: phoneNumber
    };

    console.log('[Webhook-Final] Chamando LLMOrchestratorService...');
    const response = await LLMOrchestratorService.processMessage(request);

    console.log('✅ [Webhook-Final] Resposta gerada:', {
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
    console.error('💥 [Webhook-Final] Erro ao gerar resposta:', error);
    return {
      success: false,
      response: 'Desculpe, estou com dificuldades técnicas no momento. Por favor, entre em contato pelo telefone.',
      error: error.message
    };
  }
}

/**
 * Envia resposta processada via WhatsApp
 */
async function sendAIResponseViaWhatsApp(to, aiResponse, config) {
  try {
    const { accessToken, phoneNumberId } = config;
    
    // Preparar mensagem com informações dos Serviços Robustos
    let messageText = aiResponse.response;
    
    // Adicionar informações de confiança se baixa
    if (aiResponse.confidence < 0.7) {
      messageText += '\n\n💡 Nota: Esta resposta foi gerada com confiança moderada. Para informações mais precisas, consulte um profissional de saúde.';
    }

    // Enviar via API Meta
    const response = await sendWhatsAppTextMessage({
      accessToken,
      phoneNumberId,
      to,
      text: messageText
    });

    console.log('[Webhook-Final] Mensagem enviada via WhatsApp:', {
      to,
      messageLength: messageText.length,
      confidence: aiResponse.confidence,
      intent: aiResponse.intent
    });

  } catch (error) {
    console.error('[Webhook-Final] Erro ao enviar mensagem:', error);
  }
}

/**
 * Verifica se a clínica está em modo simulação
 */
async function checkSimulationMode(whatsappNumber) {
  try {
    console.log('[Webhook-Final] Verificando simulação para número:', whatsappNumber);
    
    // Buscar clínica pelo número do WhatsApp
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .select('id, name, simulation_mode, whatsapp_phone')
      .eq('whatsapp_phone', whatsappNumber)
      .single();

    if (clinicError || !clinicData) {
      console.log('[Webhook-Final] Clínica não encontrada para o número:', whatsappNumber);
      return {
        isSimulationMode: false,
        clinicId: null,
        clinicName: null
      };
    }

    console.log('[Webhook-Final] Clínica encontrada:', {
      id: clinicData.id,
      name: clinicData.name,
      simulationMode: clinicData.simulation_mode
    });

    return {
      isSimulationMode: clinicData.simulation_mode || false,
      clinicId: clinicData.id,
      clinicName: clinicData.name
    };

  } catch (error) {
    console.error('[Webhook-Final] Erro ao verificar simulação:', error);
    return {
      isSimulationMode: false,
      clinicId: null,
      clinicName: null
    };
  }
}

/**
 * Processa mensagem em modo simulação (não envia para WhatsApp)
 */
async function processSimulationMode(messageText, fromNumber, toNumber, clinicId, clinicName, whatsappMessageId) {
  try {
    console.log('🎭 [Webhook-Final] Processando em modo simulação:', {
      fromNumber,
      toNumber,
      clinicId,
      clinicName
    });

          // 1. SALVAR CONVERSA NO BANCO DE DADOS
      console.log('[Webhook-Final] Salvando conversa no banco...');
      const conversationId = await saveConversationToDatabase(
        fromNumber,
        toNumber,
        messageText,
        whatsappMessageId, // Usar o ID real do WhatsApp
        clinicId
      );

    if (conversationId) {
      console.log('[Webhook-Final] Conversa salva com ID:', conversationId);
    }

    // 2. Processar com IA (mesmo que produção)
    const aiResult = await processMessageWithCompleteContext(
      messageText, 
      fromNumber, 
      { accessToken: null, phoneNumberId: null } // Não usar config real
    );

    if (aiResult.success) {
      // 3. SALVAR RESPOSTA NO BANCO DE DADOS (mas não enviar para WhatsApp)
      console.log('[Webhook-Final] Salvando resposta simulada no banco...');
      await saveResponseToDatabase(
        conversationId,
        fromNumber,
        toNumber,
        aiResult.response,
        'simulated', // Tipo especial para simulação
        null
      );

      console.log('🎭 [Webhook-Final] Resposta simulada salva (NÃO enviada para WhatsApp):', {
        response: aiResult.response,
        intent: aiResult.intent,
        confidence: aiResult.confidence
      });

      return {
        response: aiResult.response,
        conversationId: conversationId,
        intent: aiResult.intent,
        confidence: aiResult.confidence
      };
    }

    return {
      response: 'Desculpe, estou com dificuldades técnicas no momento.',
      conversationId: conversationId,
      intent: null,
      confidence: 0
    };

  } catch (error) {
    console.error('[Webhook-Final] Erro no modo simulação:', error);
    return {
      response: 'Desculpe, estou com dificuldades técnicas no momento.',
      conversationId: null,
      intent: null,
      confidence: 0
    };
  }
}

/**
 * Processa mensagem em modo produção (envia para WhatsApp)
 */
async function processProductionMode(messageText, fromNumber, toNumber, config, whatsappMessageId) {
  try {
    console.log('🚀 [Webhook-Final] Processando em modo produção:', {
      fromNumber,
      toNumber,
      whatsappMessageId
    });

    // 1. SALVAR CONVERSA NO BANCO DE DADOS
    console.log('[Webhook-Final] Salvando conversa no banco...');
    const conversationId = await saveConversationToDatabase(
      fromNumber,
      toNumber,
      messageText,
      whatsappMessageId, // Usar o ID real do WhatsApp
      null // clinicId será encontrado automaticamente
    );

    if (conversationId) {
      console.log('[Webhook-Final] Conversa salva com ID:', conversationId);
    }

    // 2. Processar com IA
    const aiResult = await processMessageWithCompleteContext(
      messageText, 
      fromNumber, 
      config
    );

    if (aiResult.success) {
      // 3. SALVAR RESPOSTA NO BANCO DE DADOS
      console.log('[Webhook-Final] Salvando resposta no banco...');
      await saveResponseToDatabase(
        conversationId,
        fromNumber,
        toNumber,
        aiResult.response,
        'sent',
        null
      );

      // 4. Enviar resposta via WhatsApp
      await sendAIResponseViaWhatsApp(
        fromNumber, 
        aiResult, 
        config
      );

      return {
        response: aiResult.response,
        conversationId: conversationId,
        intent: aiResult.intent,
        confidence: aiResult.confidence
      };
    }

    return {
      response: 'Desculpe, estou com dificuldades técnicas no momento.',
      conversationId: conversationId,
      intent: null,
      confidence: 0
    };

  } catch (error) {
    console.error('[Webhook-Final] Erro no modo produção:', error);
    return {
      response: 'Desculpe, estou com dificuldades técnicas no momento.',
      conversationId: null,
      intent: null,
      confidence: 0
    };
  }
}

export { processWhatsAppWebhookFinal };
export default router; 