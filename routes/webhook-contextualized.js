
// ========================================
// WEBHOOK COM CONTEXTUALIZAÇÃO COMPLETA
// ========================================

import express from 'express';
import { sendWhatsAppTextMessage } from '../services/whatsappMetaService.js';
import ClinicContextService from '../src/services/clinicContextService.js';
import { EnhancedAIService } from '../src/services/ai/enhancedAIService.js';

const router = express.Router();

// Webhook para verificação (GET) e receber mensagens (POST)
router.get('/whatsapp-meta', async (req, res) => {
  try {
    console.log('[Webhook-Contextualizado] Verificação GET recebida:', {
      query: req.query,
      headers: req.headers
    });

    // Verificar se é um desafio de verificação
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.challenge']) {
      console.log('[Webhook-Contextualizado] Respondendo ao desafio de verificação GET');
      
      // Verificar o token de verificação
      const verifyToken = req.query['hub.verify_token'];
      const expectedToken = process.env.WEBHOOK_VERIFY_TOKEN || 'atendeai-lify-backend';
      
      if (verifyToken !== expectedToken) {
        console.error('[Webhook-Contextualizado] Token de verificação inválido:', verifyToken);
        return res.status(403).send('Forbidden');
      }
      
      console.log('[Webhook-Contextualizado] Token de verificação válido (GET)');
      return res.status(200).send(req.query['hub.challenge']);
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('[Webhook-Contextualizado] Erro na verificação GET:', error.message);
    return res.status(500).send('Internal Server Error');
  }
});

// Webhook para receber mensagens do WhatsApp
router.post('/whatsapp-meta', async (req, res) => {
  try {
    console.log('🚨 [Webhook-Contextualizado] WEBHOOK CHAMADO!');
    console.log('[Webhook-Contextualizado] Mensagem recebida:', {
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    // Verificar se é um desafio de verificação
    if (req.body.mode === 'subscribe' && req.body['hub.challenge']) {
      console.log('[Webhook-Contextualizado] Respondendo ao desafio de verificação');
      
      // Verificar o token de verificação
      const verifyToken = req.body['hub.verify_token'];
      const expectedToken = process.env.WEBHOOK_VERIFY_TOKEN || 'atendeai-lify-backend';
      
      if (verifyToken !== expectedToken) {
        console.error('[Webhook-Contextualizado] Token de verificação inválido:', verifyToken);
        return res.status(403).send('Forbidden');
      }
      
      console.log('[Webhook-Contextualizado] Token de verificação válido');
      return res.status(200).send(req.body['hub.challenge']);
    }

    // Processar mensagens
    console.log('🚨 [Webhook-Contextualizado] Verificando estrutura:', {
      hasEntry: !!req.body.entry,
      entryLength: req.body.entry?.length || 0,
      bodyKeys: Object.keys(req.body)
    });
    
    if (req.body.entry && req.body.entry.length > 0) {
      const webhookData = req.body;
      
      console.log('[Webhook-Contextualizado] Estrutura do webhook:', JSON.stringify(webhookData, null, 2));
      
      // Configuração do WhatsApp
      const whatsappConfig = {
        accessToken: process.env.WHATSAPP_META_ACCESS_TOKEN,
        phoneNumberId: process.env.WHATSAPP_META_PHONE_NUMBER_ID
      };

      console.log('[Webhook-Contextualizado] Configuração WhatsApp:', {
        hasAccessToken: !!whatsappConfig.accessToken,
        hasPhoneNumberId: !!whatsappConfig.phoneNumberId
      });

      // Processar com CONTEXTUALIZAÇÃO COMPLETA
      const result = await processWhatsAppWebhookWithContext(
        webhookData,
        whatsappConfig
      );

      if (result.success) {
        console.log('[Webhook-Contextualizado] Processamento concluído com sucesso');
        return res.status(200).json({ 
          success: true, 
          message: 'Webhook processado com Contextualização Completa',
          processed: result.processed
        });
      } else {
        console.error('[Webhook-Contextualizado] Erro no processamento:', result.error);
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
    console.error('[Webhook-Contextualizado] Erro geral:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Processa webhook com contextualização completa
 */
async function processWhatsAppWebhookWithContext(webhookData, whatsappConfig) {
  try {
    console.log('🚨 [Webhook-Contextualizado] FUNÇÃO CHAMADA!');
    console.log('🚨 [Webhook-Contextualizado] webhookData:', JSON.stringify(webhookData, null, 2));
    
    const processed = [];

    console.log('[Webhook-Contextualizado] Processando entries:', webhookData.entry?.length || 0);
    
    for (const entry of webhookData.entry) {
      console.log('[Webhook-Contextualizado] Processando entry:', entry.id);
      
      for (const change of entry.changes) {
        console.log('[Webhook-Contextualizado] Processando change:', change.field);
        
        console.log('[Webhook-Contextualizado] Verificando mensagens em change.value:', {
          hasMessages: !!change.value.messages,
          messagesLength: change.value.messages?.length || 0,
          changeValueKeys: Object.keys(change.value || {})
        });
        
        if (change.value.messages && change.value.messages.length > 0) {
          console.log('[Webhook-Contextualizado] Encontradas mensagens:', change.value.messages.length);
          for (const message of change.value.messages) {
            console.log('[Webhook-Contextualizado] Processando mensagem:', {
              from: message.from,
              messageType: message.type,
              timestamp: message.timestamp
            });

            // Extrair texto da mensagem
            const messageText = message.text?.body || '';
            
            if (!messageText) {
              console.log('[Webhook-Contextualizado] Mensagem sem texto, ignorando');
              continue;
            }

            // Processar com contextualização completa
            const aiResult = await processMessageWithCompleteContext(
              messageText, 
              message.from, 
              whatsappConfig
            );

            if (aiResult.success) {
              // Enviar resposta via WhatsApp
              await sendAIResponseViaWhatsApp(
                message.from, 
                aiResult, 
                whatsappConfig
              );

              processed.push({
                phoneNumber: message.from,
                message: messageText,
                response: aiResult.response,
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
    console.error('[Webhook-Contextualizado] Erro no processamento:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Processa mensagem com contextualização completa
 */
async function processMessageWithCompleteContext(messageText, phoneNumber, config) {
  try {
    console.log('🤖 [Contextualizado] Gerando resposta inteligente COMPLETA', { 
      phoneNumber, 
      messageLength: messageText.length 
    });

    // 1. Buscar clínica com dados completos
    const clinic = await ClinicContextService.getClinicByWhatsAppNumber(phoneNumber);
    let systemPrompt;
    let contextualization = null;

    if (clinic) {
      console.log('🏥 [Contextualizado] Clínica encontrada com dados completos', { 
        clinicId: clinic._id,
        clinicName: clinic.clinica?.informacoes_basicas?.nome,
        doctorsCount: clinic.profissionais?.length || 0,
        servicesCount: (clinic.servicos?.consultas?.length || 0) + (clinic.servicos?.exames?.length || 0)
      });
      
      // 2. Usar dados COMPLETOS da clínica
      contextualization = {
        clinicId: clinic._id,
        clinicName: clinic.clinica?.informacoes_basicas?.nome,
        specialty: clinic.clinica?.informacoes_basicas?.especialidade_principal,
        doctors: clinic.profissionais,
        schedule: clinic.clinica?.horario_funcionamento,
        services: clinic.servicos,
        location: clinic.clinica?.localizacao,
        contact: clinic.clinica?.contatos,
        policies: clinic.politicas,
        assistant: clinic.agente_ia
      };
      
      systemPrompt = ClinicContextService.generateSystemPromptFromContext(clinic);
      
    } else {
      console.log('⚠️ [Contextualizado] Clínica não encontrada - usando prompt padrão', { phoneNumber });
      systemPrompt = `Você é Dr. Carlos, assistente virtual do AtendeAí.
          Seja acolhedor, profissional e útil. Use emojis ocasionalmente.
          Para informações específicas, oriente a entrar em contato pelo telefone.
          Para agendamentos, oriente a entrar em contato diretamente.
          NUNCA dê conselhos médicos - apenas informações gerais.`;
    }

    console.log('📝 [Contextualizado] Prompt gerado', {
      phoneNumber,
      promptLength: systemPrompt.length,
      hasClinicData: !!clinic
    });

    // 3. Processar com sistema avançado
    const enhancedAI = new EnhancedAIService();
    const aiResult = await enhancedAI.processMessage(
      messageText,
      phoneNumber,
      clinic?.id || 'default',
      {
        systemPrompt: systemPrompt,
        clinicContext: contextualization,
        enableRAG: true,
        enableMemory: true,
        enablePersonalization: true,
        enableIntentRecognition: true
      }
    );

    console.log('✅ [Contextualizado] Resposta gerada com contexto completo', {
      success: aiResult.success,
      hasResponse: !!aiResult.response,
      responseLength: aiResult.response?.length || 0,
      intent: aiResult.intent,
      confidence: aiResult.confidence,
      error: aiResult.error
    });

    return aiResult;

  } catch (error) {
    console.error('💥 [Contextualizado] Erro ao gerar resposta inteligente:', error);
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

    console.log('[Contextualizado] Mensagem enviada via WhatsApp:', {
      to,
      messageLength: messageText.length,
      confidence: aiResponse.confidence,
      intent: aiResponse.intent
    });

  } catch (error) {
    console.error('[Contextualizado] Erro ao enviar mensagem:', error);
  }
}

export { processWhatsAppWebhookWithContext };
export default router;
