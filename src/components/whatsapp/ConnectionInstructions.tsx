
import { Smartphone, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConnectionInstructionsProps {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'demo';
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
        {connectionStatus === 'demo' ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Info className="h-5 w-5" />
              <p className="font-medium">Modo Demonstração</p>
            </div>
            <p className="text-sm text-blue-600 mb-3">
              O WhatsApp está funcionando em modo demonstração. Para ativar a funcionalidade completa:
            </p>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Configure um servidor Node.js com whatsapp-web.js</li>
              <li>• Adicione a variável WHATSAPP_SERVER_URL nas configurações</li>
              <li>• Reinicie a aplicação</li>
            </ul>
          </div>
        ) : (
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
        )}

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
