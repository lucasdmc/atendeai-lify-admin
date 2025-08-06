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
  CheckCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getDisplayName } from '@/utils/conversationUtils';
import { getAvatarUrl, generateColorsFromName } from '@/utils/avatarUtils';

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender_type: 'user' | 'contact';
  created_at: string;
  status?: 'sent' | 'delivered' | 'read';
}

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
}

interface ChatAreaProps {
  conversation: Conversation | null;
}

const ChatArea: React.FC<ChatAreaProps> = ({ conversation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [contactAvatar, setContactAvatar] = useState<string>('');
  const [avatarError, setAvatarError] = useState(false);
  
  const displayName = conversation ? getDisplayName(conversation) : '';
  const colors = generateColorsFromName(displayName);

  useEffect(() => {
    if (conversation) {
      const generateAvatar = async () => {
        try {
          const url = getAvatarUrl({
            name: displayName,
            phone: conversation.phone_number,
            size: 200
          });
          setContactAvatar(url);
        } catch (error) {
          console.error('Erro ao gerar avatar:', error);
          setAvatarError(true);
        }
      };

      generateAvatar();
    }
  }, [conversation, displayName]);

  useEffect(() => {
    if (conversation) {
      fetchMessages();
    }
  }, [conversation]);

  const fetchMessages = async () => {
    if (!conversation) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      
      // Mapear as mensagens para o formato esperado
      const mappedMessages = (data || []).map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        content: msg.content,
        sender_type: msg.message_type === 'sent' ? 'user' : 'contact',
        created_at: msg.timestamp || msg.created_at,
        status: 'sent' // Por enquanto, assumimos que todas as mensagens foram enviadas
      }));
      
      setMessages(mappedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversation.id,
          content: newMessage.trim(),
          message_type: 'sent',
          timestamp: new Date().toISOString(),
          whatsapp_message_id: `local_${Date.now()}`,
          metadata: {}
        })
        .select()
        .single();

      if (error) throw error;

      // Mapear a mensagem para o formato esperado
      const mappedMessage = {
        id: data.id,
        conversation_id: data.conversation_id,
        content: data.content,
        sender_type: 'user',
        created_at: data.timestamp,
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

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            WhatsApp Business
          </h2>
          <p className="text-gray-500 mb-4">
            Selecione uma conversa para começar a gerenciar
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
              onError={() => setAvatarError(true)}
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
            <h2 className="font-semibold text-gray-900">{displayName}</h2>
            <p className="text-sm text-gray-500">
              {conversation.formatted_phone_number}
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
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-1">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">digitando...</span>
                  </div>
                </div>
              </div>
            )}
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