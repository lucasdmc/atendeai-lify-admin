
import { QRCodeDisplay } from '@/components/whatsapp/QRCodeDisplay';
import { QRCodeInstructions } from '@/components/whatsapp/QRCodeInstructions';
import { WhatsAppStatusCard } from '@/components/whatsapp/WhatsAppStatusCard';
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
      </div>

      {/* Status Card - Nova seção */}
      <WhatsAppStatusCard
        connectionStatus={connectionStatus}
        clientInfo={clientInfo}
        onReconnect={generateQRCode}
        onDisconnect={disconnect}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <QRCodeDisplay
          qrCode={qrCode}
          isLoading={isLoading}
          connectionStatus={connectionStatus}
          onGenerateQR={generateQRCode}
          onDisconnect={disconnect}
        />
        <QRCodeInstructions
          connectionStatus={connectionStatus}
        />
      </div>
    </div>
  );
};

export default ConectarWhatsApp;
