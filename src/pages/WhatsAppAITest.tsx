// ========================================
// PÁGINA DE TESTE WHATSAPP-AI
// ========================================

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { Textarea } from '../components/ui/textarea';

interface TestResult {
  success: boolean;
  message: string;
  aiResponse?: any;
  sendResult?: any;
  error?: string;
}

const WhatsAppAITest: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const { toast } = useToast();

  const testWhatsAppAI = async () => {
    if (!phoneNumber || !message) {
      toast({
        title: 'Erro',
        description: 'Preencha o número e a mensagem',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/webhook/whatsapp/test-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message,
          clinicId: 'test-clinic',
          userId: 'test-user',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({
          success: true,
          message: data.message,
          aiResponse: data.aiResponse,
          sendResult: data.sendResult,
        });

        toast({
          title: 'Sucesso',
          description: 'Mensagem processada e enviada com AI!',
        });
      } else {
        setTestResult({
          success: false,
          message: 'Falha no teste',
          error: data.error,
        });

        toast({
          title: 'Erro',
          description: data.error || 'Falha ao processar mensagem',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      setTestResult({
        success: false,
        message: 'Erro de conexão',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      toast({
        title: 'Erro',
        description: 'Falha na conexão com o servidor',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testWebhookConnection = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/webhook/whatsapp/test');
      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Webhook OK',
          description: 'Webhook WhatsApp com AI está funcionando',
        });
      } else {
        toast({
          title: 'Erro no Webhook',
          description: 'Falha na conexão com o webhook',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao testar webhook',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📱 Teste WhatsApp-AI</h1>
          <p className="text-gray-600">
            Teste a integração entre WhatsApp e IA
          </p>
        </div>
        <Button onClick={testWebhookConnection} variant="outline">
          Testar Webhook
        </Button>
      </div>

      {/* Formulário de Teste */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Enviar Mensagem com AI</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Número do WhatsApp
            </label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="5511999999999"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Mensagem
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite a mensagem que será processada pela AI..."
              className="w-full"
              rows={4}
            />
          </div>

          <Button
            onClick={testWhatsAppAI}
            disabled={isLoading || !phoneNumber || !message}
            className="w-full"
          >
            {isLoading ? 'Processando...' : 'Enviar com AI'}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado do Teste */}
      {testResult && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Resultado do Teste
              <Badge variant={testResult.success ? 'default' : 'destructive'}>
                {testResult.success ? 'Sucesso' : 'Erro'}
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Mensagem:</h3>
              <p className="text-sm text-gray-600">{testResult.message}</p>
            </div>

            {testResult.error && (
              <div>
                <h3 className="font-semibold mb-2 text-red-600">Erro:</h3>
                <p className="text-sm text-red-600">{testResult.error}</p>
              </div>
            )}

            {testResult.aiResponse && (
              <div>
                <h3 className="font-semibold mb-2">Resposta da AI:</h3>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-sm mb-2">
                    <strong>Texto:</strong> {testResult.aiResponse.text}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      Modelo: {testResult.aiResponse.modelUsed}
                    </Badge>
                    {testResult.aiResponse.medicalContent && (
                      <Badge variant="destructive" className="text-xs">
                        Conteúdo Médico
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {testResult.sendResult && (
              <div>
                <h3 className="font-semibold mb-2">Envio WhatsApp:</h3>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✅ Mensagem enviada com sucesso
                  </p>
                  {testResult.sendResult.messages?.[0]?.id && (
                    <p className="text-xs text-green-600 mt-1">
                      ID: {testResult.sendResult.messages[0].id}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline">1</Badge>
            <div>
              <p className="font-medium">Digite o número e a mensagem</p>
              <p className="text-sm text-gray-600">
                A mensagem será processada pela AI antes de ser enviada
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Badge variant="outline">2</Badge>
            <div>
              <p className="font-medium">AI processa a mensagem</p>
              <p className="text-sm text-gray-600">
                Validação médica, análise de emoções, sugestões proativas
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Badge variant="outline">3</Badge>
            <div>
              <p className="font-medium">Resposta enviada via WhatsApp</p>
              <p className="text-sm text-gray-600">
                A resposta da AI é enviada automaticamente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppAITest; 