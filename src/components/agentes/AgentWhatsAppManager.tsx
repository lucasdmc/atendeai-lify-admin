import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';

interface AgentWhatsAppConnectionProps {
  id: string;
  agent_id: string;
  whatsapp_number: string;
  whatsapp_name: string;
  connection_status: 'disconnected' | 'connecting' | 'connected' | 'error';
  qr_code: string | null;
  client_info: any;
  last_connection_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AgentWhatsAppManagerProps {
  agentId: string;
  agentName: string;
}

const AgentWhatsAppManager = ({ agentId, agentName }: AgentWhatsAppManagerProps) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const { toast } = useToast();

  // Hook só para buscar conexões ativas (não para exibir QR Code)
  const {
    connections,
    isLoading,
    disconnect,
    loadConnections,
  } = useAgentWhatsAppConnection();

  // Gera e exibe o QR Code sem criar conexão
  const generateQRCodeForAgent = async () => {
    setIsGeneratingQR(true);
    setQrCode(null);
    try {
      const { data, error } = await supabase.functions.invoke('agent-whatsapp-manager/generate-qr', {
        body: { agentId }
      });
      if (error) throw new Error(error.message || 'Erro ao gerar QR Code');
      if (data?.qrCode) {
        setQrCode(data.qrCode);
        toast({
          title: "QR Code gerado",
          description: "Escaneie o código com seu WhatsApp Business para conectar.",
        });
      } else {
        toast({
          title: "Aguardando QR Code",
          description: "O servidor ainda não retornou o QR Code. Tente novamente em instantes.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Não foi possível gerar o QR Code: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Desconectar conexão ativa
  const handleDisconnectConnection = async (connectionId: string) => {
    await disconnect(agentId, connectionId);
    await loadConnections(agentId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">WhatsApp do Agente</h3>
          <p className="text-sm text-gray-600">Gerencie as conexões de WhatsApp para {agentName}</p>
        </div>
      </div>

      {/* Sempre mostrar o botão de gerar QR Code */}
      <div className="text-center mt-4">
        <Button
          onClick={generateQRCodeForAgent}
          disabled={isGeneratingQR}
          className="bg-green-600 hover:bg-green-700"
        >
          <QrCode className="h-4 w-4 mr-2" />
          {isGeneratingQR ? 'Gerando QR Code...' : 'Gerar QR Code'}
        </Button>
      </div>

      {/* Exibir QR Code assim que disponível */}
      <div className="text-center space-y-4 mt-6">
        {qrCode ? (
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
              <img 
                src={qrCode} 
                alt="QR Code WhatsApp" 
                className="w-48 h-48"
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">
                {isGeneratingQR ? 'Aguardando QR Code do servidor...' : 'QR Code será exibido aqui'}
              </p>
            </div>
          </div>
        )}
        <div className="text-sm text-gray-600">
          <p className="font-medium">Como conectar:</p>
          <ol className="mt-2 space-y-1 text-left">
            <li>1. Abra o WhatsApp Business no seu celular</li>
            <li>2. Toque em "Configurações" → "Dispositivos conectados"</li>
            <li>3. Toque em "Conectar um dispositivo"</li>
            <li>4. Aponte a câmera para o QR Code acima</li>
          </ol>
        </div>
      </div>

      {/* Exibir número conectado e botão de desconectar apenas se houver conexão ativa (connected) */}
      {connections.some(conn => conn.connection_status === 'connected') && (
        <div className="flex flex-col items-center gap-2 mt-4">
          <div className="text-base font-medium text-green-700">
            Número conectado: {connections.find(conn => conn.connection_status === 'connected')?.whatsapp_number}
          </div>
          <Button
            variant="destructive"
            onClick={() => handleDisconnectConnection(connections.find(conn => conn.connection_status === 'connected')!.id)}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <PhoneOff className="h-4 w-4" />
            Desconectar
          </Button>
        </div>
      )}
    </div>
  );
};

export default AgentWhatsAppManager; 