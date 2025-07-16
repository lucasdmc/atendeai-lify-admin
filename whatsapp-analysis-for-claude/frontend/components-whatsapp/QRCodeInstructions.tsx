
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Smartphone, Wifi, RefreshCw } from 'lucide-react';

interface QRCodeInstructionsProps {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'demo';
  steps?: string[];
}

export const QRCodeInstructions = ({ connectionStatus, steps }: QRCodeInstructionsProps) => {
  const defaultSteps = [
    "Abra o WhatsApp Business no seu celular",
    "Toque em 'Configurações' → 'Dispositivos conectados'",
    "Toque em 'Conectar um dispositivo'",
    "Aponte a câmera para o QR Code ao lado"
  ];

  const currentSteps = steps || defaultSteps;

  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          title: "WhatsApp Conectado!",
          description: "Seu WhatsApp Business está conectado e funcionando.",
          badgeColor: "bg-green-100 text-green-800",
          badgeText: "Conectado"
        };
      case 'connecting':
        return {
          icon: <RefreshCw className="h-5 w-5 text-yellow-600 animate-spin" />,
          title: "Conectando...",
          description: "Aguardando a leitura do QR Code.",
          badgeColor: "bg-yellow-100 text-yellow-800",
          badgeText: "Conectando"
        };
      case 'demo':
        return {
          icon: <AlertCircle className="h-5 w-5 text-blue-600" />,
          title: "Modo Demonstração",
          description: "Configure um servidor WhatsApp para uso completo.",
          badgeColor: "bg-blue-100 text-blue-800",
          badgeText: "Demo"
        };
      default:
        return {
          icon: <Smartphone className="h-5 w-5 text-gray-600" />,
          title: "Como Conectar",
          description: "Siga os passos abaixo para conectar seu WhatsApp.",
          badgeColor: "bg-gray-100 text-gray-800",
          badgeText: "Desconectado"
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {statusInfo.icon}
            {statusInfo.title}
          </CardTitle>
          <Badge className={statusInfo.badgeColor}>
            {statusInfo.badgeText}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600 text-sm">{statusInfo.description}</p>

        {connectionStatus !== 'connected' && connectionStatus !== 'demo' && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Passos para conectar:</h4>
            <ol className="space-y-2">
              {currentSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {connectionStatus === 'demo' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900">Configuração necessária</h4>
                <p className="text-sm text-blue-700">
                  Para ativar o WhatsApp real, configure a variável WHATSAPP_SERVER_URL 
                  com o endereço do seu servidor WhatsApp Business.
                </p>
              </div>
            </div>
          </div>
        )}

        {connectionStatus === 'connected' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-medium text-green-900">Tudo pronto!</h4>
                <p className="text-sm text-green-700">
                  Seu WhatsApp está conectado e pronto para receber e enviar mensagens.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Wifi className="h-4 w-4 text-gray-500" />
          <span className="text-xs text-gray-600">
            Certifique-se de que seu celular está conectado à internet
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
