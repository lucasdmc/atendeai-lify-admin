
import { QRCodeDisplay } from '@/components/whatsapp/QRCodeDisplay';
import { ConnectionInstructions } from '@/components/whatsapp/ConnectionInstructions';
import { ConnectionStatus } from '@/components/whatsapp/ConnectionStatus';
import { useWhatsAppConnection } from '@/hooks/useWhatsAppConnection';

const ConectarWhatsApp = () => {
  const {
    connectionStatus,
    qrCode,
    isLoading,
    clientInfo,
    generateQRCode,
    disconnect,
  } = useWhatsAppConnection();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conectar WhatsApp Business</h1>
          <p className="text-gray-600 mt-2">Conecte seu número do WhatsApp Business ao sistema</p>
        </div>
        <ConnectionStatus status={connectionStatus} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <QRCodeDisplay
          qrCode={qrCode}
          isLoading={isLoading}
          connectionStatus={connectionStatus}
          onGenerateQR={generateQRCode}
          onDisconnect={disconnect}
        />
        <ConnectionInstructions
          connectionStatus={connectionStatus}
          clientInfo={clientInfo}
        />
      </div>
    </div>
  );
};

export default ConectarWhatsApp;
