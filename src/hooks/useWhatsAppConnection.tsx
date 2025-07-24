
import { useWhatsAppStatus } from './whatsapp/useWhatsAppStatus';
import { useWhatsAppActions } from './whatsapp/useWhatsAppActions';
import { whatsappLogger } from '@/utils/whatsappLogger';

interface WhatsAppConnectionHook {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'demo';
  qrCode: string | null;
  isLoading: boolean;
  clientInfo: Record<string, unknown> | null;
  isActionsDisabled: boolean;
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
    isActionsDisabled,
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
    isLoading,
    isActionsDisabled
  });

  return {
    connectionStatus,
    qrCode,
    isLoading,
    clientInfo,
    isActionsDisabled,
    generateQRCode,
    disconnect,
  };
};
