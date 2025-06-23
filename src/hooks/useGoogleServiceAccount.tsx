
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
      
      // Set default time range if not provided (next 30 days)
      const defaultTimeMin = timeMin || new Date().toISOString();
      const defaultTimeMax = timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const fetchedEvents = await googleServiceAccountService.fetchCalendarEvents(defaultTimeMin, defaultTimeMax);
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
      console.log('Creating calendar event...', eventData);
      const newEvent = await googleServiceAccountService.createCalendarEvent(eventData);
      console.log('Event created successfully:', newEvent);
      
      // Refresh events to show the new one
      await fetchEvents();
      
      toast({
        title: 'Evento criado',
        description: 'Evento adicionado ao Google Calendar',
      });
      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar evento no Google Calendar',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateEvent = async (eventId: string, eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => {
    try {
      console.log('Updating calendar event...', eventId, eventData);
      await googleServiceAccountService.updateCalendarEvent(eventId, eventData);
      
      // Refresh events to show the updated one
      await fetchEvents();
      
      toast({
        title: 'Evento atualizado',
        description: 'Agendamento atualizado no Google Calendar',
      });
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar evento no Google Calendar',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      console.log('Deleting calendar event...', eventId);
      await googleServiceAccountService.deleteCalendarEvent(eventId);
      
      // Refresh events to remove the deleted one
      await fetchEvents();
      
      toast({
        title: 'Evento excluído',
        description: 'Agendamento removido do Google Calendar',
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir evento do Google Calendar',
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
    } else {
      setEvents([]);
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
