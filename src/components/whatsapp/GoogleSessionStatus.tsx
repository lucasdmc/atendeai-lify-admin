import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { GoogleSessionStatus as SessionStatus } from '@/hooks/useGoogleSessionMonitor';

interface GoogleSessionStatusProps {
  sessionStatus: SessionStatus;
  onReconnect: () => void;
  onRefresh: () => void;
  className?: string;
}

export const GoogleSessionStatus: React.FC<GoogleSessionStatusProps> = ({
  sessionStatus,
  onReconnect,
  onRefresh,
  className = ''
}) => {
  const formatTimeUntilExpiry = (timeMs?: number): string => {
    if (!timeMs || timeMs <= 0) return 'Expirado';
    
    const minutes = Math.floor(timeMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return 'Menos de 1m';
  };

  const getStatusIcon = () => {
    if (!sessionStatus.isConnected) return <XCircle className="h-4 w-4 text-red-500" />;
    if (sessionStatus.needsReauth) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (sessionStatus.isValid) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = () => {
    if (!sessionStatus.isConnected) return <Badge variant="destructive">Desconectado</Badge>;
    if (sessionStatus.needsReauth) return <Badge variant="secondary">Reconexão necessária</Badge>;
    if (sessionStatus.isValid) return <Badge variant="default">Conectado</Badge>;
    return <Badge variant="destructive">Erro</Badge>;
  };

  const getStatusColor = () => {
    if (!sessionStatus.isConnected) return 'text-red-600';
    if (sessionStatus.needsReauth) return 'text-yellow-600';
    if (sessionStatus.isValid) return 'text-green-600';
    return 'text-red-600';
  };

  if (!sessionStatus.isConnected) {
    return (
      <Card className={`border-dashed ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <XCircle className="h-4 w-4 text-red-500" />
            Status da Sessão Google
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Não conectado ao Google Calendar
            </span>
            <Button size="sm" onClick={onReconnect}>
              Conectar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {getStatusIcon()}
          Status da Sessão Google
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          {getStatusBadge()}
        </div>
        
        {sessionStatus.expiresAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Expira em:
            </span>
            <span className={`text-sm ${getStatusColor()}`}>
              {formatTimeUntilExpiry(sessionStatus.timeUntilExpiry)}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Última verificação:</span>
          <span className="text-xs text-muted-foreground">
            {sessionStatus.lastChecked.toLocaleTimeString()}
          </span>
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onRefresh}
            className="flex-1"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Verificar
          </Button>
          
          {sessionStatus.needsReauth && (
            <Button 
              size="sm" 
              onClick={onReconnect}
              className="flex-1"
            >
              Reconectar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
