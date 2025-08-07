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

            // CORREÇÃO CRÍTICA: Extrair número de destino corretamente
            // Usar display_phone_number (número real) em vez de phone_number_id (ID interno)
            const toNumber = change.value.metadata?.display_phone_number || whatsappConfig.phoneNumberId;
            console.log('[Webhook-Final] Número de destino extraído:', toNumber);
            
            // 1. VERIFICAR MODO DE SIMULAÇÃO
            const { data: clinicData, error: clinicError } = await supabase
              .from('clinic_whatsapp_numbers')
              .select('clinic_id')
              .eq('whatsapp_number', toNumber)
              .eq('is_active', true)
              .single();

            if (clinicError || !clinicData) {
              console.error('[Webhook-Final] Clínica não encontrada para o número:', toNumber);
              continue;
            }

            const clinicId = clinicData.clinic_id;
            const isSimulationMode = await checkClinicSimulationMode(clinicId);

            if (isSimulationMode) {
              console.log('[Webhook-Final] Clínica em modo simulação, processando com SimulationMessageService');
              
              // Importar e usar o serviço de simulação
              const { SimulationMessageService } = await import('../services/simulationMessageService.js');
              
              const simulationResult = await SimulationMessageService.processSimulationMessage(
                message.from,
                toNumber,
                messageText,
                clinicId
              );

              if (simulationResult.success) {
                processed.push({
                  phoneNumber: message.from,
                  message: messageText,
                  response: simulationResult.response,
                  conversationId: simulationResult.conversationId,
                  intent: simulationResult.intent,
                  confidence: simulationResult.confidence,
                  simulationMode: true
                });
              }
              
              continue; // Pular processamento normal
            }

            // 2. PROCESSAMENTO NORMAL (modo produção)
            console.log('[Webhook-Final] Clínica em modo produção, processando normalmente');
            
            const conversationId = await saveConversationToDatabase(
              message.from,
              toNumber,
              messageText,
              message.id
            );

            if (conversationId) {
              console.log('[Webhook-Final] Conversa salva com ID:', conversationId);
            } else {
              console.error('[Webhook-Final] Falha ao salvar conversa, mas continuando processamento');
            }

            // 3. Processar com CONTEXTUALIZAÇÃO COMPLETA
            const aiResult = await processMessageWithCompleteContext(
              messageText, 
              message.from, 
              whatsappConfig
            );

            if (aiResult.success) {
              // 4. SALVAR RESPOSTA NO BANCO DE DADOS
              console.log('[Webhook-Final] Salvando resposta no banco...');
              console.log('[Webhook-Final] Parâmetros da resposta:', {
                conversationId,
                senderPhone: toNumber, // Número do chatbot (quem ENVIA)
                receiverPhone: message.from, // Número do paciente (quem RECEBE)
                content: aiResult.response
              });
              await saveResponseToDatabase(
                conversationId,
                toNumber, // Número do chatbot (quem ENVIA)
                message.from, // Número do paciente (quem RECEBE)
                aiResult.response,
                'sent',
                null
              );

              // 5. Enviar resposta via WhatsApp
              const sendResult = await sendAIResponseViaWhatsApp(
                message.from, 
                aiResult, 
                whatsappConfig,
                clinicId
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
    console.error('[Webhook-Final] Erro no processamento:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Salva conversa no banco de dados
 */
async function saveConversationToDatabase(fromNumber, toNumber, content, whatsappMessageId) {
  try {
    console.log('[Webhook-Final] Salvando conversa:', { fromNumber, toNumber, content });
    
    // Primeiro, encontrar a clínica pelo número do WhatsApp
    const { data: clinicData, error: clinicError } = await supabase
      .from('whatsapp_connections')
      .select('clinic_id')
      .eq('phone_number', toNumber)
      .eq('is_active', true)
      .single();

    if (clinicError || !clinicData) {
      console.error('[Webhook-Final] Clínica não encontrada para o número:', toNumber);
      return null;
    }

    const clinicId = clinicData.clinic_id;

    // Criar ou atualizar conversa
    const { data: conversationData, error: conversationError } = await supabase
      .from('whatsapp_conversations_improved')
      .upsert({
        clinic_id: clinicId,
        patient_phone_number: fromNumber,
        clinic_whatsapp_number: toNumber,
        last_message_preview: content,
        unread_count: 1,
        last_message_at: new Date().toISOString()
      }, {
        onConflict: 'clinic_id,patient_phone_number,clinic_whatsapp_number',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (conversationError) {
      console.error('[Webhook-Final] Erro ao criar/atualizar conversa:', conversationError);
      return null;
    }

    // Salvar mensagem recebida
    const { data: messageData, error: messageError } = await supabase
      .from('whatsapp_messages_improved')
      .insert({
        conversation_id: conversationData.id,
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

    console.log('[Webhook-Final] Conversa salva com sucesso:', {
      conversationId: conversationData.id,
      messageId: messageData.id
    });

    return conversationData.id;

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

    // 1. Primeiro, detectar intenção usando LLMOrchestrator
    const { LLMOrchestratorService } = await import('../services/llmOrchestratorService.js');
    
    const request = {
      phoneNumber: phoneNumber,
      message: messageText,
      conversationId: `whatsapp-${phoneNumber}-${Date.now()}`,
      userId: phoneNumber
    };

    console.log('[Webhook-Final] Chamando LLMOrchestratorService para detecção de intenção...');
    const llmResponse = await LLMOrchestratorService.processMessage(request);

    console.log('✅ [Webhook-Final] Intenção detectada:', {
      intent: llmResponse.intent?.name,
      confidence: llmResponse.intent?.confidence
    });

    // 2. Verificar se é intenção de agendamento
    if (llmResponse.intent?.name?.startsWith('APPOINTMENT_')) {
      console.log('📅 [Webhook-Final] Intenção de agendamento detectada, iniciando fluxo de agendamento...');
      
      try {
        // Buscar clínica pelo número do WhatsApp
        const { data: clinicData, error: clinicError } = await supabase
          .from('whatsapp_connections')
          .select('clinic_id')
          .eq('phone_number', config.phoneNumberId || process.env.WHATSAPP_META_PHONE_NUMBER_ID)
          .eq('is_active', true)
          .single();

        if (clinicError || !clinicData) {
          console.error('[Webhook-Final] Clínica não encontrada para agendamento');
          return {
            success: true,
            response: 'Desculpe, não consegui identificar a clínica. Por favor, entre em contato diretamente.',
            intent: llmResponse.intent,
            confidence: llmResponse.intent?.confidence || 0.8
          };
        }

        const clinicId = clinicData.clinic_id;
        console.log('[Webhook-Final] Clínica encontrada para agendamento:', clinicId);

        // Importar e usar AppointmentConversationService
        const { AppointmentConversationService } = await import('../services/appointmentConversationService.js');
        
        const appointmentResult = await AppointmentConversationService.processMessage(
          messageText,
          phoneNumber,
          clinicId
        );

        console.log('✅ [Webhook-Final] Resposta do agendamento gerada:', {
          response: appointmentResult.message,
          step: appointmentResult.nextStep,
          requiresInput: appointmentResult.requiresInput
        });

        return {
          success: true,
          response: appointmentResult.message,
          intent: llmResponse.intent,
          confidence: llmResponse.intent?.confidence || 0.8,
          appointmentStep: appointmentResult.nextStep,
          requiresAction: appointmentResult.requiresInput
        };

      } catch (appointmentError) {
        console.error('💥 [Webhook-Final] Erro no processamento de agendamento:', appointmentError);
        
        // Fallback para resposta genérica de agendamento
        return {
          success: true,
          response: 'Entendi que você quer agendar uma consulta! Por favor, me informe:\n\n' +
                   '📝 Seu nome completo\n' +
                   '📞 Seu telefone (se diferente deste)\n' +
                   '🏥 Qual especialidade você precisa\n' +
                   '📅 Qual data você prefere',
          intent: llmResponse.intent,
          confidence: llmResponse.intent?.confidence || 0.8
        };
      }
    }

    // 3. Para outras intenções, usar resposta normal do LLMOrchestrator
    console.log('✅ [Webhook-Final] Resposta normal gerada:', {
      response: llmResponse.response,
      intent: llmResponse.intent?.name,
      confidence: llmResponse.intent?.confidence
    });

    return {
      success: true,
      response: llmResponse.response,
      intent: llmResponse.intent,
      confidence: llmResponse.intent?.confidence || 0.8
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
 * Formata mensagem para WhatsApp
 */
function formatMessageForWhatsApp(message) {
  if (!message) return message;
  
  // Converter **texto** para *texto* (negrito do WhatsApp)
  let formatted = message.replace(/\*\*(.*?)\*\*/g, '*$1*');
  
  // Garantir que parágrafos sejam separados corretamente
  formatted = formatted.replace(/\n\n+/g, '\n\n');
  
  // Adicionar quebra de linha antes de listas
  formatted = formatted.replace(/(\n)(\d+\.)/g, '\n\n$2');
  
  // Garantir que não há espaços extras no início/fim
  formatted = formatted.trim();
  
  return formatted;
}

/**
 * Envia resposta processada via WhatsApp
 */
async function sendAIResponseViaWhatsApp(to, aiResponse, config, clinicId = null) {
  try {
    const { accessToken, phoneNumberId } = config;
    
    // Verificar modo de simulação se clinicId for fornecido
    if (clinicId) {
      const isSimulationMode = await checkClinicSimulationMode(clinicId);
      if (isSimulationMode) {
        console.log('[Webhook-Final] Clínica em modo simulação, NÃO enviando mensagem via WhatsApp');
        console.log('[Webhook-Final] Resposta seria:', aiResponse.response);
        return {
          success: true,
          simulationMode: true,
          message: 'Mensagem processada em modo simulação (não enviada)'
        };
      }
    }
    
    // Preparar mensagem com informações dos Serviços Robustos
    let messageText = aiResponse.response;
    
    // Formatar mensagem para WhatsApp
    messageText = formatMessageForWhatsApp(messageText);
    
    // NOTA: Removida a exibição de confiança para o usuário final
    // As informações de confiança são apenas para controle interno do sistema

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

    return {
      success: true,
      simulationMode: false,
      message: 'Mensagem enviada via WhatsApp'
    };

  } catch (error) {
    console.error('[Webhook-Final] Erro ao enviar mensagem:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verifica se a clínica está em modo simulação
 */
async function checkClinicSimulationMode(clinicId) {
  try {
    console.log('[Webhook-Final] Verificando modo simulação para clínica:', clinicId);
    
    const { data: clinicData, error } = await supabase
      .from('clinics')
      .select('simulation_mode')
      .eq('id', clinicId)
      .single();

    if (error) {
      console.error('[Webhook-Final] Erro ao verificar modo simulação:', error);
      return false; // Por segurança, assume modo produção
    }

    const isSimulationMode = clinicData?.simulation_mode || false;
    console.log('[Webhook-Final] Modo simulação:', isSimulationMode);
    
    return isSimulationMode;

  } catch (error) {
    console.error('[Webhook-Final] Erro ao verificar modo simulação:', error);
    return false; // Por segurança, assume modo produção
  }
}

export { processWhatsAppWebhookFinal };
export default router; 