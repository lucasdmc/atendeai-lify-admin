// ========================================
// COMPONENTE DE CHAT AI
// ========================================

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useClinic } from '../../contexts/ClinicContext';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  confidence?: number;
  modelUsed?: string;
  medicalContent?: boolean;
  emotion?: string;
}

interface AIChatComponentProps {
  userId: string;
  sessionId?: string;
  className?: string;
}

export const AIChatComponent: React.FC<AIChatComponentProps> = ({
  userId,
  sessionId,
  className = '',
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { selectedClinic } = useClinic();

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const sendMessage = async () => {
    if (!inputValue.trim() || !selectedClinic?.id) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          message: inputValue,
          userId,
          sessionId: sessionId || 'default-session',
          clinicId: selectedClinic.id,
          options: {
            enableMedicalValidation: true,
            enableEmotionAnalysis: true,
            enableCache: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com a IA');
      }

      const data = await response.json();

      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          isUser: false,
          timestamp: new Date(),
          confidence: data.confidence,
          modelUsed: data.modelUsed,
          medicalContent: data.medicalContent,
          emotion: data.emotion,
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Erro no processamento');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao processar mensagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startStreaming = async (text: string) => {
    setIsStreaming(true);
    setStreamingText('');

    // Simular streaming de texto
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setStreamingText(prev => prev + (i === 0 ? '' : ' ') + words[i]);
    }

    setIsStreaming(false);
    setStreamingText('');
  };

  // Função para enviar com Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            🤖 Chat AI
            <Badge variant="secondary">Beta</Badge>
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Área de mensagens */}
        <ScrollArea className="h-96 w-full rounded-md border p-4 mb-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.isUser
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  
                  {!message.isUser && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.modelUsed && (
                        <Badge variant="outline" className="text-xs">
                          {message.modelUsed}
                        </Badge>
                      )}
                      {message.medicalContent && (
                        <Badge variant="destructive" className="text-xs">
                          Conteúdo Médico
                        </Badge>
                      )}
                      {message.emotion && (
                        <Badge variant="outline" className="text-xs">
                          {message.emotion}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Texto em streaming */}
            {isStreaming && streamingText && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-900">
                  <p className="text-sm">{streamingText}</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      Digitando...
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Área de input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              disabled={isLoading || !selectedClinic?.id}
            />
          </div>
          
          <Button
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim() || !selectedClinic?.id}
            className="px-4 py-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Status */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          {selectedClinic ? (
            <span>Modo simulação ativo</span>
          ) : (
            <span>Selecione uma clínica para começar</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 