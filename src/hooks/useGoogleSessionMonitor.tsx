import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { googleCalendarService } from '@/services/googleCalendarService';
import { useToast } from '@/hooks/use-toast';

export interface GoogleSessionStatus {
  isConnected: boolean;
  isValid: boolean;
  expiresAt?: string;
  needsReauth: boolean;
  lastChecked: Date;
  timeUntilExpiry?: number; // em milissegundos
}

export const useGoogleSessionMonitor = (checkInterval: number = 300000) => { // 5 minutos padrão
  const [sessionStatus, setSessionStatus] = useState<GoogleSessionStatus>({
    isConnected: false,
    isValid: false,
    needsReauth: false,
    lastChecked: new Date()
  });
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);

  const checkSessionStatus = useCallback(async () => {
    if (!user) {
      setSessionStatus({
        isConnected: false,
        isValid: false,
        needsReauth: false,
        lastChecked: new Date()
      });
      return;
    }

    try {
      const status = await googleCalendarService.getSessionStatus();
      const now = new Date();
      
      let timeUntilExpiry: number | undefined;
      if (status.expiresAt) {
        const expiryDate = new Date(status.expiresAt);
        timeUntilExpiry = expiryDate.getTime() - now.getTime();
      }

      const newStatus: GoogleSessionStatus = {
        ...status,
        lastChecked: now,
        timeUntilExpiry
      };

      setSessionStatus(newStatus);

      // Notificações inteligentes baseadas no status
      if (status.isConnected && status.needsReauth) {
        toast({
          title: 'Reconexão necessária',
          description: 'Sua sessão do Google Calendar expirou. Reconecte para continuar.',
          variant: 'destructive',
        });
      } else if (status.isConnected && status.isValid && timeUntilExpiry && timeUntilExpiry < 300000) { // 5 minutos
        toast({
          title: 'Sessão expirando em breve',
          description: 'Sua sessão do Google Calendar expirará em breve. Será renovada automaticamente.',
          variant: 'default',
        });
      }

      lastCheckRef.current = Date.now();
    } catch (error) {
      console.error('Error checking session status:', error);
      setSessionStatus(prev => ({
        ...prev,
        lastChecked: new Date()
      }));
    }
  }, [user, toast]);

  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsMonitoring(true);
    
    // Verificação inicial
    checkSessionStatus();

    // Configurar verificação periódica
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      // Evitar verificações muito frequentes
      if (now - lastCheckRef.current < 60000) { // 1 minuto mínimo
        return;
      }
      
      if (user) {
        checkSessionStatus();
      }
    }, checkInterval);

    console.log(`Started Google Calendar session monitoring (interval: ${checkInterval}ms)`);
  }, [checkInterval, checkSessionStatus, user]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
    console.log('Stopped Google Calendar session monitoring');
  }, []);

  const forceCheck = useCallback(() => {
    console.log('Forcing session status check...');
    checkSessionStatus();
  }, [checkSessionStatus]);

  // Iniciar monitoramento quando o usuário estiver conectado
  useEffect(() => {
    if (user && sessionStatus.isConnected) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [user, sessionStatus.isConnected, startMonitoring, stopMonitoring]);

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    sessionStatus,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    forceCheck,
    checkSessionStatus
  };
};
