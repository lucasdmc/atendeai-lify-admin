
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

const Conversas = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user, userProfile, userRole } = useAuth();
  const { selectedClinicId } = useClinic();

  useEffect(() => {
    fetchConversations();
  }, [selectedClinicId]);

  useEffect(() => {
    const filtered = conversations.filter(conversation => {
      const displayName = getDisplayName(conversation);
      return displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.phone_number.includes(searchTerm) ||
        (conversation.formatted_phone_number && conversation.formatted_phone_number.includes(searchTerm));
    });
    setFilteredConversations(filtered);
  }, [searchTerm, conversations]);

  useEffect(() => {
    if (conversationId) {
      const conversation = conversations.find(c => c.id === conversationId);
      setSelectedConversation(conversation || null);
    }
  }, [conversationId, conversations]);

  const fetchConversations = async () => {
    try {
      console.log('🔄 Buscando conversas...');
      console.log('🏥 Clínica selecionada:', selectedClinicId);
      console.log('👤 Role do usuário:', userRole);
      
      let data;
      let error;
      
      // Se o usuário é admin_lify ou suporte_lify e tem clínica selecionada
      if ((userRole === 'admin_lify' || userRole === 'suporte_lify') && selectedClinicId) {
        console.log('🔍 Buscando conversas da clínica:', selectedClinicId);
        
        // Buscar conversas diretamente por clinic_id
        const { data: clinicConversations, error: convError } = await supabase
          .from('whatsapp_conversations')
          .select(`
            id,
            phone_number,
            formatted_phone_number,
            country_code,
            name,
            updated_at,
            last_message_preview,
            unread_count
          `)
          .eq('clinic_id', selectedClinicId)
          .order('updated_at', { ascending: false });
        
        if (convError) throw convError;
        
        data = clinicConversations || [];
        console.log('📊 Conversas da clínica encontradas:', data.length);
      } else {
        // Para usuários normais ou quando não há clínica selecionada, usar conversas gerais
        console.log('🔍 Buscando conversas gerais...');
        
        const { data: generalConversations, error: generalError } = await supabase
          .from('whatsapp_conversations')
          .select(`
            id,
            phone_number,
            formatted_phone_number,
            country_code,
            name,
            updated_at,
            last_message_preview,
            unread_count
          `)
          .order('updated_at', { ascending: false });
        
        if (generalError) throw generalError;
        data = generalConversations;
      }
      
      if (error) throw error;
      
      console.log('📊 Conversas encontradas:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📝 Primeira conversa:', data[0]);
      }
      
      // Para cada conversa, buscar a contagem real de mensagens, a última mensagem e o nome do usuário
      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conv) => {
          let count = 0;
          let lastMessage = null;
          
          // Buscar mensagens gerais (única tabela agora)
          const { count: messageCount } = await supabase
            .from('whatsapp_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);
          
          const { data: generalLastMessage } = await supabase
            .from('whatsapp_messages')
            .select('content, message_type, timestamp')
            .eq('conversation_id', conv.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();
          
          count = messageCount || 0;
          lastMessage = generalLastMessage;
          
          // Buscar nome do usuário na tabela conversation_memory
          let userName = conv.name; // Usar o nome da conversa como fallback
          try {
            const { data: memoryData } = await supabase
              .from('conversation_memory')
              .select('user_name')
              .eq('phone_number', conv.phone_number)
              .not('user_name', 'is', null)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (memoryData?.user_name) {
              // Tentar fazer parse do user_name se for JSON
              try {
                if (typeof memoryData.user_name === 'string' && memoryData.user_name.startsWith('{')) {
                  const parsedName = JSON.parse(memoryData.user_name);
                  userName = parsedName.name || memoryData.user_name;
                } else {
                  userName = memoryData.user_name;
                }
              } catch (parseError) {
                // Se falhar o parse, usar como string direta
                userName = memoryData.user_name;
              }
              
              console.log(`👤 Nome encontrado para ${conv.phone_number}: ${userName}`);
            }
          } catch (memoryError) {
            console.log(`📝 Nenhum nome encontrado na memória para ${conv.phone_number}`);
          }
          
          return {
            ...conv,
            name: userName, // Atualizar o nome com o valor da memória
            message_count: count || 0,
            last_message_preview: lastMessage?.content || conv.last_message_preview,
            last_message_type: lastMessage?.message_type,
            updated_at: conv.updated_at || new Date().toISOString()
          };
        })
      );

      // Formatar números de telefone localmente (sem atualizar o banco)
      for (const conv of conversationsWithDetails) {
        if (!conv.formatted_phone_number) {
          try {
            const formattedNumber = formatPhoneNumber(conv.phone_number);
            const countryCode = extractCountryCode(conv.phone_number);
            
            conv.formatted_phone_number = formattedNumber;
            conv.country_code = countryCode;
          } catch (formatError) {
            console.error('Error formatting phone number:', formatError);
          }
        }
      }
      
      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openConversation = (conversation: Conversation) => {
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
              {selectedClinicId && (userRole === 'admin_lify' || userRole === 'suporte_lify') && (
                <p className="text-sm text-gray-500 mt-1">
                  Clínica selecionada: {selectedClinicId}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
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
              {conversations.filter(c => c.unread_count && c.unread_count > 0).length} não lida{conversations.filter(c => c.unread_count && c.unread_count > 0).length !== 1 ? 's' : ''}
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
