
import { Smartphone, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConnectionInstructionsProps {
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  clientInfo: any;
}

export const ConnectionInstructions = ({ connectionStatus, clientInfo }: ConnectionInstructionsProps) => {
  return (
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

        {connectionStatus === 'connected' && clientInfo && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">WhatsApp conectado com sucesso!</p>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Número: {clientInfo.number || 'Não informado'}
            </p>
            <p className="text-sm text-green-600">
              Agora você pode receber e enviar mensagens através do sistema.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
