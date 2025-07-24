import { QrCode, PhoneOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QRCodeDisplayProps {
  qrCode: string | null;
  isLoading: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'demo';
  onGenerateQR: () => void;
  onDisconnect: () => void;
}

export const QRCodeDisplay = ({ qrCode, isLoading, connectionStatus, onGenerateQR, onDisconnect }: QRCodeDisplayProps) => {
  console.log('QRCodeDisplay props:', { 
    qrCode: qrCode ? 'presente' : 'null', 
    isLoading, 
    connectionStatus 
  });

  return (
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
              {connectionStatus === 'demo' ? (
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">QR Code Demo</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-green-600 mb-2">QR Code carregado com sucesso!</p>
                  <img 
                    src={qrCode} 
                    alt="QR Code WhatsApp" 
                    className="w-48 h-48"
                    onLoad={() => console.log('QR Code image loaded successfully')}
                    onError={(e) => console.error('QR Code image failed to load:', e)}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">
                {isLoading ? 'Gerando QR Code...' : 'QR Code será exibido aqui'}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            onClick={onGenerateQR}
            disabled={isLoading || connectionStatus === 'connected'}
            className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
          >
            {connectionStatus === 'connected' ? 'Conectado' : 
             connectionStatus === 'demo' ? 'Modo Demo Ativo' :
             isLoading ? 'Gerando...' :
             'Gerar QR Code'}
          </Button>

          {(connectionStatus === 'connected' || connectionStatus === 'demo') && (
            <Button 
              onClick={onDisconnect}
              disabled={isLoading}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <PhoneOff className="h-4 w-4" />
              Desconectar
            </Button>
          )}
        </div>

        {connectionStatus === 'demo' && (
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium">Modo Demonstração Ativo</p>
            <p>Configure um servidor WhatsApp para ativar a funcionalidade completa.</p>
          </div>
        )}

        {qrCode && connectionStatus !== 'demo' && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            <p className="font-medium">QR Code Ativo</p>
            <p>Escaneie com seu WhatsApp Business para conectar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
