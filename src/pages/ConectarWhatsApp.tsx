
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Smartphone, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ConectarWhatsApp = () => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Simular geração de QR Code (aqui você integraria com uma API real do WhatsApp)
  const generateQRCode = async () => {
    setIsLoading(true);
    setConnectionStatus('connecting');
    
    try {
      // Simulando chamada para API do WhatsApp
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // QR Code simulado (em produção, seria retornado pela API)
      const mockQRCode = `data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="white"/>
          <rect x="0" y="0" width="40" height="40" fill="black"/>
          <rect x="80" y="0" width="40" height="40" fill="black"/>
          <rect x="160" y="0" width="40" height="40" fill="black"/>
          <rect x="0" y="80" width="40" height="40" fill="black"/>
          <rect x="160" y="80" width="40" height="40" fill="black"/>
          <rect x="0" y="160" width="40" height="40" fill="black"/>
          <rect x="80" y="160" width="40" height="40" fill="black"/>
          <rect x="160" y="160" width="40" height="40" fill="black"/>
          <text x="100" y="110" text-anchor="middle" font-family="Arial" font-size="12" fill="black">QR Code</text>
        </svg>
      `)}`;
      
      setQrCode(mockQRCode);
      
      toast({
        title: "QR Code gerado",
        description: "Escaneie o código com seu WhatsApp Business para conectar.",
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o QR Code. Tente novamente.",
        variant: "destructive",
      });
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateConnection = () => {
    setTimeout(() => {
      setConnectionStatus('connected');
      toast({
        title: "WhatsApp conectado!",
        description: "Seu WhatsApp Business foi conectado com sucesso.",
      });
    }, 5000);
  };

  useEffect(() => {
    if (qrCode && connectionStatus === 'connecting') {
      simulateConnection();
    }
  }, [qrCode, connectionStatus]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      default: return 'Desconectado';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'connecting': return <RefreshCw className="h-4 w-4 animate-spin" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conectar WhatsApp Business</h1>
          <p className="text-gray-600 mt-2">Conecte seu número do WhatsApp Business ao sistema</p>
        </div>
        <Badge className={`${getStatusColor()} text-white`}>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusText()}
          </div>
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-orange-500" />
              QR Code de Conexão
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {qrCode ? (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                  <img src={qrCode} alt="QR Code WhatsApp" className="w-48 h-48" />
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">QR Code será exibido aqui</p>
                </div>
              </div>
            )}
            
            <Button 
              onClick={generateQRCode}
              disabled={isLoading || connectionStatus === 'connected'}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <QrCode className="h-4 w-4 mr-2" />
              )}
              {connectionStatus === 'connected' ? 'Conectado' : 'Gerar QR Code'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-orange-500" />
              Instruções de Conexão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Abra o WhatsApp Business</p>
                  <p className="text-sm text-gray-600">No seu dispositivo móvel</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">Acesse as Configurações</p>
                  <p className="text-sm text-gray-600">Toque em "Dispositivos conectados"</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium">Conectar dispositivo</p>
                  <p className="text-sm text-gray-600">Toque em "Conectar um dispositivo"</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  4
                </div>
                <div>
                  <p className="font-medium">Escaneie o QR Code</p>
                  <p className="text-sm text-gray-600">Aponte a câmera para o código acima</p>
                </div>
              </div>
            </div>

            {connectionStatus === 'connected' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-medium">WhatsApp conectado com sucesso!</p>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Agora você pode receber e enviar mensagens através do sistema.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConectarWhatsApp;
