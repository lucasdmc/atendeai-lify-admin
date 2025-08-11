// ========================================
// SERVIÇO DE PROCESSAMENTO DE MENSAGENS EM SIMULAÇÃO
// ========================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

export class SimulationMessageService {
  /**
   * Processa uma mensagem em modo simulação
   * @param {string} fromNumber - Número do remetente
   * @param {string} toNumber - Número do destinatário (WhatsApp da clínica)
   * @param {string} messageText - Texto da mensagem
   * @param {string} clinicId - ID da clínica
   */
  static async processSimulationMessage(fromNumber, toNumber, messageText, clinicId) {
    try {
      console.log('🎭 [SimulationMessageService] Processando mensagem em simulação:', {
        fromNumber,
        toNumber,
        messageText,
        clinicId
      });

      // 1. Salvar mensagem recebida em modo simulação
      const conversationId = await this.saveSimulationConversation(fromNumber, toNumber, messageText, clinicId);
      
      if (!conversationId) {
        console.error('[SimulationMessageService] Falha ao salvar conversa de simulação');
        return { success: false, error: 'Falha ao salvar conversa' };
      }

      // 2. Processar com IA (mesmo processo do modo produção)
      const { LLMOrchestratorService } = await import('./llmOrchestratorService.js');
      
      const request = {
        phoneNumber: fromNumber,
        message: messageText,
        conversationId: `simulation-${fromNumber}-${Date.now()}`,
        userId: fromNumber
      };

      console.log('[SimulationMessageService] Chamando LLMOrchestratorService...');
      const aiResponse = await LLMOrchestratorService.processMessage(request);

      // 3. Salvar resposta simulada (não enviada)
      await this.saveSimulationResponse(conversationId, toNumber, fromNumber, aiResponse.response, clinicId);

      console.log('✅ [SimulationMessageService] Mensagem processada em simulação:', {
        conversationId,
        response: aiResponse.response,
        intent: aiResponse.intent?.name,
        confidence: aiResponse.intent?.confidence
      });

      return {
        success: true,
        conversationId,
        response: aiResponse.response,
        intent: aiResponse.intent,
        confidence: aiResponse.intent?.confidence || 0.8,
        simulationMode: true
      };

    } catch (error) {
      console.error('❌ [SimulationMessageService] Erro ao processar mensagem de simulação:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Salva conversa em modo simulação
   */
  static async saveSimulationConversation(fromNumber, toNumber, content, clinicId) {
    try {
      console.log('[SimulationMessageService] Salvando conversa de simulação:', { fromNumber, toNumber, content });
      
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
        console.error('[SimulationMessageService] Erro ao criar/atualizar conversa de simulação:', conversationError);
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
          whatsapp_message_id: `simulation-${Date.now()}`
        })
        .select()
        .single();

      if (messageError) {
        console.error('[SimulationMessageService] Erro ao salvar mensagem de simulação:', messageError);
        return null;
      }

      console.log('[SimulationMessageService] Conversa de simulação salva com sucesso, ID:', conversationData.id);
      return conversationData.id;

    } catch (error) {
      console.error('[SimulationMessageService] Erro ao salvar conversa de simulação:', error);
      return null;
    }
  }

  /**
   * Salva resposta simulada (não enviada)
   */
  static async saveSimulationResponse(conversationId, fromNumber, toNumber, content, clinicId) {
    try {
      console.log('[SimulationMessageService] Salvando resposta simulada:', { conversationId, content });
      
      const { data: result, error } = await supabase
        .from('whatsapp_messages_improved')
        .insert({
          conversation_id: conversationId,
          sender_phone: fromNumber,
          receiver_phone: toNumber,
          content: content,
          message_type: 'sent',
          whatsapp_message_id: `simulation-response-${Date.now()}`
        })
        .select()
        .single();

      if (error) {
        console.error('[SimulationMessageService] Erro ao salvar resposta simulada:', error);
        return null;
      }

      console.log('[SimulationMessageService] Resposta simulada salva com sucesso, ID:', result.id);
      return result.id;

    } catch (error) {
      console.error('[SimulationMessageService] Erro ao salvar resposta simulada:', error);
      return null;
    }
  }

  /**
   * Busca mensagens de simulação para uma clínica
   */
  static async getSimulationMessages(clinicId) {
    try {
      const { data: messages, error } = await supabase
        .from('whatsapp_messages_improved')
        .select(`
          *,
          whatsapp_conversations_improved!inner(
            clinic_id
          )
        `)
        .eq('whatsapp_conversations_improved.clinic_id', clinicId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[SimulationMessageService] Erro ao buscar mensagens de simulação:', error);
        return [];
      }

      return messages || [];

    } catch (error) {
      console.error('[SimulationMessageService] Erro ao buscar mensagens de simulação:', error);
      return [];
    }
  }
} 