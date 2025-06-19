
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
    console.log('=== INICIANDO GERAÇÃO QR CODE ===');
    setIsLoading(true);
    setConnectionStatus('connecting');
    setQrCode(null); // Limpar QR code anterior
    
    try {
      console.log('Calling whatsapp-integration/initialize...');
      const { data, error } = await supabase.functions.invoke('whatsapp-integration/initialize');
      
      console.log('Initialize response completa:', JSON.stringify(data, null, 2));
      console.log('Initialize error:', error);
      
      if (error) {
        console.error('❌ Supabase function error:', error);
        throw new Error(error.message || 'Erro ao chamar função');
      }
      
      if (data?.success) {
        console.log('✅ Initialize success, analisando data...');
        
        if (data.status === 'demo') {
          console.log('🔧 Configurando modo demo');
          setConnectionStatus('demo');
          setQrCode(data.qrCode);
          toast({
            title: "Modo Demonstração",
            description: "WhatsApp está em modo demonstração. Configure um servidor para uso real.",
            variant: "default",
          });
        } else if (data.data?.qrCode) {
          console.log('📱 QR Code encontrado em data.data.qrCode');
          setQrCode(data.data.qrCode);
          setConnectionStatus('connecting');
          toast({
            title: "QR Code gerado",
            description: "Escaneie o código com seu WhatsApp Business para conectar.",
          });
        } else if (data.qrCode) {
          console.log('📱 QR Code encontrado em data.qrCode');
          setQrCode(data.qrCode);
          setConnectionStatus('connecting');
          toast({
            title: "QR Code gerado",
            description: "Escaneie o código com seu WhatsApp Business para conectar.",
          });
        } else {
          console.log('⚠️ Nenhum QR Code retornado, mas inicialização foi bem-sucedida');
          console.log('Message from server:', data.message);
          setConnectionStatus('connecting');
          toast({
            title: "Inicialização iniciada",
            description: data.message || "Aguarde... O QR Code pode aparecer em alguns segundos.",
          });
          
          // Tentar verificar status em alguns segundos para pegar o QR Code
          setTimeout(async () => {
            console.log('🔄 Tentando buscar QR Code após delay...');
            const { data: statusData } = await supabase.functions.invoke('whatsapp-integration/status');
            console.log('Status após delay:', statusData);
            if (statusData?.qrCode) {
              console.log('✅ QR Code encontrado após delay!');
              setQrCode(statusData.qrCode);
            }
          }, 3000);
        }
      } else {
        console.error('❌ Initialize failed:', data);
        throw new Error(data?.error || 'Falha ao gerar QR Code');
      }
    } catch (error) {
      console.error('❌ Erro crítico na geração do QR code:', error);
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
