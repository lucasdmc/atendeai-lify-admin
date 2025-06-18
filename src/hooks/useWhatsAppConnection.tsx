
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppConnectionHook {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'demo';
  qrCode: string | null;
  isLoading: boolean;
  clientInfo: any;
  generateQRCode: () => Promise<void>;
}

export const useWhatsAppConnection = (): WhatsAppConnectionHook => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'demo'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const { toast } = useToast();

  // Verificar status da conexão periodicamente
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('whatsapp-integration/status');
        
        if (error) {
          console.error('Error checking WhatsApp status:', error);
          return;
        }
        
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

  const generateQRCode = async () => {
    setIsLoading(true);
    setConnectionStatus('connecting');
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-integration/initialize');
      
      if (error) {
        throw new Error(error.message || 'Erro ao chamar função');
      }
      
      if (data?.success) {
        if (data.status === 'demo') {
          setConnectionStatus('demo');
          setQrCode(data.qrCode);
          toast({
            title: "Modo Demonstração",
            description: "WhatsApp está em modo demonstração. Configure um servidor para uso real.",
            variant: "default",
          });
        } else if (data.qrCode) {
          setQrCode(data.qrCode);
          toast({
            title: "QR Code gerado",
            description: "Escaneie o código com seu WhatsApp Business para conectar.",
          });
        } else {
          toast({
            title: "Inicialização iniciada",
            description: data.message || "Verifique o status para obter o QR Code.",
          });
        }
      } else {
        throw new Error(data?.error || 'Falha ao gerar QR Code');
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
