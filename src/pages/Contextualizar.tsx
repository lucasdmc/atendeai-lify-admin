
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ContextualizeResponse {
  response: string;
  questionsCompleted: boolean;
  totalQuestions: number;
  answeredQuestions: number;
}

const Contextualizar = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Olá! 👋 Vou ajudá-lo a contextualizar seu chatbot para sua clínica. Vamos começar coletando informações importantes sobre seu negócio. Qual é o nome da sua clínica?',
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionsCompleted, setQuestionsCompleted] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('contextualize-chat', {
        body: {
          message: inputMessage,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (error) throw error;

      const response = data as ContextualizeResponse;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setQuestionsCompleted(response.questionsCompleted);
      setTotalQuestions(response.totalQuestions);
      setAnsweredQuestions(response.answeredQuestions);

      if (response.questionsCompleted) {
        toast({
          title: "🎉 Contextualização Concluída!",
          description: "Perfeito! Seu chatbot agora está configurado com todas as informações da sua clínica e pronto para atender seus pacientes.",
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contextualizar Chatbot</h1>
          <p className="text-gray-600 mt-2">Configure seu assistente virtual com informações da sua clínica</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 mb-2">
            {questionsCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Sparkles className="h-5 w-5 text-orange-500" />
            )}
            <p className="text-sm text-gray-500">
              {questionsCompleted ? 'Contextualização Completa ✨' : 'Progresso da Contextualização'}
            </p>
          </div>
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                questionsCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-orange-400 to-pink-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {answeredQuestions}/{totalQuestions} perguntas respondidas ({progress}%)
          </p>
        </div>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-orange-500" />
            Chat de Contextualização
            {questionsCompleted && (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                ✨ Concluído
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className={`p-2 rounded-full flex-shrink-0 ${
                    message.isUser 
                      ? 'bg-gradient-to-r from-orange-400 to-pink-500' 
                      : 'bg-gray-100'
                  }`}>
                    {message.isUser ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className={`max-w-[80%] ${
                    message.isUser ? 'text-right' : 'text-left'
                  }`}>
                    <div className={`p-3 rounded-lg ${
                      message.isUser
                        ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-gray-100 flex-shrink-0">
                    <Bot className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Elemento invisível para scroll automático */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t flex-shrink-0">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={questionsCompleted ? "Contextualização concluída! 🎉" : "Digite sua resposta..."}
                disabled={isLoading || questionsCompleted}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim() || questionsCompleted}
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {questionsCompleted && (
              <p className="text-xs text-green-600 mt-2 text-center">
                ✨ Seu chatbot está pronto para atender os pacientes!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Contextualizar;
