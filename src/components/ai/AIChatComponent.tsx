// ========================================
// COMPONENTE DE CHAT AI
// ========================================

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
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

  // Função para enviar mensagem
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
      const response = await fetch('/api/ai/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          message: inputValue,
          clinicId: selectedClinic.id,
          userId,
          sessionId,
          options: {
            enableMedicalValidation: true,
            enableEmotionAnalysis: true,
            enableProactiveSuggestions: true,
            enableCache: true,
            enableStreaming: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.data.response,
          isUser: false,
          timestamp: new Date(),
          confidence: data.data.confidence,
          modelUsed: data.data.modelUsed,
          medicalContent: data.data.medicalContent,
          emotion: data.data.emotion,
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar mensagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para streaming (simulada)
  const startStreaming = async (text: string) => {
    setIsStreaming(true);
    setStreamingText('');

    // Simular streaming
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setStreamingText(prev => prev + (i > 0 ? ' ' : '') + words[i]);
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

  // Função para testar conectividade
  const testConnection = async () => {
    try {
      const response = await fetch('/api/ai/test-connection', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Conexão OK',
          description: 'APIs AI estão funcionando corretamente.',
        });
      } else {
        toast({
          title: 'Erro de Conexão',
          description: 'Falha na conexão com as APIs AI.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao testar conexão.',
        variant: 'destructive',
      });
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
          <Button
            variant="outline"
            size="sm"
            onClick={testConnection}
          >
            Testar Conexão
          </Button>
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
                      {message.confidence && (
                        <Badge variant="outline" className="text-xs">
                          Confiança: {Math.round(message.confidence * 100)}%
                        </Badge>
                      )}
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
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim() || !selectedClinic?.id}
          >
            {isLoading ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>

        {/* Status */}
        <div className="mt-2 text-xs text-gray-500">
          {selectedClinic ? (
            <>Clínica: {selectedClinic.name}</>
          ) : (
            'Selecione uma clínica para começar'
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 