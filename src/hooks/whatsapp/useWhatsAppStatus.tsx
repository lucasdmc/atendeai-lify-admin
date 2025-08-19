
import { useState, useEffect } from 'react';
import { whatsappLogger } from '@/utils/whatsappLogger';
import { useClinic } from '@/contexts/ClinicContext';

interface WhatsAppStatusHook {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'demo';
  clientInfo: Record<string, unknown> | null;
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'demo') => void;
  setClientInfo: (info: Record<string, unknown> | null) => void;
}

export const useWhatsAppStatus = (): WhatsAppStatusHook => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'demo'>('disconnected');
  const [clientInfo, setClientInfo] = useState<Record<string, unknown> | null>(null);
  const { selectedClinic } = useClinic();

  // Verificar status da conexão periodicamente
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Se não há clínica selecionada, não verificar status
        if (!selectedClinic) {
          whatsappLogger.info('No clinic selected, skipping status check');
          setConnectionStatus('disconnected');
          setClientInfo(null);
          return;
        }

        whatsappLogger.info('Checking WhatsApp status for clinic:', selectedClinic.name);

        // Se a clínica usa Meta API, verificar status via API oficial
        if (selectedClinic.whatsapp_integration_type === 'meta_api') {
          whatsappLogger.info('Clinic uses Meta API, checking Meta API status');
          
          // Verificar se o número está verificado
          if (!selectedClinic.whatsapp_phone_number_verified) {
            whatsappLogger.info('Phone number not verified for Meta API');
            setConnectionStatus('disconnected');
            setClientInfo(null);
            return;
          }

          // Para Meta API, usar o status da clínica diretamente
          const clinicStatus = selectedClinic.whatsapp_connection_status;
          whatsappLogger.info('Clinic Meta API status:', clinicStatus);
          
          if (clinicStatus === 'connected') {
            setConnectionStatus('connected');
            setClientInfo({
              provider: 'meta',
              phoneNumber: selectedClinic.whatsapp_phone_number,
              verified: selectedClinic.whatsapp_phone_number_verified
            });
          } else {
            setConnectionStatus('disconnected');
            setClientInfo(null);
          }
          return;
        }

        // Se não tem tipo de integração definido, usar status desconectado
        whatsappLogger.info('No integration type defined for clinic');
        setConnectionStatus('disconnected');
        setClientInfo(null);

      } catch (error) {
        whatsappLogger.error('Error checking WhatsApp status:', error);
      }
    };

    // Verificar status inicial imediatamente
    checkStatus();
    
    // Verificar status novamente após 1 segundo para garantir detecção correta
    const initialCheck = setTimeout(() => {
      checkStatus();
    }, 1000);
    
    // Verificar status a cada 5 segundos apenas se não estiver em modo demo
    const interval = setInterval(() => {
      if (connectionStatus !== 'demo') {
        checkStatus();
      }
    }, 5000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(initialCheck);
    };
  }, [connectionStatus, selectedClinic]);

  return {
    connectionStatus,
    clientInfo,
    setConnectionStatus,
    setClientInfo,
  };
};
