
import { useState, useEffect } from 'react';
import { whatsappLogger } from '@/utils/whatsappLogger';
import { config } from '@/config/environment';
import { useClinic } from '@/contexts/ClinicContext';

interface WhatsAppStatusHook {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'demo';
  qrCode: string | null;
  clientInfo: Record<string, unknown> | null;
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'demo') => void;
  setQrCode: (qrCode: string | null) => void;
  setClientInfo: (info: Record<string, unknown> | null) => void;
}

export const useWhatsAppStatus = (): WhatsAppStatusHook => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'demo'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
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
          setQrCode(null);
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
            setQrCode(null);
            setClientInfo(null);
            return;
          }

          // Para Meta API, usar o status da clínica diretamente
          const clinicStatus = selectedClinic.whatsapp_connection_status;
          whatsappLogger.info('Clinic Meta API status:', clinicStatus);
          
          if (clinicStatus === 'connected') {
            setConnectionStatus('connected');
            setQrCode(null);
            setClientInfo({
              provider: 'meta',
              phoneNumber: selectedClinic.whatsapp_phone_number,
              verified: selectedClinic.whatsapp_phone_number_verified
            });
          } else {
            setConnectionStatus('disconnected');
            setQrCode(null);
            setClientInfo(null);
          }
          return;
        }

        // Se a clínica usa Baileys, verificar status via backend
        if (selectedClinic.whatsapp_integration_type === 'baileys') {
          whatsappLogger.info('Clinic uses Baileys, checking backend status');
          
          const response = await fetch(`${config.backend.url}/api/whatsapp-integration/status?clinicId=${selectedClinic.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            whatsappLogger.error('Error checking WhatsApp status:', `HTTP ${response.status}`);
            return;
          }
          
          // Log da resposta bruta para debug
          const responseText = await response.text();
          whatsappLogger.info('Raw response:', responseText);
          
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            whatsappLogger.error('JSON parse error:', parseError);
            whatsappLogger.error('Response text:', responseText);
            return;
          }
          whatsappLogger.info('Status response from hook:', data);
          
          if (data?.status) {
            whatsappLogger.info('Setting connection status to:', data.status);
            
            // Verificar se realmente está conectado (tem clientInfo com connectedAt)
            if (data.status === 'connected' && data.clientInfo && data.clientInfo.connectedAt) {
              setConnectionStatus('connected');
              whatsappLogger.info('Confirmed Baileys connection with connectedAt:', data.clientInfo.connectedAt);
            } else if (data.status === 'connected' && (!data.clientInfo || !data.clientInfo.connectedAt)) {
              // Status diz connected mas não tem clientInfo válido, manter como connecting
              setConnectionStatus('connecting');
              whatsappLogger.info('Status says connected but no valid clientInfo, keeping as connecting');
            } else {
              setConnectionStatus(data.status);
            }
            
            // Se recebeu QR Code no status, atualizar
            if (data.qrCode) {
              whatsappLogger.info('QR Code received in status check:', data.qrCode.substring(0, 50) + '...');
              setQrCode(data.qrCode);
            } else if (data.status === 'connecting' && !data.qrCode && qrCode) {
              // Se está conectando mas não tem QR Code, manter o QR Code atual
              whatsappLogger.info('Status is connecting but no QR Code received, keeping current QR Code');
            } else if (data.status === 'connecting' && !data.qrCode && !qrCode) {
              // Se está conectando mas não tem QR Code e não tem QR Code atual, limpar status
              whatsappLogger.info('Status is connecting but no QR Code available, setting disconnected');
              setConnectionStatus('disconnected');
            } else if (data.status === 'connected' && !data.qrCode && qrCode) {
              // Se está conectado mas ainda tem QR Code, manter por mais um pouco para transição suave
              whatsappLogger.info('Status is connected but QR Code still present, keeping for smooth transition');
            } else if (data.status === 'disconnected' && qrCode) {
              // Se está desconectado mas tem QR Code, manter o QR Code por mais tempo
              whatsappLogger.info('Status is disconnected but QR Code still present, keeping for potential reconnection');
            }
            
            if (data.clientInfo) {
              setClientInfo(data.clientInfo);
              // Só limpar QR Code se realmente estiver conectado E tiver clientInfo válido E não estiver no processo de conexão
              if (data.status === 'connected' && data.clientInfo.provider === 'baileys' && data.clientInfo.connectedAt && connectionStatus !== 'connecting') {
                whatsappLogger.info('Baileys connected successfully, clearing QR Code');
                // Aguardar um pouco antes de limpar o QR Code para garantir que a conexão está estável
                setTimeout(() => {
                  setQrCode(null);
                }, 3000); // Aguardar 3 segundos antes de limpar
              }
            }
          }
          return;
        }

        // Se não tem tipo de integração definido, usar status desconectado
        whatsappLogger.info('No integration type defined for clinic');
        setConnectionStatus('disconnected');
        setQrCode(null);
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
    qrCode,
    clientInfo,
    setConnectionStatus,
    setQrCode,
    setClientInfo,
  };
};
