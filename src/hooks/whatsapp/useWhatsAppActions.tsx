
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { whatsappLogger } from '@/utils/whatsappLogger';

interface WhatsAppActionsHook {
  isLoading: boolean;
  generateQRCode: (
    setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'demo') => void,
    setQrCode: (qrCode: string | null) => void
  ) => Promise<void>;
  disconnect: (
    setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'demo') => void,
    setQrCode: (qrCode: string | null) => void,
    setClientInfo: (info: any) => void
  ) => Promise<void>;
}

export const useWhatsAppActions = (): WhatsAppActionsHook => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateQRCode = async (
    setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'demo') => void,
    setQrCode: (qrCode: string | null) => void
  ) => {
    whatsappLogger.step(1, 'INICIANDO GERAÇÃO QR CODE');
    setIsLoading(true);
    setConnectionStatus('connecting');
    setQrCode(null); // Limpar QR code anterior
    
    try {
      whatsappLogger.step(2, 'Calling whatsapp-integration/initialize...');
      const { data, error } = await supabase.functions.invoke('whatsapp-integration/initialize');
      
      whatsappLogger.step(3, 'RAW RESPONSE DATA:', data);
      whatsappLogger.step(4, 'RAW ERROR:', error);
      
      if (error) {
        whatsappLogger.step(5, 'Supabase function error detected:', error);
        throw new Error(error.message || 'Erro ao chamar função');
      }
      
      if (data?.success) {
        whatsappLogger.step(6, 'Success=true detected, analyzing response structure...');
        whatsappLogger.step(7, `data.data exists? ${!!data.data}`);
        whatsappLogger.step(8, `data.qrCode exists? ${!!data.qrCode}`);
        whatsappLogger.step(9, `data.status value: ${data.status}`);
        whatsappLogger.step(10, `data.message value: ${data.message}`);
        
        if (data.status === 'demo') {
          whatsappLogger.step(11, 'Demo mode detected');
          setConnectionStatus('demo');
          setQrCode(data.qrCode);
          toast({
            title: "Modo Demonstração",
            description: "WhatsApp está em modo demonstração. Configure um servidor para uso real.",
            variant: "default",
          });
        } else if (data.data?.qrCode) {
          whatsappLogger.step(12, 'QR Code found in data.data.qrCode');
          whatsappLogger.step(13, 'QR Code preview:', data.data.qrCode.substring(0, 100) + '...');
          setQrCode(data.data.qrCode);
          setConnectionStatus('connecting');
          toast({
            title: "QR Code gerado",
            description: "Escaneie o código com seu WhatsApp Business para conectar.",
          });
        } else if (data.qrCode) {
          whatsappLogger.step(14, 'QR Code found in data.qrCode');
          whatsappLogger.step(15, 'QR Code preview:', data.qrCode.substring(0, 100) + '...');
          setQrCode(data.qrCode);
          setConnectionStatus('connecting');
          toast({
            title: "QR Code gerado",
            description: "Escaneie o código com seu WhatsApp Business para conectar.",
          });
        } else {
          whatsappLogger.step(16, 'NO QR CODE FOUND in response!');
          whatsappLogger.step(17, 'Available keys in data:', Object.keys(data));
          whatsappLogger.step(18, 'Available keys in data.data:', data.data ? Object.keys(data.data) : 'data.data is null/undefined');
          whatsappLogger.step(19, 'Server message:', data.message);
          
          setConnectionStatus('connecting');
          toast({
            title: "Inicialização iniciada",
            description: "Aguardando QR Code do servidor... Isso pode levar alguns segundos.",
          });
          
          // Tentar verificar status em alguns segundos para pegar o QR Code
          whatsappLogger.step(20, 'Setting timeout to check for QR Code...');
          setTimeout(async () => {
            whatsappLogger.step(21, 'Timeout triggered, checking status for QR Code...');
            const { data: statusData } = await supabase.functions.invoke('whatsapp-integration/status');
            whatsappLogger.step(22, 'Status check response:', statusData);
            if (statusData?.qrCode) {
              whatsappLogger.step(23, 'QR Code found after timeout!');
              setQrCode(statusData.qrCode);
            } else {
              whatsappLogger.step(24, 'Still no QR Code after timeout ❌');
            }
          }, 3000);
        }
      } else {
        whatsappLogger.step(25, 'Success=false or missing:', data);
        throw new Error(data?.error || 'Falha ao gerar QR Code - success=false');
      }
    } catch (error: any) {
      whatsappLogger.step(26, 'CRITICAL ERROR in generateQRCode:', error);
      whatsappLogger.error('Error details', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      toast({
        title: "Erro",
        description: `Não foi possível gerar o QR Code: ${error.message}`,
        variant: "destructive",
      });
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async (
    setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'demo') => void,
    setQrCode: (qrCode: string | null) => void,
    setClientInfo: (info: any) => void
  ) => {
    whatsappLogger.info('=== INICIANDO DESCONEXÃO ===');
    setIsLoading(true);
    
    try {
      whatsappLogger.info('Calling whatsapp-integration/disconnect...');
      const { data, error } = await supabase.functions.invoke('whatsapp-integration/disconnect');
      
      whatsappLogger.info('Disconnect response:', { data, error });
      
      if (error) {
        whatsappLogger.error('Supabase function error:', error);
        throw new Error(error.message || 'Erro ao desconectar');
      }
      
      if (data?.success) {
        whatsappLogger.info('✅ Disconnect success');
        setConnectionStatus('disconnected');
        setQrCode(null);
        setClientInfo(null);
        toast({
          title: "Desconectado",
          description: "WhatsApp foi desconectado com sucesso.",
        });
      } else {
        whatsappLogger.error('❌ Disconnect failed:', data);
        throw new Error(data?.error || 'Falha ao desconectar');
      }
    } catch (error) {
      whatsappLogger.error('❌ Erro na desconexão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desconectar. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    generateQRCode,
    disconnect,
  };
};
