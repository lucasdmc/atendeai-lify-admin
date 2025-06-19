
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppConnectionHook {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'demo';
  qrCode: string | null;
  isLoading: boolean;
  clientInfo: any;
  generateQRCode: () => Promise<void>;
  disconnect: () => Promise<void>;
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
        console.log('Checking WhatsApp status...');
        const { data, error } = await supabase.functions.invoke('whatsapp-integration/status');
        
        if (error) {
          console.error('Error checking WhatsApp status:', error);
          return;
        }
        
        console.log('Status response from hook:', data);
        
        if (data?.status) {
          console.log('Setting connection status to:', data.status);
          setConnectionStatus(data.status);
          
          // Se recebeu QR Code no status, atualizar
          if (data.qrCode) {
            console.log('QR Code received in status check:', data.qrCode.substring(0, 50) + '...');
            setQrCode(data.qrCode);
          }
          
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
    console.log('generateQRCode called');
    setIsLoading(true);
    setConnectionStatus('connecting');
    
    try {
      console.log('Calling whatsapp-integration/initialize...');
      const { data, error } = await supabase.functions.invoke('whatsapp-integration/initialize');
      
      console.log('Initialize response:', { data, error });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Erro ao chamar função');
      }
      
      if (data?.success) {
        console.log('Initialize success, data:', data);
        
        if (data.status === 'demo') {
          console.log('Setting demo mode');
          setConnectionStatus('demo');
          setQrCode(data.qrCode);
          toast({
            title: "Modo Demonstração",
            description: "WhatsApp está em modo demonstração. Configure um servidor para uso real.",
            variant: "default",
          });
        } else if (data.data?.qrCode) {
          console.log('QR Code received from initialize:', data.data.qrCode.substring(0, 50) + '...');
          setQrCode(data.data.qrCode);
          toast({
            title: "QR Code gerado",
            description: "Escaneie o código com seu WhatsApp Business para conectar.",
          });
        } else if (data.qrCode) {
          console.log('QR Code received directly:', data.qrCode.substring(0, 50) + '...');
          setQrCode(data.qrCode);
          toast({
            title: "QR Code gerado",
            description: "Escaneie o código com seu WhatsApp Business para conectar.",
          });
        } else {
          console.log('No QR Code in response, message:', data.message);
          toast({
            title: "Inicialização iniciada",
            description: data.message || "Verifique o status para obter o QR Code.",
          });
        }
      } else {
        console.error('Initialize failed:', data);
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

  const disconnect = async () => {
    console.log('disconnect called');
    setIsLoading(true);
    
    try {
      console.log('Calling whatsapp-integration/disconnect...');
      const { data, error } = await supabase.functions.invoke('whatsapp-integration/disconnect');
      
      console.log('Disconnect response:', { data, error });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Erro ao desconectar');
      }
      
      if (data?.success) {
        console.log('Disconnect success');
        setConnectionStatus('disconnected');
        setQrCode(null);
        setClientInfo(null);
        toast({
          title: "Desconectado",
          description: "WhatsApp foi desconectado com sucesso.",
        });
      } else {
        console.error('Disconnect failed:', data);
        throw new Error(data?.error || 'Falha ao desconectar');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desconectar. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  console.log('Hook state:', { connectionStatus, qrCode: qrCode ? 'presente' : 'null', isLoading });

  return {
    connectionStatus,
    qrCode,
    isLoading,
    clientInfo,
    generateQRCode,
    disconnect,
  };
};
