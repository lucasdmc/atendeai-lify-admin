
import { useGoogleAuthRedirect } from '@/hooks/useGoogleAuthRedirect';
import { useGoogleConnectionManager } from '@/hooks/useGoogleConnectionManager';
import { useGoogleCalendarEvents } from '@/hooks/useGoogleCalendarEvents';
import { useGoogleSessionMonitor } from '@/hooks/useGoogleSessionMonitor';

export const useGoogleCalendar = () => {
  const connectionManager = useGoogleConnectionManager();
  const calendarEvents = useGoogleCalendarEvents(connectionManager.isConnected);
  
  // Monitor de sessão com verificação a cada 5 minutos
  const sessionMonitor = useGoogleSessionMonitor(5 * 60 * 1000);
  
  // Handle auth redirect with success callback to refresh events
  useGoogleAuthRedirect(() => {
    connectionManager.setIsConnected(true);
    calendarEvents.fetchEvents();
  });

  const refetch = () => {
    console.log('Refetching Google Calendar data');
    connectionManager.refetch();
    sessionMonitor.forceCheck();
    if (connectionManager.isConnected) {
      calendarEvents.fetchEvents();
    }
  };

  return {
    // Estado de conexão
    isConnected: connectionManager.isConnected,
    isLoading: connectionManager.isLoading,
    
    // Status da sessão
    sessionStatus: sessionMonitor.sessionStatus,
    isMonitoring: sessionMonitor.isMonitoring,
    
    // Eventos do calendário
    events: calendarEvents.events,
    isLoadingEvents: calendarEvents.isLoadingEvents,
    
    // Ações
    connectToGoogle: connectionManager.connectToGoogle,
    disconnectFromGoogle: connectionManager.disconnectFromGoogle,
    fetchEvents: calendarEvents.fetchEvents,
    createEvent: calendarEvents.createEvent,
    refetch,
    
    // Controles do monitor
    forceSessionCheck: sessionMonitor.forceCheck,
    startSessionMonitoring: sessionMonitor.startMonitoring,
    stopSessionMonitoring: sessionMonitor.stopMonitoring,
  };
};
