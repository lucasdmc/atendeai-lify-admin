
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

  const handleAuthRedirect = async () => {
    console.log('=== HANDLING AUTH REDIRECT ===');
    console.log('Current URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    console.log('Search params:', window.location.search);
    
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const state = urlParams.get('state');
    const errorDescription = urlParams.get('error_description');

    console.log('URL params analysis:', { 
      hasCode: !!code, 
      error, 
      errorDescription,
      hasState: !!state,
      codeLength: code?.length || 0,
      allParams: Object.fromEntries(urlParams.entries())
    });

    if (error) {
      console.error('OAuth error received:', error);
      console.error('Error description:', errorDescription);
      
      let userFriendlyMessage = 'Erro na autenticação Google';
      
      if (error === 'access_denied') {
        userFriendlyMessage = 'Acesso negado pelo usuário';
      } else if (error === 'redirect_uri_mismatch') {
        userFriendlyMessage = 'Erro de configuração: URL de redirecionamento inválida';
      } else if (error === 'invalid_client') {
        userFriendlyMessage = 'Erro de configuração: Cliente OAuth inválido';
      }
      
      toast({
        title: userFriendlyMessage,
        description: errorDescription || `${error}`,
        variant: 'destructive',
      });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code) {
      try {
        setIsLoading(true);
        console.log('Processing authorization code...');
        console.log('Code length:', code.length);
        console.log('Code preview:', code.substring(0, 20) + '...');
        
        if (!user) {
          console.error('No user found when processing OAuth code');
          toast({
            title: 'Erro',
            description: 'Usuário não autenticado. Faça login primeiro.',
            variant: 'destructive',
          });
          return;
        }

        console.log('User authenticated, exchanging code for tokens...');
        const tokens = await googleCalendarService.exchangeCodeForTokens(code);
        console.log('Tokens received successfully');
        
        console.log('Saving tokens to database...');
        await googleCalendarService.saveTokens(tokens);
        console.log('Tokens saved successfully');
        
        // Remove the code from URL immediately
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setIsConnected(true);
        console.log('Google Calendar connected successfully');
        
        toast({
          title: 'Sucesso!',
          description: 'Google Calendar conectado com sucesso',
        });
        
        // Fetch initial events
        console.log('Fetching initial events...');
        await fetchEvents();
      } catch (error) {
        console.error('Error handling auth redirect:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        
        // Provide more specific error messages
        let userMessage = errorMessage;
        if (errorMessage.includes('redirect_uri_mismatch')) {
          userMessage = 'Erro de configuração: verifique as URLs autorizadas no Google Cloud Console';
        } else if (errorMessage.includes('invalid_client')) {
          userMessage = 'Erro de configuração: credenciais OAuth inválidas';
        }
        
        toast({
          title: 'Erro',
          description: `Falha ao processar autenticação: ${userMessage}`,
          variant: 'destructive',
        });
        // Clean up URL on error
        window.history.replaceState({}, document.title, window.location.pathname);
      } finally {
        setIsLoading(false);
      }
    }
    
    console.log('=== END AUTH REDIRECT HANDLING ===');
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
    console.log('useGoogleCalendar: User changed, checking connection');
    checkConnection();
  }, [user]);

  useEffect(() => {
    // Only handle auth redirect if we're on the agendamentos page
    if (window.location.pathname === '/agendamentos') {
      console.log('On agendamentos page, checking for auth redirect');
      handleAuthRedirect();
    } else {
      console.log('Not on agendamentos page, skipping auth redirect check');
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      console.log('Connected to Google Calendar, fetching events');
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
      console.log('Refetching Google Calendar data');
      checkConnection();
      if (isConnected) {
        fetchEvents();
      }
    },
  };
};
