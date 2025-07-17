import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { config } from '@/config/environment';

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
  const loadingRef = useRef<Set<string>>(new Set());

  const loadConnections = useCallback(async (agentId: string) => {
    // Evitar múltiplas requisições simultâneas para o mesmo agente
    if (loadingRef.current.has(agentId)) {
      return;
    }

    loadingRef.current.add(agentId);
    
    try {
      console.log('🔄 [useAgentWhatsAppConnection] Carregando conexões para agente:', agentId);
      
      const { data, error } = await supabase.functions.invoke('agent-whatsapp-manager/connections', {
        body: { agentId }
      });

      if (error) {
        console.error('❌ Erro ao carregar conexões:', error);
        throw error;
      }
      
      console.log('✅ [useAgentWhatsAppConnection] Conexões carregadas:', data?.connections?.length || 0);
      setConnections(data.connections || []);
    } catch (error) {
      console.error('❌ Erro ao carregar conexões:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conexões de WhatsApp",
        variant: "destructive",
      });
    } finally {
      loadingRef.current.delete(agentId);
    }
  }, [toast]);

  const generateQRCode = useCallback(async (agentId: string, whatsappNumber: string) => {
    setIsLoading(true);
    try {
      console.log('🔄 [useAgentWhatsAppConnection] Gerando QR Code para:', agentId);
      
      const { data, error } = await supabase.functions.invoke('agent-whatsapp-manager/generate-qr', {
        body: {
          agentId,
          whatsappNumber
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "QR Code Gerado",
          description: "QR Code gerado com sucesso. Escaneie para conectar.",
        });
        
        await loadConnections(agentId);
      }
    } catch (error) {
      console.error('❌ Erro ao gerar QR Code:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o QR Code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadConnections, toast]);

  const disconnect = useCallback(async (agentId: string, connectionId: string) => {
    setIsLoading(true);
    try {
      console.log('🔄 [useAgentWhatsAppConnection] Desconectando agente:', agentId);
      
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
      console.error('❌ Erro ao desconectar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desconectar o WhatsApp",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadConnections, toast]);

  const checkStatus = useCallback(async (agentId: string, connectionId: string) => {
    try {
      console.log('🔄 [useAgentWhatsAppConnection] Verificando status para:', agentId);
      
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
      console.error('❌ Erro ao verificar status:', error);
    }
  }, [loadConnections, toast]);

  // Função melhorada para verificar status em tempo real
  const checkRealTimeStatus = useCallback(async (agentId: string) => {
    try {
      console.log('🔄 [useAgentWhatsAppConnection] Verificando status em tempo real para:', agentId);
      
      // 1. Verificar status no backend usando URL correta para produção
      const backendUrl = config.whatsapp.serverUrl;
      const response = await fetch(`${backendUrl}/api/whatsapp/status/${agentId}`);
      
      if (!response.ok) {
        console.warn('⚠️ Backend não respondeu, usando status do banco');
        await loadConnections(agentId);
        return { status: 'disconnected' };
      }
      
      const backendStatus = await response.json();
      console.log('✅ [useAgentWhatsAppConnection] Status do backend:', backendStatus);
      
      // 2. Se backend está conectado mas banco não mostra, atualizar
      if (backendStatus.status === 'connected') {
        const currentConnections = connections.filter(conn => conn.agent_id === agentId);
        const hasConnectedInDB = currentConnections.some(conn => conn.connection_status === 'connected');
        
        if (!hasConnectedInDB) {
          console.log('🔄 [useAgentWhatsAppConnection] Backend conectado, atualizando banco...');
          
          // Forçar sincronização com o banco
          await loadConnections(agentId);
          
          toast({
            title: "Conectado!",
            description: "WhatsApp conectado com sucesso!",
          });
        }
      }
      
      // 3. Se backend está desconectado mas banco mostra conectado, corrigir
      if (backendStatus.status === 'disconnected') {
        const currentConnections = connections.filter(conn => conn.agent_id === agentId);
        const hasConnectedInDB = currentConnections.some(conn => conn.connection_status === 'connected');
        
        if (hasConnectedInDB) {
          console.log('🔄 [useAgentWhatsAppConnection] Backend desconectado, corrigindo banco...');
          
          // Marcar como desconectado no banco
          const connectedConnection = currentConnections.find(conn => conn.connection_status === 'connected');
          if (connectedConnection) {
            await disconnect(agentId, connectedConnection.id);
          }
        }
      }
      
      return backendStatus;
    } catch (error) {
      console.error('❌ Erro ao verificar status em tempo real:', error);
      return { status: 'disconnected' };
    }
  }, [connections, loadConnections, disconnect, toast]);

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