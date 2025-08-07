import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClinic } from '@/contexts/ClinicContext';
import NewMessageNotification from '@/components/conversations/NewMessageNotification';

interface Conversation {
  id: string;
  patient_phone_number: string;
  clinic_whatsapp_number: string;
  patient_name: string | null;
  last_message_preview: string | null;
  unread_count: number | null;
  last_message_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  clinic_id: string | null;
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
  const { userRole, user } = useAuth();
  const { selectedClinicId } = useClinic();

  // Calcular contador total de mensagens não lidas
  const unreadCount = conversations.reduce((total, conv) => {
    return total + (conv.unread_count || 0);
  }, 0);

  const fetchConversations = useCallback(async () => {
    try {
      console.log('🔄 Buscando conversas...');
      console.log('👤 User Role:', userRole);
      console.log('🏥 Selected Clinic ID:', selectedClinicId);
      
      let query = supabase
        .from('whatsapp_conversations_improved')
        .select('*')
        .order('last_message_at', { ascending: false });

      // Aplicar filtro por clínica
      if (userRole === 'admin_lify' || userRole === 'suporte_lify') {
        // Para admin_lify e suporte_lify, usar clínica selecionada no combobox
        if (selectedClinicId) {
          console.log('🔍 Admin/Suporte - Aplicando filtro por clínica:', selectedClinicId);
          query = query.eq('clinic_id', selectedClinicId);
        } else {
          console.log('🔍 Admin/Suporte - Nenhuma clínica selecionada, mostrando todas');
        }
      } else {
        // Para usuários normais, buscar conversas da sua clínica
        if (user) {
          console.log('👤 Usuário normal - buscando clínica do usuário...');
          
          // Buscar a clínica do usuário
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('clinic_id')
            .eq('user_id', user.id)
            .single();

          if (!profileError && userProfile?.clinic_id) {
            console.log('🔍 Usuário normal - Aplicando filtro por clínica:', userProfile.clinic_id);
            query = query.eq('clinic_id', userProfile.clinic_id);
          } else {
            console.log('⚠️  Usuário normal - Clínica não encontrada, mostrando conversas sem clínica');
            query = query.is('clinic_id', null);
          }
        } else {
          console.log('⚠️  Usuário não autenticado');
        }
      }

      const { data: conversations, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar conversas:', error);
        return;
      }

      console.log(`✅ Conversas encontradas: ${conversations?.length || 0}`);
      
      // Mapear os dados para o formato esperado
      const mappedConversations: Conversation[] = (conversations || []).map(conv => ({
        id: conv.id,
        patient_phone_number: conv.patient_phone_number,
        clinic_whatsapp_number: conv.clinic_whatsapp_number,
        patient_name: conv.patient_name,
        last_message_preview: conv.last_message_preview,
        unread_count: conv.unread_count || 0,
        last_message_at: conv.last_message_at,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        clinic_id: conv.clinic_id
      }));

      setConversations(mappedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, [userRole, selectedClinicId, user]);

  // Função para marcar conversa como lida
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('whatsapp_conversations_improved')
        .update({ unread_count: 0 })
        .eq('id', conversationId);

      if (error) {
        console.error('❌ Erro ao marcar conversa como lida:', error);
        return;
      }

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

  // Atualizar conversas quando mudar a clínica ou role do usuário
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