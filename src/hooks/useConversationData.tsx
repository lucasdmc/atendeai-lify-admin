
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Conversation, Message } from '@/types/conversation';

export const useConversationData = (conversationId: string | undefined) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const fetchConversationData = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (!error && data) {
        setConversation({
          ...data,
          updated_at: data.updated_at || new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Error fetching conversation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da conversa.",
        variant: "destructive",
      });
    }
  }, [conversationId, toast]);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (!error && data) {
        const typedMessages = data.map(msg => ({
          ...msg,
          message_type: msg.message_type as 'received' | 'sent',
          timestamp: msg.timestamp || new Date().toISOString()
        }));
        
        setMessages(typedMessages);
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [conversationId, toast]);

  const sendMessage = async (messageContent: string) => {
    if (!conversation) {
      console.error('❌ No conversation found');
      toast({
        title: "Erro",
        description: "Conversa não encontrada.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      
      console.log('📤 === ENVIANDO MENSAGEM ===');
      console.log('📞 Para:', conversation.patient_phone_number);
      console.log('💬 Mensagem:', messageContent);
      console.log('🔗 Conversation ID:', conversation.id);
      
      // Fazer a chamada para a Edge Function
      console.log('🚀 Chamando edge function...');
      const { data, error } = await supabase.functions.invoke('whatsapp-integration/send-message', {
        body: {
          to: conversation.patient_phone_number,
          message: messageContent
        }
      });

      console.log('📡 Edge function response - Data:', data);
      console.log('📡 Edge function response - Error:', error);

      // Verificar se houve erro na chamada da Edge Function
      if (error) {
        console.error('❌ Supabase function error:', error);
        
        // Tratamento específico para diferentes tipos de erro
        let errorMessage = "Erro desconhecido ao enviar mensagem.";
        
        if (error.message) {
          if (error.message.includes("WhatsApp not connected")) {
            errorMessage = "WhatsApp não está conectado. Verifique a conexão no módulo 'Conectar WhatsApp'.";
          } else if (error.message.includes("Failed to send")) {
            errorMessage = "Falha na entrega da mensagem. Verifique se o WhatsApp está funcionando.";
          } else if (error.message.includes("timeout")) {
            errorMessage = "Timeout ao enviar mensagem. Tente novamente.";
          } else {
            errorMessage = error.message;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Verificar se a resposta indica sucesso
      if (data?.success) {
        console.log('✅ Mensagem enviada com sucesso');
        toast({
          title: "Mensagem enviada",
          description: "Sua mensagem foi enviada com sucesso.",
        });
        
        // Recarregar mensagens após envio
        setTimeout(() => {
          fetchMessages();
        }, 1000);
      } else {
        console.error('❌ Edge function returned error:', data);
        throw new Error(data?.error || 'Falha ao enviar mensagem - resposta inválida');
      }
    } catch (error: any) {
      console.error('❌ Critical error sending message:', error);
      
      // Log detalhado do erro para debugging
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      
      let errorMessage = "Não foi possível enviar a mensagem.";
      
      if (error.message?.includes("WhatsApp not connected")) {
        errorMessage = "WhatsApp não está conectado. Verifique a conexão no módulo 'Conectar WhatsApp'.";
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Timeout ao enviar mensagem. Tente novamente.";
      } else if (error.message?.includes("Failed to send")) {
        errorMessage = "Falha na entrega da mensagem. Verifique se o WhatsApp está funcionando.";
      } else if (error.message?.includes("non-2xx status code")) {
        errorMessage = "Erro no servidor. Tente novamente em alguns segundos.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro ao enviar mensagem",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (conversationId) {
      fetchConversationData();
      fetchMessages();
    }
  }, [conversationId, fetchConversationData, fetchMessages]);

  return useMemo(() => ({
    conversation,
    messages,
    loading,
    sending,
    sendMessage,
    fetchMessages
  }), [conversation, messages, loading, sending, sendMessage, fetchMessages]);
};
