
import { useGoogleAuthRedirect } from '@/hooks/useGoogleAuthRedirect';
import { useGoogleConnectionManager } from '@/hooks/useGoogleConnectionManager';
import { useGoogleCalendarEvents } from '@/hooks/useGoogleCalendarEvents';

export const useGoogleCalendar = () => {
  const connectionManager = useGoogleConnectionManager();
  const calendarEvents = useGoogleCalendarEvents(connectionManager.isConnected);
  
  // Handle auth redirect with success callback to refresh events
  useGoogleAuthRedirect(() => {
    connectionManager.setIsConnected(true);
    calendarEvents.fetchEvents();
  });

  const refetch = () => {
    console.log('Refetching Google Calendar data');
    connectionManager.refetch();
    if (connectionManager.isConnected) {
      calendarEvents.fetchEvents();
    }
  };

  return {
    isConnected: connectionManager.isConnected,
    isLoading: connectionManager.isLoading,
    events: calendarEvents.events,
    isLoadingEvents: calendarEvents.isLoadingEvents,
    connectToGoogle: connectionManager.connectToGoogle,
    disconnectFromGoogle: connectionManager.disconnectFromGoogle,
    fetchEvents: calendarEvents.fetchEvents,
    createEvent: calendarEvents.createEvent,
    refetch,
  };
};
