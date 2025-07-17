import { useState, useEffect, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { QrCode, PhoneOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAgentWhatsAppConnection } from '@/hooks/useAgentWhatsAppConnection';
import { supabase } from '@/integrations/supabase/client';

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
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<'idle' | 'generating' | 'ready' | 'error' | 'expired'>('idle');
  const [lastGeneratedAt, setLastGeneratedAt] = useState<number | null>(null);
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
  const QR_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutos
  const RETRY_DELAY = 3000; // 3 segundos
  const STATUS_CHECK_INTERVAL = 10000; // 10 segundos

  // Verificar se o QR Code expirou
  const isQRExpired = useCallback(() => {
    if (!lastGeneratedAt) return false;
    return Date.now() - lastGeneratedAt > QR_EXPIRY_TIME;
  }, [lastGeneratedAt]);

  // Limpar QR Code
  const clearQRCode = useCallback(() => {
    setQrCode(null);
    setQrError(null);
    setQrStatus('idle');
    setLastGeneratedAt(null);
  }, []);

  // Resetar sessão no backend
  const resetSession = useCallback(async () => {
    try {
      const response = await fetch('http://31.97.241.19:3001/api/whatsapp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
      });

      if (!response.ok) {
        throw new Error('Falha ao resetar sessão');
      }

      console.log('Sessão resetada com sucesso');
    } catch (error) {
      console.error('Erro ao resetar sessão:', error);
    }
  }, [agentId]);

  // Verificar status real da conexão no backend
  const checkBackendStatus = useCallback(async () => {
    try {
      const response = await fetch(`http://31.97.241.19:3001/api/whatsapp/status/${agentId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao verificar status do backend:', error);
      return { status: 'disconnected' };
    }
  }, [agentId]);

  // Sincronizar status com backend
  const syncStatusWithBackend = useCallback(async () => {
    setIsCheckingStatus(true);
    try {
      const backendStatus = await checkBackendStatus();
      const activeConnection = connections.find(conn => conn.connection_status === 'connected');
      
      if (backendStatus.status === 'disconnected' && activeConnection) {
        // Backend desconectado mas banco mostra conectado - corrigir
        console.log('Sincronizando: backend desconectado, marcando como desconectado no banco');
        await disconnect(agentId, activeConnection.id);
        await loadConnections(agentId);
        clearQRCode();
      } else if (backendStatus.status === 'connected' && !activeConnection) {
        // Backend conectado mas banco não mostra - recarregar conexões
        console.log('Sincronizando: backend conectado, recarregando conexões');
        await loadConnections(agentId);
      }
    } catch (error) {
      console.error('Erro ao sincronizar status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [agentId, connections, disconnect, loadConnections, checkBackendStatus, clearQRCode]);

  // Gera e exibe o QR Code com retry e timeout
  const generateQRCodeForAgent = useCallback(async (retryCount = 0) => {
    setIsGeneratingQR(true);
    setQrError(null);
    setQrStatus('generating');
    
    try {
      // Resetar sessão antes de gerar novo QR
      await resetSession();

      const { data, error } = await supabase.functions.invoke('agent-whatsapp-manager', {
        body: { agentId },
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Path': 'generate-qr'
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao gerar QR Code');
      }

      if (data?.qrCode) {
        setQrCode(data.qrCode);
        setQrStatus('ready');
        setLastGeneratedAt(Date.now());
        
        toast({
          title: "QR Code gerado",
          description: "Escaneie o código com seu WhatsApp Business para conectar.",
        });
      } else {
        throw new Error('QR Code não foi retornado pelo servidor');
      }
    } catch (error: unknown) {
      console.error('Erro ao gerar QR Code:', error);
      
      if (retryCount < 2) {
        // Tentar novamente após delay
        setTimeout(() => {
          generateQRCodeForAgent(retryCount + 1);
        }, RETRY_DELAY);
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setQrError(errorMessage);
      setQrStatus('error');
      
      toast({
        title: "Erro",
        description: `Não foi possível gerar o QR Code: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQR(false);
    }
  }, [agentId, resetSession, toast]);

  // Verificar expiração do QR Code
  useEffect(() => {
    if (qrStatus === 'ready' && lastGeneratedAt) {
      const checkExpiry = () => {
        if (isQRExpired()) {
          setQrStatus('expired');
          toast({
            title: "QR Code expirado",
            description: "O QR Code expirou. Gere um novo código para conectar.",
            variant: "destructive",
          });
        }
      };

      const interval = setInterval(checkExpiry, 10000); // Verificar a cada 10 segundos
      return () => clearInterval(interval);
    }
  }, [qrStatus, lastGeneratedAt, isQRExpired, toast]);

  // Verificar status periodicamente quando há conexão ativa
  useEffect(() => {
    const hasActiveConnection = connections.some(conn => conn.connection_status === 'connected');
    
    if (hasActiveConnection) {
      const interval = setInterval(syncStatusWithBackend, STATUS_CHECK_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [connections, syncStatusWithBackend]);

  // Carregar conexões ao montar componente
  useEffect(() => {
    loadConnections(agentId);
  }, [agentId, loadConnections]);

  // Desconectar conexão ativa
  const handleDisconnectConnection = async (connectionId: string) => {
    try {
      await disconnect(agentId, connectionId);
      await loadConnections(agentId);
      clearQRCode();
      
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
            onClick={() => generateQRCodeForAgent()}
            disabled={isGeneratingQR}
            className="bg-green-600 hover:bg-green-700"
          >
            {isGeneratingQR ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Gerando QR Code...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                Gerar QR Code
              </>
            )}
          </Button>
        </div>
      )}

      {/* Exibir QR Code com diferentes estados */}
      <div className="text-center space-y-4 mt-6">
        {qrStatus === 'generating' && (
          <div className="flex justify-center items-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <RefreshCw className="h-16 w-16 text-gray-400 mx-auto mb-2 animate-spin" />
              <p className="text-gray-500">Gerando QR Code...</p>
            </div>
          </div>
        )}

        {qrStatus === 'ready' && qrCode && (
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
              <img 
                src={qrCode} 
                alt="QR Code WhatsApp" 
                className="w-48 h-48"
              />
              <div className="mt-2 text-sm text-gray-600">
                <p>QR Code válido por 5 minutos</p>
                {lastGeneratedAt && (
                  <p>Tempo restante: {Math.max(0, Math.floor((QR_EXPIRY_TIME - (Date.now() - lastGeneratedAt)) / 1000))}s</p>
                )}
              </div>
            </div>
          </div>
        )}

        {qrStatus === 'expired' && (
          <div className="flex justify-center items-center h-48 bg-red-50 rounded-lg border-2 border-dashed border-red-300">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-2" />
              <p className="text-red-600 font-medium">QR Code expirado</p>
              <p className="text-red-500 text-sm">Clique em "Gerar QR Code" para um novo código</p>
            </div>
          </div>
        )}

        {qrStatus === 'error' && (
          <div className="flex justify-center items-center h-48 bg-red-50 rounded-lg border-2 border-dashed border-red-300">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-2" />
              <p className="text-red-600 font-medium">Erro ao gerar QR Code</p>
              <p className="text-red-500 text-sm">{qrError}</p>
              <Button
                onClick={() => generateQRCodeForAgent()}
                className="mt-2 bg-red-600 hover:bg-red-700"
                size="sm"
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        )}

        {qrStatus === 'idle' && !hasActiveConnection && (
          <div className="flex justify-center items-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">QR Code será exibido aqui</p>
            </div>
          </div>
        )}

        {/* Instruções de conexão */}
        {(qrStatus === 'ready' || qrStatus === 'idle') && !hasActiveConnection && (
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