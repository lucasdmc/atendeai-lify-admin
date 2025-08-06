import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { whatsappLogger } from '@/utils/whatsappLogger';
import { config } from '@/config/frontend-config';
import { useClinic } from '@/contexts/ClinicContext';

interface WhatsAppActionsHook {
  isLoading: boolean;
  isActionsDisabled: boolean;
  disconnect: (
    setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'demo') => void,
    setClientInfo: (info: Record<string, unknown> | null) => void
  ) => Promise<void>;
}

export const useWhatsAppActions = (): WhatsAppActionsHook => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { selectedClinic } = useClinic();

  // Verificar se as ações devem ser desabilitadas
  const isActionsDisabled = !selectedClinic || selectedClinic.whatsapp_integration_type === 'meta_api';

  const disconnect = async (
    setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'demo') => void,
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

    whatsappLogger.info('Iniciando desconexão do WhatsApp...');
    setIsLoading(true);
    
    try {
      // Chamar backend para desconectar
      const response = await fetch(`${config.backend.url}/api/whatsapp-integration/disconnect`, {
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
      
      const data = await response.json();
      whatsappLogger.info('Resposta do Backend (disconnect):', data);
      
      if (data?.success) {
        setConnectionStatus('disconnected');
        setClientInfo(null);
        
        toast({
          title: "WhatsApp Desconectado",
          description: "Seu WhatsApp Business foi desconectado com sucesso.",
        });
      } else {
        throw new Error(data?.message || 'Erro ao desconectar WhatsApp');
      }
    } catch (error) {
      whatsappLogger.error('Erro ao desconectar WhatsApp:', error);
      
      toast({
        title: "Erro ao desconectar WhatsApp",
        description: error instanceof Error ? error.message : "Erro desconhecido ao desconectar WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isActionsDisabled,
    disconnect,
  };
}; 