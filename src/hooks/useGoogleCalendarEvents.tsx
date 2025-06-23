
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { googleCalendarService, GoogleCalendarEvent } from '@/services/googleCalendarService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useGoogleCalendarEvents = (isConnected: boolean) => {
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchEvents = async (timeMin?: string, timeMax?: string) => {
    if (!isConnected) {
      console.log('Not connected to Google Calendar, skipping event fetch');
      return;
    }

    try {
      setIsLoadingEvents(true);
      console.log('Fetching calendar events...');
      const fetchedEvents = await googleCalendarService.fetchCalendarEvents(timeMin, timeMax);
      console.log('Events fetched successfully:', fetchedEvents.length);
      setEvents(fetchedEvents);

      // Cache events in our database
      if (user && fetchedEvents.length > 0) {
        console.log('Caching events in database...');
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
    if (isConnected) {
      console.log('Connected to Google Calendar, fetching events');
      fetchEvents();
    } else {
      setEvents([]);
    }
  }, [isConnected]);

  return {
    events,
    isLoadingEvents,
    fetchEvents,
    createEvent,
    setEvents,
  };
};
