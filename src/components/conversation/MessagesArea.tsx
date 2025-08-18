
import { useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  message_type: 'received' | 'sent';
  timestamp: string;
  whatsapp_message_id: string | null;
  simulation_mode?: boolean | null;
}

interface MessagesAreaProps {
  messages: Message[];
  loading: boolean;
  formatMessageTime: (timestamp: string) => string;
}

const MessagesArea = ({ messages, loading, formatMessageTime }: MessagesAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="h-8 w-8 animate-spin mx-auto mb-2 text-orange-500" />
            <p>Carregando mensagens...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log('MessagesArea - Rendering messages:', messages);

  return (
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
            messages.map((message) => {
              console.log('Rendering message:', message);
              return (
                <div
                  key={message.id}
                  className={`flex ${message.message_type === 'sent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.message_type === 'sent'
                        ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    {message.simulation_mode ? (
                      <p className={`${message.message_type === 'sent' ? 'text-orange-100' : 'text-gray-600'} text-[10px] mt-1`}>Simulação</p>
                    ) : null}
                    <p className={`text-xs mt-1 ${
                      message.message_type === 'sent' ? 'text-orange-100' : 'text-gray-500'
                    }`}>
                      {formatMessageTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
    </Card>
  );
};

export default MessagesArea;
