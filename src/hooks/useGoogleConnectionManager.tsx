
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { googleCalendarService } from '@/services/googleCalendarService';
import { useToast } from '@/hooks/use-toast';

export const useGoogleConnectionManager = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<{
    isConnected: boolean;
    isValid: boolean;
    expiresAt?: string;
    needsReauth: boolean;
  }>({
    isConnected: false,
    isValid: false,
    needsReauth: false
  });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);

  const checkConnection = useCallback(async () => {
    if (!user) {
      console.log('No user found, setting isConnected to false');
      setIsConnected(false);
      setSessionStatus({
        isConnected: false,
        isValid: false,
        needsReauth: false
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log('Checking Google Calendar connection for user:', user.id);
      
      // Usar o novo sistema de validação de sessão
      const status = await googleCalendarService.getSessionStatus();
      
      console.log('Session status:', status);
      
      setIsConnected(status.isConnected);
      setSessionStatus(status);
      
      // Se a sessão precisa de reautenticação, mostrar notificação
      if (status.isConnected && status.needsReauth) {
        toast({
          title: 'Reconexão necessária',
          description: 'Sua sessão do Google Calendar expirou. Clique em "Conectar" para renovar.',
          variant: 'destructive',
        });
      }
      
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
      setIsConnected(false);
      setSessionStatus({
        isConnected: false,
        isValid: false,
        needsReauth: false
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const connectToGoogle = async () => {
    try {
      console.log('=== INITIATING GOOGLE CONNECTION ===');
      console.log('Current URL before OAuth:', window.location.href);
      
      if (!user) {
        console.error('No user found when trying to connect to Google');
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado para conectar o Google Calendar',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('User authenticated, proceeding with OAuth...');
      console.log('User ID:', user.id);
      
      await googleCalendarService.initiateAuth();
    } catch (error) {
      console.error('Error initiating Google auth:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro',
        description: `Falha ao iniciar conexão: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  const disconnectFromGoogle = async () => {
    try {
      setIsLoading(true);
      console.log('Disconnecting from Google Calendar...');
      await googleCalendarService.deleteConnection();
      setIsConnected(false);
      setSessionStatus({
        isConnected: false,
        isValid: false,
        needsReauth: false
      });
      toast({
        title: 'Desconectado',
        description: 'Google Calendar desconectado com sucesso',
      });
    } catch (error) {
      console.error('Error disconnecting from Google:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao desconectar do Google Calendar',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = useCallback(() => {
    console.log('Refetching Google Calendar connection status');
    checkConnection();
  }, [checkConnection]);

  // Verificação automática periódica da sessão
  const startPeriodicCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Verificar a cada 5 minutos se a sessão ainda é válida
    intervalRef.current = setInterval(async () => {
      const now = Date.now();
      // Evitar verificações muito frequentes
      if (now - lastCheckRef.current < 60000) { // 1 minuto mínimo entre verificações
        return;
      }
      
      if (isConnected && user) {
        console.log('Performing periodic session validation...');
        try {
          const status = await googleCalendarService.getSessionStatus();
          setSessionStatus(status);
          
          // Se a sessão se tornou inválida, atualizar estado
          if (!status.isValid && isConnected) {
            setIsConnected(false);
            toast({
              title: 'Sessão expirada',
              description: 'Sua conexão com o Google Calendar expirou. Reconecte para continuar.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('Error in periodic session check:', error);
        }
        lastCheckRef.current = now;
      }
    }, 5 * 60 * 1000); // 5 minutos
  }, [isConnected, user, toast]);

  const stopPeriodicCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    console.log('useGoogleConnectionManager: User changed, checking connection');
    checkConnection();
  }, [user, checkConnection]);

  useEffect(() => {
    if (isConnected && user) {
      startPeriodicCheck();
    } else {
      stopPeriodicCheck();
    }

    return () => {
      stopPeriodicCheck();
    };
  }, [isConnected, user, startPeriodicCheck, stopPeriodicCheck]);

  return {
    isConnected,
    isLoading,
    sessionStatus,
    connectToGoogle,
    disconnectFromGoogle,
    checkConnection,
    refetch,
    setIsConnected,
  };
};
