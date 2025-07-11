import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { whatsappLogger } from '@/utils/whatsappLogger';
import { useClinic } from '@/contexts/ClinicContext';

interface WhatsAppStatusHook {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'demo' | 'no_connection';
  qrCode: string | null;
  clientInfo: any;
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'demo' | 'no_connection') => void;
  setQrCode: (qrCode: string | null) => void;
  setClientInfo: (info: any) => void;
}

export const useWhatsAppStatus = (): WhatsAppStatusHook => {
  const { selectedClinic } = useClinic();
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'demo' | 'no_connection'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);

  // Verificar se há conexão WhatsApp para a clínica
  useEffect(() => {
    const checkWhatsAppConnection = async () => {
      if (!selectedClinic) {
        setConnectionStatus('no_connection');
        return;
      }

      try {
        // Verificar se existe conexão WhatsApp para a clínica
        const { data: connections, error } = await supabase
          .from('whatsapp_connections')
          .select('*')
          .eq('clinic_id', selectedClinic.id)
          .eq('is_active', true);

        if (error) {
          whatsappLogger.error('Error checking WhatsApp connections:', error);
          setConnectionStatus('no_connection');
          return;
        }

        if (!connections || connections.length === 0) {
          // Não há conexão WhatsApp configurada para esta clínica
          setConnectionStatus('no_connection');
          setQrCode(null);
          setClientInfo(null);
          return;
        }

        // Há conexão configurada, verificar status
        checkStatus();
      } catch (error) {
        whatsappLogger.error('Error checking WhatsApp connection:', error);
        setConnectionStatus('no_connection');
      }
    };

    checkWhatsAppConnection();
  }, [selectedClinic]);

  // Verificar status da conexão
  const checkStatus = async () => {
    try {
      whatsappLogger.info('Checking WhatsApp status...');
      const { data, error } = await supabase.functions.invoke('whatsapp-integration/status');
      
      if (error) {
        whatsappLogger.error('Error checking WhatsApp status:', error);
        setConnectionStatus('disconnected');
        return;
      }
      
      whatsappLogger.info('Status response from hook:', data);
      
      if (data?.status) {
        whatsappLogger.info('Setting connection status to:', data.status);
        
        if (data.status === 'connected' && data.clientInfo) {
          setConnectionStatus('connected');
          setClientInfo(data.clientInfo);
          setQrCode(null);
          whatsappLogger.info('WhatsApp connected, client info:', data.clientInfo);
          return;
        }
        
        if (data.status === 'demo') {
          setConnectionStatus('demo');
          setQrCode(data.qrCode || null);
          setClientInfo(null);
          return;
        }
        
        if (data.status === 'disconnected') {
          setConnectionStatus('disconnected');
          setQrCode(null);
          setClientInfo(null);
          return;
        }
        
        if (data.status === 'connecting' && data.qrCode) {
          setConnectionStatus('connecting');
          setQrCode(data.qrCode);
          setClientInfo(null);
          return;
        }
        
        if (data.status === 'connecting' && data.clientInfo?.number) {
          setConnectionStatus('connected');
          setClientInfo(data.clientInfo);
          setQrCode(null);
          whatsappLogger.info('WhatsApp already connected, updating status');
          return;
        }
        
        setConnectionStatus(data.status);
        
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
      setConnectionStatus('disconnected');
    }
  };

  // Verificar status periodicamente apenas se há conexão configurada
  useEffect(() => {
    if (connectionStatus === 'no_connection') {
      return; // Não verificar periodicamente se não há conexão
    }

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
