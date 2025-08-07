
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Search, MoreVertical, Filter, Phone, Video, Info, Paperclip, Smile, Mic } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import ConversationSearch from '@/components/conversations/ConversationSearch';
import LoadingState from '@/components/conversations/LoadingState';
import WhatsAppStyleConversation from '@/components/conversations/WhatsAppStyleConversation';
import ChatArea from '@/components/conversations/ChatArea';
import { getDisplayName } from '@/utils/conversationUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useClinic } from '@/contexts/ClinicContext';
import { useConversation } from '@/contexts/ConversationContext';

// Função JavaScript para formatar número de telefone
const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove todos os caracteres não numéricos
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Se começa com código do país (55 para Brasil)
  if (cleaned.startsWith('55')) {
    const number = cleaned.substring(2);
    if (number.length === 10) {
      return `(${number.substring(0, 2)}) ${number.substring(2, 6)}-${number.substring(6)}`;
    } else if (number.length === 11) {
      return `(${number.substring(0, 2)}) ${number.substring(2, 7)}-${number.substring(7)}`;
    }
  }
  
  // Se é um número brasileiro sem código do país
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  } else if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  }
  
  // Se não conseguir formatar, retorna o número original
  return phoneNumber;
};

// Função JavaScript para extrair código do país
const extractCountryCode = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.startsWith('55')) {
    return 'BR';
  }
  return 'BR'; // Default para Brasil
};

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

const Conversas = () => {
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user, userProfile, userRole } = useAuth();
  const { selectedClinicId } = useClinic();
  
  // Usar o contexto de conversas
  const { 
    conversations, 
    selectedConversation, 
    setSelectedConversation, 
    markConversationAsRead,
    unreadCount 
  } = useConversation();

  useEffect(() => {
    // Simular loading inicial
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const filtered = conversations.filter(conversation => {
      const displayName = getDisplayName(conversation);
      return displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.patient_phone_number.includes(searchTerm) ||
        (conversation.patient_name && conversation.patient_name.includes(searchTerm));
    });
    setFilteredConversations(filtered);
  }, [searchTerm, conversations]);

  useEffect(() => {
    if (conversationId) {
      const conversation = conversations.find(c => c.id === conversationId);
      setSelectedConversation(conversation || null);
    }
  }, [conversationId, conversations, setSelectedConversation]);

  const openConversation = async (conversation: Conversation) => {
    // Marcar como lida se tiver mensagens não lidas
    if (conversation.unread_count && conversation.unread_count > 0) {
      await markConversationAsRead(conversation.id);
    }
    
    setSelectedConversation(conversation);
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar - Lista de Conversas */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header da Sidebar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Conversas</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Barra de Pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Pesquisar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>

        {/* Estatísticas */}
        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
            </span>
            <span className="text-gray-600">
              {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Lista de Conversas */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma conversa encontrada</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <WhatsAppStyleConversation
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversation?.id === conversation.id}
                  onClick={() => openConversation(conversation)}
                  getDisplayName={getDisplayName}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Área Principal - Chat */}
      <ChatArea conversation={selectedConversation} />
    </div>
  );
};

export default Conversas;
