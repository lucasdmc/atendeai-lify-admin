
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { googleCalendarService, GoogleCalendarEvent } from '@/services/googleCalendarService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useGoogleCalendar = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const checkConnection = async () => {
    if (!user) {
      setIsConnected(false);
      setIsLoading(false);
      return;
    }

    try {
      const tokens = await googleCalendarService.getStoredTokens();
      setIsConnected(!!tokens);
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthRedirect = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      toast({
        title: 'Erro na autenticação',
        description: 'Falha ao conectar com o Google Calendar',
        variant: 'destructive',
      });
      return;
    }

    if (code) {
      try {
        setIsLoading(true);
        const tokens = await googleCalendarService.exchangeCodeForTokens(code);
        await googleCalendarService.saveTokens(tokens);
        
        // Remove the code from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setIsConnected(true);
        toast({
          title: 'Sucesso!',
          description: 'Google Calendar conectado com sucesso',
        });
        
        // Fetch initial events
        await fetchEvents();
      } catch (error) {
        console.error('Error handling auth redirect:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao processar autenticação do Google',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const connectToGoogle = async () => {
    try {
      await googleCalendarService.initiateAuth();
    } catch (error) {
      console.error('Error initiating Google auth:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao iniciar conexão com Google Calendar',
        variant: 'destructive',
      });
    }
  };

  const disconnectFromGoogle = async () => {
    try {
      setIsLoading(true);
      await googleCalendarService.deleteConnection();
      setIsConnected(false);
      setEvents([]);
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

  const fetchEvents = async (timeMin?: string, timeMax?: string) => {
    if (!isConnected) return;

    try {
      setIsLoadingEvents(true);
      const fetchedEvents = await googleCalendarService.fetchCalendarEvents(timeMin, timeMax);
      setEvents(fetchedEvents);

      // Cache events in our database
      if (user && fetchedEvents.length > 0) {
        const eventsToCache = fetchedEvents.map(event => ({
          user_id: user.id,
          google_event_id: event.id,
          calendar_id: 'primary',
          title: event.summary,
          description: event.description || null,
          start_time: event.start.dateTime,
          end_time: event.end.dateTime,
          location: event.location || null,
          attendees: event.attendees ? JSON.stringify(event.attendees) : null,
          status: event.status,
        }));

        await supabase
          .from('calendar_events')
          .upsert(eventsToCache, { onConflict: 'user_id,google_event_id' });
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar eventos do calendário',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const createEvent = async (eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => {
    try {
      const newEvent = await googleCalendarService.createCalendarEvent(eventData);
      await fetchEvents(); // Refresh events
      toast({
        title: 'Evento criado',
        description: 'Evento adicionado ao Google Calendar',
      });
      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar evento',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    checkConnection();
  }, [user]);

  useEffect(() => {
    handleAuthRedirect();
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchEvents();
    }
  }, [isConnected]);

  return {
    isConnected,
    isLoading,
    events,
    isLoadingEvents,
    connectToGoogle,
    disconnectFromGoogle,
    fetchEvents,
    createEvent,
    refetch: () => {
      checkConnection();
      if (isConnected) {
        fetchEvents();
      }
    },
  };
};
