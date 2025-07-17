import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QrCode, Phone, PhoneOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useAgentWhatsAppConnection } from '@/hooks/useAgentWhatsAppConnection';
import { useToast } from '@/hooks/use-toast';

interface AgentConnectionStatusProps {
  agentId: string;
  agentName: string;
  className?: string;
}

export const AgentConnectionStatus: React.FC<AgentConnectionStatusProps> = ({
  agentId,
  agentName,
  className = ''
}) => {
  const { connections, isLoading, loadConnections, checkRealTimeStatus } = useAgentWhatsAppConnection();
  const { toast } = useToast();

  // Buscar conexão ativa para este agente
  const activeConnection = connections.find(conn => 
    conn.agent_id === agentId && conn.connection_status === 'connected'
  );

  // Determinar status visual
  const getStatusInfo = () => {
    if (isLoading) {
      return {
        status: 'loading',
        label: 'Verificando...',
        icon: RefreshCw,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        bgColor: 'bg-yellow-50'
      };
    }

    if (activeConnection) {
      return {
        status: 'connected',
        label: 'Conectado',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 border-green-200',
        bgColor: 'bg-green-50',
        phoneNumber: activeConnection.whatsapp_number
      };
    }

    const hasConnecting = connections.some(conn => 
      conn.agent_id === agentId && conn.connection_status === 'connecting'
    );

    if (hasConnecting) {
      return {
        status: 'connecting',
        label: 'Conectando...',
        icon: QrCode,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        bgColor: 'bg-blue-50'
      };
    }

    const hasError = connections.some(conn => 
      conn.agent_id === agentId && conn.connection_status === 'error'
    );

    if (hasError) {
      return {
        status: 'error',
        label: 'Erro',
        icon: AlertCircle,
        color: 'bg-red-100 text-red-800 border-red-200',
        bgColor: 'bg-red-50'
      };
    }

    return {
      status: 'disconnected',
      label: 'Desconectado',
      icon: PhoneOff,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      bgColor: 'bg-gray-50'
    };
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  const handleRefresh = async () => {
    try {
      await loadConnections(agentId);
      await checkRealTimeStatus(agentId);
      
      toast({
        title: "Status Atualizado",
        description: "Status do WhatsApp atualizado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do WhatsApp.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg border ${statusInfo.bgColor} ${className}`}>
      <div className="flex items-center gap-2">
        <IconComponent 
          className={`w-4 h-4 ${
            statusInfo.status === 'loading' ? 'animate-spin' : ''
          }`} 
        />
        
        <Badge 
          variant="outline" 
          className={`text-xs font-medium ${statusInfo.color}`}
        >
          {statusInfo.label}
        </Badge>
      </div>

      {statusInfo.status === 'connected' && statusInfo.phoneNumber && (
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Phone className="w-3 h-3" />
          <span>{statusInfo.phoneNumber}</span>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        disabled={isLoading}
        className="ml-auto h-6 w-6 p-0"
      >
        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};

export default AgentConnectionStatus; 