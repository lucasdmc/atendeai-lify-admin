import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClinic } from '@/contexts/ClinicContext';
import NewMessageNotification from '@/components/conversations/NewMessageNotification';

interface Conversation {
  id: string;
  phone_number: string;
  formatted_phone_number: string | null;
  country_code: string | null;
  name: string | null;
  updated_at: string | null;
  last_message_preview: string | null;
  unread_count: number | null;
  message_count?: number;
  last_message_type?: string;
}

interface ConversationContextType {
  conversations: Conversation[];
  unreadCount: number;
  selectedConversation: Conversation | null;
  setSelectedConversation: (conversation: Conversation | null) => void;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  updateConversationInList: (conversationId: string, updates: Partial<Conversation>) => void;
  showNotification: (conversationId: string, message: string, senderName: string) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};

interface ConversationProviderProps {
  children: React.ReactNode;
}

export const ConversationProvider: React.FC<ConversationProviderProps> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    conversationId: string;
    message: string;
    senderName: string;
  }>>([]);
  const { userRole } = useAuth();
  const { selectedClinicId } = useClinic();

  // Calcular contador total de mensagens não lidas
  const unreadCount = conversations.reduce((total, conv) => {
    return total + (conv.unread_count || 0);
  }, 0);

  const fetchConversations = useCallback(async () => {
    try {
      console.log('🔄 Buscando conversas...');
      
      // Simular dados para teste
      const mockConversations: Conversation[] = [
        {
          id: '1',
          phone_number: '5511999999999',
          formatted_phone_number: '(11) 99999-9999',
          country_code: 'BR',
          name: 'João Silva',
          updated_at: new Date().toISOString(),
          last_message_preview: 'Olá, gostaria de agendar uma consulta',
          unread_count: 2,
          message_count: 5,
          last_message_type: 'received'
        },
        {
          id: '2',
          phone_number: '5511888888888',
          formatted_phone_number: '(11) 88888-8888',
          country_code: 'BR',
          name: 'Maria Santos',
          updated_at: new Date().toISOString(),
          last_message_preview: 'Obrigada pela informação',
          unread_count: 0,
          message_count: 3,
          last_message_type: 'sent'
        }
      ];
      
      setConversations(mockConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, []);

  // Função para marcar conversa como lida
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      // Atualizar no estado local
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );

      // Atualizar conversa selecionada se for a mesma
      setSelectedConversation(prev => 
        prev?.id === conversationId 
          ? { ...prev, unread_count: 0 }
          : prev
      );

      console.log(`✅ Conversa ${conversationId} marcada como lida`);
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }, []);

  // Função para atualizar uma conversa específica na lista
  const updateConversationInList = useCallback((conversationId: string, updates: Partial<Conversation>) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, ...updates }
          : conv
      )
    );

    // Atualizar conversa selecionada se for a mesma
    setSelectedConversation(prev => 
      prev?.id === conversationId 
        ? { ...prev, ...updates }
        : prev
    );
  }, []);

  // Função para mostrar notificação
  const showNotification = useCallback((conversationId: string, message: string, senderName: string) => {
    const notificationId = `${conversationId}-${Date.now()}`;
    setNotifications(prev => [...prev, { id: notificationId, conversationId, message, senderName }]);
    
    // Auto-remover após 6 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }, 6000);
  }, []);

  // Atualizar conversas quando mudar a clínica
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const value: ConversationContextType = {
    conversations,
    unreadCount,
    selectedConversation,
    setSelectedConversation,
    markConversationAsRead,
    refreshConversations: fetchConversations,
    updateConversationInList,
    showNotification,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
      
      {/* Notificações */}
      {notifications.map((notification) => (
        <NewMessageNotification
          key={notification.id}
          conversationId={notification.conversationId}
          message={notification.message}
          senderName={notification.senderName}
          onDismiss={() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
          }}
        />
      ))}
    </ConversationContext.Provider>
  );
}; 