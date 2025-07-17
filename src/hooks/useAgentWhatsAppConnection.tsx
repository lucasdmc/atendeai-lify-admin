import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AgentWhatsAppConnection {
  id: string;
  agent_id: string;
  whatsapp_number: string;
  whatsapp_name: string;
  connection_status: 'disconnected' | 'connecting' | 'connected' | 'error';
  qr_code: string | null;
  client_info: any;
  last_connection_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AgentWhatsAppConnectionHook {
  connections: AgentWhatsAppConnection[];
  isLoading: boolean;
  generateQRCode: (agentId: string, whatsappNumber: string) => Promise<void>;
  disconnect: (agentId: string, connectionId: string) => Promise<void>;
  checkStatus: (agentId: string, connectionId: string) => Promise<void>;
  loadConnections: (agentId: string) => Promise<void>;
  checkRealTimeStatus: (agentId: string) => Promise<{ status: string }>;
}

export const useAgentWhatsAppConnection = (): AgentWhatsAppConnectionHook => {
  const [connections, setConnections] = useState<AgentWhatsAppConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadConnections = async (agentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('agent-whatsapp-manager/connections', {
        body: { agentId }
      });

      if (error) throw error;
      setConnections(data.connections || []);
    } catch (error) {
      console.error('Erro ao carregar conexões:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conexões de WhatsApp",
        variant: "destructive",
      });
    }
  };

  const generateQRCode = async (agentId: string, whatsappNumber: string) => {
    if (!whatsappNumber.trim()) {
      toast({
        title: "Erro",
        description: "Digite um número de WhatsApp válido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('agent-whatsapp-manager/initialize', {
        body: {
          agentId,
          whatsappNumber: whatsappNumber.trim()
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Conexão inicializada. Aguardando QR Code...",
        });
        
        // Recarregar conexões
        await loadConnections(agentId);
        
        // Se tem QR Code, mostrar
        if (data.qrCode) {
          toast({
            title: "QR Code Gerado",
            description: "Escaneie o código com seu WhatsApp Business para conectar.",
          });
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar conexão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível inicializar a conexão",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async (agentId: string, connectionId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('agent-whatsapp-manager/disconnect', {
        body: {
          agentId,
          connectionId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "WhatsApp desconectado com sucesso",
        });
        
        await loadConnections(agentId);
      }
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desconectar o WhatsApp",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async (agentId: string, connectionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('agent-whatsapp-manager/status', {
        body: {
          agentId,
          connectionId
        }
      });

      if (error) throw error;

      if (data.success && data.qrCode) {
        toast({
          title: "QR Code Atualizado",
          description: "Novo QR Code disponível para conexão",
        });
      }

      await loadConnections(agentId);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  // Nova função para verificar status em tempo real
  const checkRealTimeStatus = async (agentId: string) => {
    try {
      // Verificar status no backend
      const response = await fetch(`http://31.97.241.19:3001/api/whatsapp/status/${agentId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const backendStatus = await response.json();
      
      // Se backend está conectado mas banco não mostra, atualizar
      if (backendStatus.status === 'connected') {
        const currentConnections = connections.filter(conn => conn.agent_id === agentId);
        const hasConnectedInDB = currentConnections.some(conn => conn.connection_status === 'connected');
        
        if (!hasConnectedInDB) {
          console.log('🔄 [useAgentWhatsAppConnection] Backend conectado, atualizando banco...');
          await loadConnections(agentId);
          
          toast({
            title: "Conectado!",
            description: "WhatsApp conectado com sucesso!",
          });
        }
      }
      
      return backendStatus;
    } catch (error) {
      console.error('Erro ao verificar status em tempo real:', error);
      return { status: 'disconnected' };
    }
  };

  return {
    connections,
    isLoading,
    generateQRCode,
    disconnect,
    checkStatus,
    loadConnections,
    checkRealTimeStatus,
  };
}; 