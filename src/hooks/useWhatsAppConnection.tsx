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
    console.log('🔥 === INICIANDO GERAÇÃO QR CODE ===');
    setIsLoading(true);
    setConnectionStatus('connecting');
    setQrCode(null); // Limpar QR code anterior
    
    try {
      console.log('🔥 Step 1: Calling whatsapp-integration/initialize...');
      const { data, error } = await supabase.functions.invoke('whatsapp-integration/initialize');
      
      console.log('🔥 Step 2: RAW RESPONSE DATA:', JSON.stringify(data, null, 2));
      console.log('🔥 Step 3: RAW ERROR:', JSON.stringify(error, null, 2));
      
      if (error) {
        console.error('🔥 Step 4: Supabase function error detected:', error);
        throw new Error(error.message || 'Erro ao chamar função');
      }
      
      if (data?.success) {
        console.log('🔥 Step 5: Success=true detected, analyzing response structure...');
        console.log('🔥 Step 6: data.data exists?', !!data.data);
        console.log('🔥 Step 7: data.qrCode exists?', !!data.qrCode);
        console.log('🔥 Step 8: data.status value:', data.status);
        console.log('🔥 Step 9: data.message value:', data.message);
        
        if (data.status === 'demo') {
          console.log('🔥 Step 10: Demo mode detected');
          setConnectionStatus('demo');
          setQrCode(data.qrCode);
          toast({
            title: "Modo Demonstração",
            description: "WhatsApp está em modo demonstração. Configure um servidor para uso real.",
            variant: "default",
          });
        } else if (data.data?.qrCode) {
          console.log('🔥 Step 11: QR Code found in data.data.qrCode');
          console.log('🔥 Step 12: QR Code preview:', data.data.qrCode.substring(0, 100) + '...');
          setQrCode(data.data.qrCode);
          setConnectionStatus('connecting');
          toast({
            title: "QR Code gerado",
            description: "Escaneie o código com seu WhatsApp Business para conectar.",
          });
        } else if (data.qrCode) {
          console.log('🔥 Step 13: QR Code found in data.qrCode');
          console.log('🔥 Step 14: QR Code preview:', data.qrCode.substring(0, 100) + '...');
          setQrCode(data.qrCode);
          setConnectionStatus('connecting');
          toast({
            title: "QR Code gerado",
            description: "Escaneie o código com seu WhatsApp Business para conectar.",
          });
        } else {
          console.log('🔥 Step 15: NO QR CODE FOUND in response!');
          console.log('🔥 Step 16: Available keys in data:', Object.keys(data));
          console.log('🔥 Step 17: Available keys in data.data:', data.data ? Object.keys(data.data) : 'data.data is null/undefined');
          console.log('🔥 Step 18: Server message:', data.message);
          
          setConnectionStatus('connecting');
          toast({
            title: "Inicialização iniciada",
            description: "Aguardando QR Code do servidor... Isso pode levar alguns segundos.",
          });
          
          // Tentar verificar status em alguns segundos para pegar o QR Code
          console.log('🔥 Step 19: Setting timeout to check for QR Code...');
          setTimeout(async () => {
            console.log('🔥 Step 20: Timeout triggered, checking status for QR Code...');
            const { data: statusData } = await supabase.functions.invoke('whatsapp-integration/status');
            console.log('🔥 Step 21: Status check response:', JSON.stringify(statusData, null, 2));
            if (statusData?.qrCode) {
              console.log('🔥 Step 22: QR Code found after timeout!');
              setQrCode(statusData.qrCode);
            } else {
              console.log('🔥 Step 23: Still no QR Code after timeout ❌');
            }
          }, 3000);
        }
      } else {
        console.error('🔥 Step 24: Success=false or missing:', data);
        throw new Error(data?.error || 'Falha ao gerar QR Code - success=false');
      }
    } catch (error: any) {
      console.error('🔥 Step 25: CRITICAL ERROR in generateQRCode:', error);
      console.error('🔥 Step 26: Error name:', error.name);
      console.error('🔥 Step 27: Error message:', error.message);
      console.error('🔥 Step 28: Error stack:', error.stack);
      
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

  const disconnect = async () => {
    console.log('=== INICIANDO DESCONEXÃO ===');
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
        console.log('✅ Disconnect success');
        setConnectionStatus('disconnected');
        setQrCode(null);
        setClientInfo(null);
        toast({
          title: "Desconectado",
          description: "WhatsApp foi desconectado com sucesso.",
        });
      } else {
        console.error('❌ Disconnect failed:', data);
        throw new Error(data?.error || 'Falha ao desconectar');
      }
    } catch (error) {
      console.error('❌ Erro na desconexão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desconectar. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  console.log('Hook state:', { 
    connectionStatus, 
    qrCode: qrCode ? `presente (${qrCode.length} chars)` : 'null', 
    isLoading 
  });

  return {
    connectionStatus,
    qrCode,
    isLoading,
    clientInfo,
    generateQRCode,
    disconnect,
  };
};
