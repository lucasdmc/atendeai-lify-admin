import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Search, MoreVertical, Filter, Phone, Video, Info, Paperclip, Smile, Mic, Play, Eye } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';

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

interface SimulationConversation {
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
  clinic_name?: string;
  simulation_mode: boolean;
}

const Simulacao = () => {
  const [filteredConversations, setFilteredConversations] = useState<SimulationConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<SimulationConversation | null>(null);
  const [conversations, setConversations] = useState<SimulationConversation[]>([]);
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user, userProfile, userRole } = useAuth();
  const { selectedClinicId } = useClinic();

  // Carregar conversas em modo simulação
  const loadSimulationConversations = async () => {
    try {
      setLoading(true);
      
      // Buscar conversas que têm mensagens simuladas
      const { data: conversationsData, error } = await supabase
        .from('whatsapp_conversations_improved')
        .select(`
          id,
          patient_phone_number,
          clinic_whatsapp_number,
          patient_name,
          last_message_preview,
          unread_count,
          last_message_at,
          created_at,
          updated_at,
          clinic_id,
          clinics!inner(
            name,
            simulation_mode
          )
        `)
        .eq('clinics.simulation_mode', true)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar conversas de simulação:', error);
        return;
      }

      // Transformar os dados para incluir informações da clínica
      const simulationConversations: SimulationConversation[] = conversationsData?.map(conv => ({
        ...conv,
        clinic_name: conv.clinics?.name,
        simulation_mode: conv.clinics?.simulation_mode || false
      })) || [];

      setConversations(simulationConversations);
      setFilteredConversations(simulationConversations);

    } catch (error) {
      console.error('Erro ao carregar conversas de simulação:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSimulationConversations();
  }, [selectedClinicId]);

  useEffect(() => {
    const filtered = conversations.filter(conversation => {
      const displayName = getDisplayName(conversation);
      return displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             conversation.patient_phone_number.includes(searchTerm) ||
             (conversation.clinic_name && conversation.clinic_name.toLowerCase().includes(searchTerm.toLowerCase()));
    });
    setFilteredConversations(filtered);
  }, [searchTerm, conversations]);

  const openConversation = async (conversation: SimulationConversation) => {
    setSelectedConversation(conversation);
    navigate(`/simulacao/${conversation.id}`);
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const getUnreadCount = (conversation: SimulationConversation) => {
    return conversation.unread_count || 0;
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar com lista de conversas */}
      <div className="w-1/3 border-r bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Play className="h-5 w-5 text-orange-500" />
              Simulador de Atendimento
            </h1>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              <Eye className="h-3 w-3 mr-1" />
              Modo Simulação
            </Badge>
          </div>
          
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              💡 Esta tela mostra apenas conversas em modo simulação. As respostas da IA são processadas normalmente, mas não são enviadas para o WhatsApp.
            </AlertDescription>
          </Alert>

          {/* Barra de pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista de conversas */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">
                  {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa em simulação'}
                </p>
                {!searchTerm && (
                  <p className="text-xs mt-2 text-gray-400">
                    Ative o modo simulação em uma clínica para ver conversas aqui
                  </p>
                )}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => openConversation(conversation)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-orange-100 text-orange-600">
                        <Play className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm truncate">
                            {getDisplayName(conversation)}
                          </h3>
                          {conversation.clinic_name && (
                            <Badge variant="outline" className="text-xs">
                              {conversation.clinic_name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {getUnreadCount(conversation) > 0 && (
                            <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center">
                              {getUnreadCount(conversation)}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.last_message_at)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conversation.last_message_preview || 'Nenhuma mensagem'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatArea 
            conversationId={selectedConversation.id}
            isSimulationMode={true}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Play className="h-16 w-16 mx-auto mb-4 text-orange-300" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                Simulador de Atendimento
              </h2>
              <p className="text-gray-500 max-w-md">
                Selecione uma conversa para visualizar as mensagens simuladas. 
                As respostas da IA são processadas mas não enviadas para o WhatsApp.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Simulacao; 