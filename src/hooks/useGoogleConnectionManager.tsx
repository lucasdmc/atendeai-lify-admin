
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { googleCalendarService } from '@/services/googleCalendarService';
import { useToast } from '@/hooks/use-toast';

export const useGoogleConnectionManager = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const checkConnection = async () => {
    if (!user) {
      console.log('No user found, setting isConnected to false');
      setIsConnected(false);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Checking Google Calendar connection for user:', user.id);
      const tokens = await googleCalendarService.getStoredTokens();
      console.log('Stored tokens found:', !!tokens);
      setIsConnected(!!tokens);
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

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

  const refetch = () => {
    console.log('Refetching Google Calendar connection status');
    checkConnection();
  };

  useEffect(() => {
    console.log('useGoogleConnectionManager: User changed, checking connection');
    checkConnection();
  }, [user]);

  return {
    isConnected,
    isLoading,
    connectToGoogle,
    disconnectFromGoogle,
    checkConnection,
    refetch,
    setIsConnected,
  };
};
