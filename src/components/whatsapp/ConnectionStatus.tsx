
import { CheckCircle, AlertCircle, RefreshCw, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ConnectionStatusProps {
  status: 'disconnected' | 'connecting' | 'connected' | 'demo';
}

export const ConnectionStatus = ({ status }: ConnectionStatusProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'demo': return 'bg-blue-500';
      default: return 'bg-red-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'demo': return 'Modo Demo';
      default: return 'Desconectado';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'connecting': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'demo': return <Play className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <Badge className={`${getStatusColor()} text-white`}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        {getStatusText()}
      </div>
    </Badge>
  );
};
