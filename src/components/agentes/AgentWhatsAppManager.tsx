import { useState, useEffect, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { PhoneOff, RefreshCw, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAgentWhatsAppConnection } from '@/hooks/useAgentWhatsAppConnection';


interface AgentWhatsAppConnection {
  id: string;
  agent_id: string;
  whatsapp_number: string;
  whatsapp_name: string;
  connection_status: 'disconnected' | 'connecting' | 'connected' | 'error';
  qr_code: string | null;
  client_info: Record<string, unknown>;
  last_connection_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AgentWhatsAppManagerProps {
  agentId: string;
  agentName: string;
}

const AgentWhatsAppManager = ({ agentId, agentName }: AgentWhatsAppManagerProps) => {
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const { toast } = useToast();

  // Hook para gerenciar conexões
  const {
    connections,
    isLoading,
    disconnect,
    loadConnections,
  } = useAgentWhatsAppConnection();

  // Configurações de timeout
  const STATUS_CHECK_INTERVAL = 10000; // 10 segundos

  // Sincronizar status usando apenas Edge Functions
  const syncStatusWithBackend = useCallback(async () => {
    setIsCheckingStatus(true);
    try {
      await loadConnections(agentId);
    } catch (error) {
      console.error('Erro ao sincronizar status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [agentId, loadConnections]);

  // Verificar status periodicamente quando há conexão ativa
  useEffect(() => {
    const hasActiveConnection = connections.some(conn => conn.connection_status === 'connected');
    
    if (hasActiveConnection) {
      const interval = setInterval(syncStatusWithBackend, STATUS_CHECK_INTERVAL);
      return () => clearInterval(interval);
    }
    
    return undefined; // Retorno explícito
  }, [connections, syncStatusWithBackend]);

  // Verificar status periodicamente quando há conexão ativa
  useEffect(() => {
    const hasActiveConnection = connections.some(conn => conn.connection_status === 'connected');
    
    if (hasActiveConnection) {
      const interval = setInterval(syncStatusWithBackend, STATUS_CHECK_INTERVAL);
      return () => clearInterval(interval);
    }
    
    return undefined; // Retorno explícito
  }, [connections, syncStatusWithBackend]);

  // Desconectar conexão ativa
  const handleDisconnectConnection = async (connectionId: string) => {
    try {
      await disconnect(agentId, connectionId);
      await loadConnections(agentId);
      
      toast({
        title: "Desconectado",
        description: "WhatsApp desconectado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao desconectar WhatsApp.",
        variant: "destructive",
      });
    }
  };

  // Verificar se há conexão ativa REAL (sincronizada com backend)
  const hasActiveConnection = connections.some((conn: AgentWhatsAppConnection) => 
    conn.connection_status === 'connected'
  );

  // Buscar conexão ativa
  const activeConnection = connections.find((conn: AgentWhatsAppConnection) => 
    conn.connection_status === 'connected'
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">WhatsApp do Agente</h3>
          <p className="text-sm text-gray-600">Gerencie as conexões de WhatsApp para {agentName}</p>
        </div>
        
        {/* Botão de verificar status */}
        <Button
          onClick={syncStatusWithBackend}
          disabled={isCheckingStatus}
          variant="outline"
          size="sm"
        >
          {isCheckingStatus ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Status da conexão */}
      {hasActiveConnection && activeConnection && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  Número conectado: {activeConnection.whatsapp_number}
                </p>
                <p className="text-sm text-green-600">
                  {activeConnection.whatsapp_name}
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={() => handleDisconnectConnection(activeConnection.id)}
              disabled={isLoading}
              size="sm"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              Desconectar
            </Button>
          </div>
        </div>
      )}

      {/* Botão de gerar QR Code - apenas se não há conexão ativa */}
      {!hasActiveConnection && (
        <div className="text-center mt-4">
          <Button
            onClick={() => {
              toast({
                title: "Número de WhatsApp",
                description: "O número de WhatsApp para este agente é: 5511999999999. Você precisará configurar manualmente no WhatsApp Business.",
                variant: "default",
              });
            }}
            disabled={false}
            className="bg-green-600 hover:bg-green-700"
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            Configurar Número
          </Button>
        </div>
      )}

      {/* Exibir QR Code com diferentes estados */}
      <div className="text-center space-y-4 mt-6">
        {/* Remover todos os estados e funções relacionados a QR Code */}
        {/* Remover botões e exibição de QR Code */}
        {/* Manter apenas status de conexão e botão de desconectar */}
        {/* Atualizar textos para refletir o novo modelo */}
        {/* Instruções de conexão */}
        {(hasActiveConnection && activeConnection) && (
          <div className="text-sm text-gray-600">
            <p className="font-medium">Como conectar:</p>
            <ol className="mt-2 space-y-1 text-left">
              <li>1. Abra o WhatsApp Business no seu celular</li>
              <li>2. Toque em "Configurações" → "Dispositivos conectados"</li>
              <li>3. Toque em "Conectar um dispositivo"</li>
              <li>4. Aponte a câmera para o QR Code acima</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentWhatsAppManager; 