import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { googleServiceAccountService, GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useGoogleServiceAccount = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      console.log('Checking Google Service Account connection...');
      const connected = await googleServiceAccountService.isConnected();
      console.log('Service Account connected:', connected);
      setIsConnected(connected);
    } catch (error) {
      console.error('Error checking service account connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async (timeMin?: string, timeMax?: string) => {
    if (!isConnected) {
      console.log('Service account not connected, skipping event fetch');
      return;
    }

    try {
      setIsLoadingEvents(true);
      console.log('Fetching calendar events...');
      const fetchedEvents = await googleServiceAccountService.fetchCalendarEvents(timeMin, timeMax);
      console.log('Events fetched successfully:', fetchedEvents.length);
      setEvents(fetchedEvents);

      // Cache events in our database
      if (user && fetchedEvents.length > 0) {
        console.log('Caching events in database...');
        const eventsToCache = fetchedEvents.map(event => ({
          user_id: user.id,
          google_event_id: event.id,
          calendar_id: googleServiceAccountService.getCalendarId(),
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
        
        console.log('Events cached successfully');
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
      console.log('Creating calendar event...');
      const newEvent = await googleServiceAccountService.createCalendarEvent(eventData);
      await fetchEvents(); // Refresh events
      toast({
        title: 'Evento criado',
        description: 'Evento adicionado ao calendário',
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

  const updateEvent = async (eventId: string, eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => {
    try {
      console.log('Updating calendar event...');
      await googleServiceAccountService.updateCalendarEvent(eventId, eventData);
      await fetchEvents(); // Refresh events
      toast({
        title: 'Evento atualizado',
        description: 'Agendamento atualizado com sucesso',
      });
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar evento',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      console.log('Deleting calendar event...');
      await googleServiceAccountService.deleteCalendarEvent(eventId);
      await fetchEvents(); // Refresh events
      toast({
        title: 'Evento excluído',
        description: 'Agendamento removido com sucesso',
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir evento',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    console.log('useGoogleServiceAccount: Checking connection');
    checkConnection();
  }, []);

  useEffect(() => {
    if (isConnected) {
      console.log('Connected to Google Calendar via Service Account, fetching events');
      fetchEvents();
    }
  }, [isConnected]);

  return {
    isConnected,
    isLoading,
    events,
    isLoadingEvents,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    calendarId: googleServiceAccountService.getCalendarId(),
    refetch: () => {
      console.log('Refetching Google Calendar data');
      checkConnection();
      if (isConnected) {
        fetchEvents();
      }
    },
  };
};
