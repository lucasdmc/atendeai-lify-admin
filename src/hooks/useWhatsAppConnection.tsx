
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppConnectionHook {
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  qrCode: string | null;
  isLoading: boolean;
  clientInfo: any;
  generateQRCode: () => Promise<void>;
}

export const useWhatsAppConnection = (): WhatsAppConnectionHook => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const { toast } = useToast();

  // Verificar status da conexão periodicamente
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data } = await supabase.functions.invoke('whatsapp-integration/status');
        if (data?.status) {
          setConnectionStatus(data.status);
          if (data.clientInfo) {
            setClientInfo(data.clientInfo);
          }
        }
      } catch (error) {
        console.error('Error checking WhatsApp status:', error);
      }
    };

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const generateQRCode = async () => {
    setIsLoading(true);
    setConnectionStatus('connecting');
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-integration/initialize');
      
      if (error) throw error;
      
      if (data.qrCode) {
        setQrCode(data.qrCode);
        toast({
          title: "QR Code gerado",
          description: "Escaneie o código com seu WhatsApp Business para conectar.",
        });
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o QR Code. Tente novamente.",
        variant: "destructive",
      });
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    connectionStatus,
    qrCode,
    isLoading,
    clientInfo,
    generateQRCode,
  };
};
