
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProgressHeader } from '@/components/contextualization/ProgressHeader';
import { MessageList } from '@/components/contextualization/MessageList';
import { ChatInput } from '@/components/contextualization/ChatInput';

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
  const { toast } = useToast();

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

  return (
    <div className="space-y-6">
      <ProgressHeader
        questionsCompleted={questionsCompleted}
        progress={progress}
        answeredQuestions={answeredQuestions}
        totalQuestions={totalQuestions}
      />

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
          <MessageList messages={messages} isLoading={isLoading} />
          
          <ChatInput
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            onSendMessage={sendMessage}
            isLoading={isLoading}
            questionsCompleted={questionsCompleted}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Contextualizar;
