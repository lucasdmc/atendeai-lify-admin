import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Phone, 
  Video, 
  Info, 
  Send, 
  Paperclip, 
  Smile,
  Mic,
  Check,
  CheckCheck,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getDisplayName } from '@/utils/conversationUtils';
import { getAvatarUrl, generateColorsFromName } from '@/utils/avatarUtils';
import { useConversation } from '@/contexts/ConversationContext';

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender_type: 'user' | 'contact';
  created_at: string;
  status?: 'sent' | 'delivered' | 'read';
  simulation_mode?: boolean;
}

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
  simulation_mode?: boolean | null;
}

interface ChatAreaProps {
  conversation?: Conversation | null;
  conversationId?: string;
  isSimulationMode?: boolean;
}

const ChatArea: React.FC<ChatAreaProps> = ({ conversation, conversationId, isSimulationMode = false }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [contactAvatar, setContactAvatar] = useState<string>('');
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(conversation || null);
  
  const { markConversationAsRead } = useConversation();
  
  const displayName = currentConversation ? getDisplayName(currentConversation) : '';
  const colors = generateColorsFromName(displayName);

  useEffect(() => {
    if (currentConversation) {
      const generateAvatar = async () => {
        try {
          const url = getAvatarUrl({
            name: displayName,
            phone: currentConversation.patient_phone_number,
            size: 200
          });
          setContactAvatar(url);
        } catch (error) {
          console.error('Erro ao gerar avatar:', error);
        }
      };

      generateAvatar();
    }
  }, [currentConversation, displayName]);

  useEffect(() => {
    if (currentConversation) {
      fetchMessages();
      
      // Marcar como lida automaticamente quando a conversa for aberta
      if (currentConversation.unread_count && currentConversation.unread_count > 0) {
        markConversationAsRead(currentConversation.id);
      }
    }
  }, [currentConversation, markConversationAsRead]);

  // Se conversationId foi passado, buscar a conversa
  useEffect(() => {
    if (conversationId && !currentConversation) {
      fetchConversation();
    }
  }, [conversationId]);

  const fetchConversation = async () => {
    if (!conversationId) return;
    
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations_improved')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Erro ao buscar conversa:', error);
        return;
      }

      setCurrentConversation(data);
    } catch (error) {
      console.error('Erro ao buscar conversa:', error);
    }
  };

  const fetchMessages = async () => {
    if (!currentConversation) return;
    
    setLoading(true);
    try {
      console.log('🔍 Buscando mensagens para conversa:', currentConversation.id);
      
      const { data, error } = await supabase
        .from('whatsapp_messages_improved')
        .select('*')
        .eq('conversation_id', currentConversation.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar mensagens:', error);
        throw error;
      }
      
      console.log('✅ Mensagens encontradas:', data?.length || 0);
      
      // Mapear as mensagens para o formato esperado
      const mappedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        content: msg.content,
        sender_type: msg.message_type === 'sent' ? 'user' : 'contact' as const, // sent = clínica envia = user
        created_at: msg.created_at,
        status: 'sent',
        simulation_mode: !!msg.simulation_mode
      }));
      
      setMessages(mappedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentConversation) return;

    try {
      console.log('📤 Enviando mensagem para conversa:', currentConversation.id);
      
      const { data, error } = await supabase
        .from('whatsapp_messages_improved')
        .insert({
          conversation_id: currentConversation.id,
          sender_phone: currentConversation.clinic_whatsapp_number, // Clínica envia
          receiver_phone: currentConversation.patient_phone_number, // Paciente recebe
          content: newMessage.trim(),
          message_type: 'sent',
          whatsapp_message_id: `local_${Date.now()}`,
          metadata: {}
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        throw error;
      }

      console.log('✅ Mensagem enviada com sucesso:', data.id);

      // Mapear a mensagem para o formato esperado
      const mappedMessage: Message = {
        id: data.id,
        conversation_id: data.conversation_id,
        content: data.content,
        sender_type: 'user' as const,
        created_at: data.created_at,
        status: 'sent'
      };

      setMessages(prev => [...prev, mappedMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageStatus = (message: Message) => {
    if (message.sender_type === 'contact') return null;
    
    switch (message.status) {
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isSimulationMode ? 'Simulador de Atendimento' : 'WhatsApp Business'}
          </h2>
          <p className="text-gray-500 mb-4">
            {isSimulationMode 
              ? 'Selecione uma conversa para visualizar as mensagens simuladas'
              : 'Selecione uma conversa para começar a gerenciar'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header do Chat */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={contactAvatar} 
            />
            <AvatarFallback 
              style={{
                backgroundColor: colors.backgroundColor,
                color: colors.textColor
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">{displayName}</h2>
              {isSimulationMode && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  Simulação
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {currentConversation.patient_phone_number}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Área de Mensagens */}
      <ScrollArea className="flex-1 p-4 bg-gray-50">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Carregando mensagens...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chat com {displayName}
            </h3>
            <p className="text-gray-500">
              Nenhuma mensagem ainda • Inicie a conversa enviando uma mensagem
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-xs opacity-70">
                      {formatTime(message.created_at)}
                    </span>
                    {getMessageStatus(message)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Área de Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              placeholder="Digite uma mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
              className="pr-12"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <Smile className="h-5 w-5" />
            </Button>
          </div>
          
          {newMessage.trim() ? (
            <Button onClick={sendMessage} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm">
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatArea; 