// ========================================
// PÁGINA DE TESTE AI - VERSÃO SIMPLIFICADA
// ========================================

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  confidence?: number;
  modelUsed?: string;
}

const AITest: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

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
        },
        body: JSON.stringify({
          message: inputValue,
          clinicId: 'test-clinic',
          userId: 'test-user',
          sessionId: 'test-session',
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.data.response,
          isUser: false,
          timestamp: new Date(),
          confidence: data.data.confidence,
          modelUsed: data.data.modelUsed,
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Erro ao processar mensagem');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar mensagem. Tente novamente.',
        variant: 'destructive',
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

  const testConnection = async () => {
    try {
      const response = await fetch('/api/ai/test-connection');
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🤖 Teste AI</h1>
          <p className="text-gray-600">
            Teste o sistema de IA em tempo real
          </p>
        </div>
        <Button onClick={testConnection} variant="outline">
          Testar Conexão
        </Button>
      </div>

      {/* Chat Area */}
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Chat AI
            <Badge variant="secondary">Beta</Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Messages */}
          <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>Digite uma mensagem para começar...</p>
              </div>
            ) : (
              messages.map((message) => (
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
                      </div>
                    )}
                    
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
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
              disabled={isLoading || !inputValue.trim()}
            >
              {isLoading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <div className="text-center text-sm text-gray-500">
        Sistema AI funcionando em modo de simulação
      </div>
    </div>
  );
};

export default AITest; 