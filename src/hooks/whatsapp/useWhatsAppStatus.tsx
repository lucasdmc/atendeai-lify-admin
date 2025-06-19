
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { whatsappLogger } from '@/utils/whatsappLogger';

interface WhatsAppStatusHook {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'demo';
  qrCode: string | null;
  clientInfo: any;
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'demo') => void;
  setQrCode: (qrCode: string | null) => void;
  setClientInfo: (info: any) => void;
}

export const useWhatsAppStatus = (): WhatsAppStatusHook => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'demo'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);

  // Verificar status da conexão periodicamente
  useEffect(() => {
    const checkStatus = async () => {
      try {
        whatsappLogger.info('Checking WhatsApp status...');
        const { data, error } = await supabase.functions.invoke('whatsapp-integration/status');
        
        if (error) {
          whatsappLogger.error('Error checking WhatsApp status:', error);
          return;
        }
        
        whatsappLogger.info('Status response from hook:', data);
        
        if (data?.status) {
          whatsappLogger.info('Setting connection status to:', data.status);
          setConnectionStatus(data.status);
          
          // Se recebeu QR Code no status, atualizar
          if (data.qrCode) {
            whatsappLogger.info('QR Code received in status check:', data.qrCode.substring(0, 50) + '...');
            setQrCode(data.qrCode);
          }
          
          if (data.clientInfo) {
            setClientInfo(data.clientInfo);
          }
        }
      } catch (error) {
        whatsappLogger.error('Error checking WhatsApp status:', error);
      }
    };

    // Verificar status inicial
    checkStatus();
    
    // Verificar status a cada 5 segundos apenas se não estiver em modo demo
    const interval = setInterval(() => {
      if (connectionStatus !== 'demo') {
        checkStatus();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [connectionStatus]);

  return {
    connectionStatus,
    qrCode,
    clientInfo,
    setConnectionStatus,
    setQrCode,
    setClientInfo,
  };
};
