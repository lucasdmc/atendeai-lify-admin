import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { whatsappLogger } from '@/utils/whatsappLogger';
import { config } from '@/config/environment';
import { useClinic } from '@/contexts/ClinicContext';

interface WhatsAppActionsHook {
  isLoading: boolean;
  isActionsDisabled: boolean;
  generateQRCode: (
    setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'demo') => void,
    setQrCode: (qrCode: string | null) => void
  ) => Promise<void>;
  disconnect: (
    setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'demo') => void,
    setQrCode: (qrCode: string | null) => void,
    setClientInfo: (info: Record<string, unknown> | null) => void
  ) => Promise<void>;
  refreshQRCode: () => Promise<void>;
}

export const useWhatsAppActions = (): WhatsAppActionsHook => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { selectedClinic } = useClinic();
  const qrCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Verificar se as ações devem ser desabilitadas
  const isActionsDisabled = !selectedClinic || selectedClinic.whatsapp_integration_type === 'meta_api';

  const clearIntervals = () => {
    if (qrCheckInterval.current) {
      clearInterval(qrCheckInterval.current);
      qrCheckInterval.current = null;
    }
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
      statusCheckInterval.current = null;
    }
  };

  const generateQRCode = async (
    setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'demo') => void,
    setQrCode: (qrCode: string | null) => void
  ) => {
    // Verificar se as ações estão desabilitadas
    if (isActionsDisabled) {
      toast({
        title: "Ação não disponível",
        description: "Esta ação não está disponível para clínicas com integração Meta API.",
        variant: "destructive",
      });
      return;
    }

    whatsappLogger.info('Iniciando geração do QR Code...');
    setIsLoading(true);
    setConnectionStatus('connecting');
    setQrCode(null);
    clearIntervals();
    
    try {
      // Chamar backend para gerar QR Code
      const response = await fetch(`${config.backend.url}/api/whatsapp-integration/generate-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinicId: selectedClinic.id
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Log da resposta bruta para debug
      const responseText = await response.text();
      whatsappLogger.info('Raw response from generateQRCode:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        whatsappLogger.error('JSON parse error in generateQRCode:', parseError);
        whatsappLogger.error('Response text:', responseText);
        throw new Error('Invalid JSON response from server');
      }
      
      whatsappLogger.info('Resposta do Backend:', data);
      
      if (data?.success) {
        // Se já está conectado
        if (data.status === 'connected' && data.clientInfo) {
          whatsappLogger.info('WhatsApp já está conectado, atualizando estado');
          setConnectionStatus('connected');
          setQrCode(null); // Limpar QR Code quando conectado
          
          toast({
            title: "WhatsApp Conectado",
            description: "Seu WhatsApp Business já está conectado e funcionando.",
          });
          
          return; // Sair da função
        }
        
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
              const statusResponse = await fetch(`${config.backend.url}/api/whatsapp-integration/status?clinicId=${selectedClinic.id}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
              });
              
              if (!statusResponse.ok) {
                throw new Error(`HTTP ${statusResponse.status}: ${statusResponse.statusText}`);
              }
              
              const statusText = await statusResponse.text();
              let statusData;
              try {
                statusData = JSON.parse(statusText);
              } catch (parseError) {
                whatsappLogger.error('JSON parse error in status check:', parseError);
                return;
              }
              
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
    } catch (error: unknown) {
      whatsappLogger.error('Erro ao gerar QR Code:', error);
      
      // Tratamento específico de erros
      let errorMessage = 'Não foi possível gerar o QR Code';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Tempo esgotado ao tentar gerar o QR Code';
        } else if (error.message.includes('502')) {
          errorMessage = 'Servidor WhatsApp não está respondendo';
        } else if (error.message.includes('404')) {
          errorMessage = 'Clínica não encontrada';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
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
    setClientInfo: (info: Record<string, unknown> | null) => void
  ) => {
    // Verificar se as ações estão desabilitadas
    if (isActionsDisabled) {
      toast({
        title: "Ação não disponível",
        description: "Esta ação não está disponível para clínicas com integração Meta API.",
        variant: "destructive",
      });
      return;
    }

    whatsappLogger.info('=== INICIANDO DESCONEXÃO ===');
    setIsLoading(true);
    clearIntervals();
    
    try {
      const response = await fetch(`${config.backend.url}/api/whatsapp-integration/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          clinicId: selectedClinic.id
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Log da resposta bruta para debug
      const responseText = await response.text();
      whatsappLogger.info('Raw response from disconnect:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        whatsappLogger.error('JSON parse error in disconnect:', parseError);
        whatsappLogger.error('Response text:', responseText);
        throw new Error('Invalid JSON response from server');
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
    } catch (error: unknown) {
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
        const response = await fetch(`${config.backend.url}/api/whatsapp-integration/status?clinicId=${selectedClinic?.id || ''}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseText = await response.text();
        let statusData;
        try {
          statusData = JSON.parse(responseText);
        } catch (parseError) {
          whatsappLogger.error('JSON parse error in status check:', parseError);
          return;
        }
        
        if (statusData?.status === 'connected' && statusData?.clientInfo?.provider === 'meta_api' && statusData?.clientInfo?.connectedAt) {
          whatsappLogger.info('WhatsApp Baileys conectado com sucesso!');
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
    // Verificar se as ações estão desabilitadas
    if (isActionsDisabled) {
      toast({
        title: "Ação não disponível",
        description: "Esta ação não está disponível para clínicas com integração Meta API.",
        variant: "destructive",
      });
      return;
    }

    whatsappLogger.info('Forçando novo QR Code...');
    setIsLoading(true);
    clearIntervals();
    
    try {
              const response = await fetch(`${config.backend.url}/api/whatsapp-integration/refresh-qr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clinicId: selectedClinic.id
          })
        });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        whatsappLogger.error('JSON parse error in refreshQRCode:', parseError);
        throw new Error('Invalid JSON response from server');
      }
      
      if (data?.success) {
        toast({
          title: "QR Code atualizado",
          description: "Novo QR Code será gerado em instantes.",
        });
      } else {
        throw new Error(data?.error || 'Falha ao atualizar QR Code');
      }
    } catch (error: unknown) {
      whatsappLogger.error('Erro ao atualizar QR Code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro",
        description: `Não foi possível atualizar o QR Code: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isActionsDisabled,
    generateQRCode,
    disconnect,
    refreshQRCode,
  };
}; 