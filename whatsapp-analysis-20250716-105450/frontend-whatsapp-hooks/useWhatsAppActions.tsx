
import { useState, useRef } from 'react';
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
  refreshQRCode: () => Promise<void>;
}

export const useWhatsAppActions = (): WhatsAppActionsHook => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const qrCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Função para limpar intervalos
  const clearIntervals = () => {
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
      statusCheckInterval.current = null;
    }
    if (qrCheckInterval.current) {
      clearInterval(qrCheckInterval.current);
      qrCheckInterval.current = null;
    }
  };

  const generateQRCode = async (
    setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'demo') => void,
    setQrCode: (qrCode: string | null) => void
  ) => {
    whatsappLogger.info('Iniciando geração do QR Code...');
    setIsLoading(true);
    setConnectionStatus('connecting');
    setQrCode(null);
    clearIntervals();
    
    try {
      // Primeira tentativa - gerar QR Code
      const { data, error } = await supabase.functions.invoke('agent-whatsapp-manager/generate-qr', {
        body: { agentId: 'default-agent' } // Usar ID do agente atual
      });
      
      if (error) {
        throw new Error(error.message || 'Erro ao chamar função');
      }
      
      whatsappLogger.info('Resposta da Edge Function:', data);
      
      if (data?.success) {
        // Se já tem QR Code
        if (data.qrCode) {
          setQrCode(data.qrCode);
          toast({
            title: "QR Code gerado",
            description: "Escaneie o código com seu WhatsApp Business para conectar.",
          });
          
          // Iniciar verificação de status
          startStatusCheck(setConnectionStatus, setQrCode);
        } else {
          // Se não tem QR Code ainda, verificar periodicamente
          toast({
            title: "Inicializando WhatsApp",
            description: "Aguardando geração do QR Code...",
          });
          
          // Verificar QR Code a cada 2 segundos
          let attempts = 0;
          qrCheckInterval.current = setInterval(async () => {
            attempts++;
            
            try {
              const { data: statusData } = await supabase.functions.invoke('agent-whatsapp-manager/status', {
                body: { agentId: 'default-agent' }
              });
              
              if (statusData?.qrCode) {
                whatsappLogger.info('QR Code recebido após tentativa', attempts);
                setQrCode(statusData.qrCode);
                clearInterval(qrCheckInterval.current!);
                qrCheckInterval.current = null;
                
                toast({
                  title: "QR Code pronto",
                  description: "Escaneie o código para conectar.",
                });
                
                // Iniciar verificação de status
                startStatusCheck(setConnectionStatus, setQrCode);
              }
              
              // Timeout após 30 segundos (15 tentativas)
              if (attempts >= 15) {
                clearInterval(qrCheckInterval.current!);
                qrCheckInterval.current = null;
                throw new Error('Timeout ao aguardar QR Code');
              }
            } catch (error) {
              whatsappLogger.error('Erro ao verificar QR Code:', error);
              clearInterval(qrCheckInterval.current!);
              qrCheckInterval.current = null;
            }
          }, 2000);
        }
      } else {
        throw new Error(data?.error || 'Falha ao gerar QR Code');
      }
    } catch (error: any) {
      whatsappLogger.error('Erro ao gerar QR Code:', error);
      
      // Tratamento específico de erros
      let errorMessage = 'Não foi possível gerar o QR Code';
      
      if (error.message.includes('timeout')) {
        errorMessage = 'Tempo esgotado ao tentar gerar o QR Code';
      } else if (error.message.includes('502')) {
        errorMessage = 'Servidor WhatsApp não está respondendo';
      } else if (error.message.includes('404')) {
        errorMessage = 'Agente não encontrado';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      
      setConnectionStatus('disconnected');
      clearIntervals();
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
    clearIntervals();
    
    try {
      const { data, error } = await supabase.functions.invoke('agent-whatsapp-manager/disconnect', {
        body: { agentId: 'default-agent' }
      });
      
      if (error) {
        throw new Error(error.message || 'Erro ao desconectar');
      }
      
      if (data?.success) {
        whatsappLogger.info('✅ Desconexão bem sucedida');
        setConnectionStatus('disconnected');
        setQrCode(null);
        setClientInfo(null);
        
        toast({
          title: "Desconectado",
          description: "WhatsApp foi desconectado com sucesso.",
        });
      } else {
        throw new Error(data?.error || 'Falha ao desconectar');
      }
    } catch (error: any) {
      whatsappLogger.error('❌ Erro na desconexão:', error);
      
      // Mesmo com erro, limpar estado local
      setConnectionStatus('disconnected');
      setQrCode(null);
      setClientInfo(null);
      
      toast({
        title: "Aviso",
        description: "Desconexão forçada localmente. Verifique o servidor.",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para verificar status periodicamente
  const startStatusCheck = (
    setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'demo') => void,
    setQrCode: (qrCode: string | null) => void
  ) => {
    let checkCount = 0;
    
    statusCheckInterval.current = setInterval(async () => {
      checkCount++;
      
      try {
        const { data: statusData } = await supabase.functions.invoke('agent-whatsapp-manager/status', {
          body: { agentId: 'default-agent' }
        });
        
        if (statusData?.status === 'connected') {
          whatsappLogger.info('WhatsApp conectado com sucesso!');
          setConnectionStatus('connected');
          setQrCode(null);
          clearInterval(statusCheckInterval.current!);
          statusCheckInterval.current = null;
          
          toast({
            title: "Conectado!",
            description: "WhatsApp Business conectado com sucesso.",
            variant: "default",
          });
        }
        
        // Timeout após 5 minutos (60 verificações de 5 segundos)
        if (checkCount >= 60) {
          clearInterval(statusCheckInterval.current!);
          statusCheckInterval.current = null;
          
          toast({
            title: "Tempo esgotado",
            description: "QR Code expirou. Gere um novo código.",
            variant: "destructive",
          });
          
          setConnectionStatus('disconnected');
          setQrCode(null);
        }
      } catch (error) {
        whatsappLogger.error('Erro ao verificar status:', error);
      }
    }, 5000); // Verificar a cada 5 segundos
  };

  // Função para forçar novo QR Code
  const refreshQRCode = async () => {
    whatsappLogger.info('Forçando novo QR Code...');
    setIsLoading(true);
    clearIntervals();
    
    try {
      const { data, error } = await supabase.functions.invoke('agent-whatsapp-manager/refresh-qr', {
        body: { agentId: 'default-agent' }
      });
      
      if (error) {
        throw new Error(error.message || 'Erro ao atualizar QR Code');
      }
      
      if (data?.success) {
        toast({
          title: "QR Code atualizado",
          description: "Novo QR Code será gerado em instantes.",
        });
      } else {
        throw new Error(data?.error || 'Falha ao atualizar QR Code');
      }
    } catch (error: any) {
      whatsappLogger.error('Erro ao atualizar QR Code:', error);
      toast({
        title: "Erro",
        description: `Não foi possível atualizar o QR Code: ${error.message}`,
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
    refreshQRCode,
  };
};
