
import { QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QRCodeDisplayProps {
  qrCode: string | null;
  isLoading: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  onGenerateQR: () => void;
}

export const QRCodeDisplay = ({ qrCode, isLoading, connectionStatus, onGenerateQR }: QRCodeDisplayProps) => {
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
          onClick={onGenerateQR}
          disabled={isLoading || connectionStatus === 'connected'}
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
        >
          {connectionStatus === 'connected' ? 'Conectado' : 'Gerar QR Code'}
        </Button>
      </CardContent>
    </Card>
  );
};
