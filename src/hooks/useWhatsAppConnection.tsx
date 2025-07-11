import { useWhatsAppStatus } from './whatsapp/useWhatsAppStatus';
import { useWhatsAppActions } from './whatsapp/useWhatsAppActions';
import { whatsappLogger } from '@/utils/whatsappLogger';

interface WhatsAppConnectionHook {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'demo' | 'no_connection';
  qrCode: string | null;
  isLoading: boolean;
  clientInfo: any;
  generateQRCode: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useWhatsAppConnection = (): WhatsAppConnectionHook => {
  const {
    connectionStatus,
    qrCode,
    clientInfo,
    setConnectionStatus,
    setQrCode,
    setClientInfo,
  } = useWhatsAppStatus();

  const {
    isLoading,
    generateQRCode: generateQR,
    disconnect: disconnectAction,
  } = useWhatsAppActions();

  const generateQRCode = async () => {
    await generateQR(setConnectionStatus, setQrCode);
  };

  const disconnect = async () => {
    await disconnectAction(setConnectionStatus, setQrCode, setClientInfo);
  };

  whatsappLogger.info('Hook state:', { 
    connectionStatus, 
    qrCode: qrCode ? `presente (${qrCode.length} chars)` : 'null', 
    isLoading 
  });

  return {
    connectionStatus,
    qrCode,
    isLoading,
    clientInfo,
    generateQRCode,
    disconnect,
  };
};
