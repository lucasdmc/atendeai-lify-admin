
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Send, Phone, MessageCircle, User2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CountryFlag from '@/components/CountryFlag';

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

const ConversaIndividual = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (conversationId) {
      fetchConversationData();
      fetchMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversationData = async () => {
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
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    try {
      setSending(true);
      
      // Chamar a função do WhatsApp para enviar a mensagem
      const { data, error } = await supabase.functions.invoke('whatsapp-integration/send-message', {
        body: {
          to: conversation.phone_number,
          message: newMessage.trim()
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Mensagem enviada",
          description: "Sua mensagem foi enviada com sucesso.",
        });
        
        setNewMessage('');
        
        // Recarregar mensagens para mostrar a nova mensagem
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getDisplayName = () => {
    if (conversation?.name && conversation.name !== conversation.phone_number) {
      return conversation.name;
    }
    return conversation?.formatted_phone_number || conversation?.phone_number || 'Contato Desconhecido';
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageCircle className="h-8 w-8 animate-spin mx-auto mb-2 text-orange-500" />
          <p>Carregando conversa...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold mb-2">Conversa não encontrada</h2>
        <Button onClick={() => navigate('/conversas')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para conversas
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header da conversa */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/conversas')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
                  {conversation.name && conversation.name !== conversation.phone_number ? (
                    <User2 className="h-5 w-5 text-white" />
                  ) : (
                    <Phone className="h-5 w-5 text-white" />
                  )}
                </div>
                {conversation.country_code && (
                  <div className="absolute -bottom-1 -right-1">
                    <CountryFlag 
                      countryCode={conversation.country_code} 
                      className="w-3 h-3"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <CardTitle className="text-lg">{getDisplayName()}</CardTitle>
                <p className="text-sm text-gray-600 font-mono">
                  {conversation.formatted_phone_number || conversation.phone_number}
                </p>
              </div>
            </div>
            
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Online
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Área de mensagens */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma mensagem ainda</p>
                <p className="text-sm">Inicie uma conversa enviando uma mensagem</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.message_type === 'outbound' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.message_type === 'outbound'
                        ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.message_type === 'outbound' ? 'text-orange-100' : 'text-gray-500'
                    }`}>
                      {formatMessageTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input para nova mensagem */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                disabled={sending}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              >
                {sending ? (
                  <MessageCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversaIndividual;
