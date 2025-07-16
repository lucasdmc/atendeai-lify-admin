
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
    whatsappLogger.info('Iniciando geração do QR Code...');
    setIsLoading(true);
    setConnectionStatus('connecting');
    setQrCode(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-integration/initialize');
      
      if (error) {
        throw new Error(error.message || 'Erro ao chamar função');
      }
      
      if (data?.success) {
        // Se já está conectado
        if (data.status === 'connected' && data.clientInfo) {
          setConnectionStatus('connected');
          toast({
            title: "Já conectado",
            description: "WhatsApp já está conectado e funcionando.",
          });
          return;
        }
        
        // Se está em modo demo
        if (data.status === 'demo') {
          setConnectionStatus('demo');
          setQrCode(data.qrCode);
          toast({
            title: "Modo Demonstração",
            description: "WhatsApp está em modo demonstração. Configure um servidor para uso real.",
            variant: "default",
          });
          return;
        }
        
        // Se tem QR Code na resposta
        if (data.qrCode) {
          setQrCode(data.qrCode);
          setConnectionStatus('connecting');
          toast({
            title: "QR Code gerado",
            description: "Escaneie o código com seu WhatsApp Business para conectar.",
          });
          return;
        }
        
        // Se não tem QR Code, aguardar e verificar status
        setConnectionStatus('connecting');
        toast({
          title: "Inicialização iniciada",
          description: "Aguardando QR Code do servidor...",
        });
        
        // Verificar status após 2 segundos
        setTimeout(async () => {
          try {
            const { data: statusData } = await supabase.functions.invoke('whatsapp-integration/status');
            if (statusData?.qrCode) {
              setQrCode(statusData.qrCode);
            }
          } catch (statusError) {
            console.error('Erro ao verificar status:', statusError);
          }
        }, 2000);
        
      } else {
        throw new Error(data?.error || 'Falha ao gerar QR Code');
      }
    } catch (error: any) {
      console.error('Erro ao gerar QR Code:', error);
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
