
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  message_type: 'inbound' | 'outbound';
  timestamp: string;
  whatsapp_message_id: string | null;
}

interface Conversation {
  id: string;
  phone_number: string;
  formatted_phone_number: string | null;
  country_code: string | null;
  name: string | null;
  updated_at: string;
  last_message_preview: string | null;
  unread_count: number | null;
}

export const useConversationData = (conversationId: string | undefined) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const fetchConversationData = async () => {
    if (!conversationId) return;
    
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      setConversation(data);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da conversa.",
        variant: "destructive",
      });
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      console.log('Fetching messages for conversation:', conversationId);
      
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }
      
      console.log('Messages found:', data?.length || 0);
      
      const typedMessages = (data || []).map(msg => ({
        ...msg,
        message_type: msg.message_type as 'inbound' | 'outbound'
      }));
      
      setMessages(typedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageContent: string) => {
    if (!conversation) return;

    try {
      setSending(true);
      
      console.log('Sending message to:', conversation.phone_number);
      
      const { data, error } = await supabase.functions.invoke('whatsapp-integration/send-message', {
        body: {
          to: conversation.phone_number,
          message: messageContent
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Mensagem enviada",
          description: "Sua mensagem foi enviada com sucesso.",
        });
        
        setTimeout(() => {
          fetchMessages();
        }, 1000);
      } else {
        throw new Error(data?.error || 'Falha ao enviar mensagem');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
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
  }, [conversationId]);

  return {
    conversation,
    messages,
    loading,
    sending,
    sendMessage,
    fetchMessages
  };
};
