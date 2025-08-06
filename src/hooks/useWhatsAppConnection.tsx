
import { useWhatsAppStatus } from './whatsapp/useWhatsAppStatus';
import { useWhatsAppActions } from './whatsapp/useWhatsAppActions';
import { whatsappLogger } from '@/utils/whatsappLogger';

interface WhatsAppConnectionHook {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'demo';
  isLoading: boolean;
  clientInfo: Record<string, unknown> | null;
  isActionsDisabled: boolean;
  disconnect: () => Promise<void>;
}

export const useWhatsAppConnection = (): WhatsAppConnectionHook => {
  const {
    connectionStatus,
    clientInfo,
    setConnectionStatus,
    setClientInfo,
  } = useWhatsAppStatus();

  const {
    isLoading,
    isActionsDisabled,
    disconnect: disconnectAction,
  } = useWhatsAppActions();

  const disconnect = async () => {
    await disconnectAction(setConnectionStatus, setClientInfo);
  };

  whatsappLogger.info('Hook state:', { 
    connectionStatus, 
    isLoading,
    isActionsDisabled
  });

  return {
    connectionStatus,
    isLoading,
    clientInfo,
    isActionsDisabled,
    disconnect,
  };
};
