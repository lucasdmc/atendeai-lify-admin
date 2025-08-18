
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { googleCalendarService } from '@/services/googleCalendarService';
import { useToast } from '@/hooks/use-toast';
import { useClinic } from '@/contexts/ClinicContext';
import apiClient from '@/services/apiClient';

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
  const { selectedClinicId } = useClinic();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);

  const checkConnection = useCallback(async () => {
    if (!user || !selectedClinicId) {
      setIsConnected(false);
      setSessionStatus({ isConnected: false, isValid: false, needsReauth: false });
      setIsLoading(false);
      return;
    }

    try {
      const resp = await apiClient.get(`/api/google/session/status`, { params: { clinicId: selectedClinicId } });
      const data: any = resp.success ? (resp.data as any).data : { connected: false };
      setIsConnected(!!data.connected);
      setSessionStatus({ isConnected: !!data.connected, isValid: !!data.connected, needsReauth: !data.connected });
    } catch (error) {
      setIsConnected(false);
      setSessionStatus({ isConnected: false, isValid: false, needsReauth: false });
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedClinicId]);

  const connectToGoogle = async () => {
    try {
      if (!user || !selectedClinicId) {
        toast({ title: 'Erro', description: 'Selecione uma clínica para conectar o Google Calendar', variant: 'destructive' });
        return;
      }
      await googleCalendarService.initiateAuth(selectedClinicId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({ title: 'Erro', description: `Falha ao iniciar conexão: ${errorMessage}`, variant: 'destructive' });
    }
  };

  const disconnectFromGoogle = async () => {
    try {
      if (!selectedClinicId) return;
      setIsLoading(true);
      await apiClient.delete(`/api/google/oauth/disconnect`, { params: { clinicId: selectedClinicId } } as any);
      setIsConnected(false);
      setSessionStatus({ isConnected: false, isValid: false, needsReauth: false });
      toast({ title: 'Desconectado', description: 'Google Calendar desconectado com sucesso' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao desconectar do Google Calendar', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = useCallback(() => {
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    checkConnection();
  }, [user, selectedClinicId, checkConnection]);

  useEffect(() => {
    if (isConnected && user) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(async () => {
        const now = Date.now();
        if (now - lastCheckRef.current < 60000) return;
        try { await checkConnection(); } catch {}
        lastCheckRef.current = now;
      }, 5 * 60 * 1000);
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [isConnected, user, checkConnection]);

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
