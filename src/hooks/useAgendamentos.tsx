import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { GoogleCalendarEvent } from '@/types/calendar';

// Função para carregar calendários do usuário
const loadUserCalendars = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_calendars')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Função para carregar eventos de múltiplos calendários em paralelo
const loadEventsFromCalendars = async (
  calendarIds: string[],
  userId: string,
  timeMin?: string,
  timeMax?: string
) => {
  if (!calendarIds.length) return [];

  const allEvents: GoogleCalendarEvent[] = [];
  
  // Carregar eventos em paralelo
  const eventPromises = calendarIds.map(async (calendarId) => {
    try {
      const { data, error } = await supabase.functions.invoke('calendar-manager', {
        body: { 
          action: 'list-events',
          calendarId,
          userId,
          timeMin: timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias atrás
          timeMax: timeMax || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 dias à frente
          forceRefresh: false // Usar cache quando possível
        }
      });

      if (error) {
        console.error(`Erro ao buscar eventos do calendário ${calendarId}:`, error);
        return [];
      }

      if (data.success && data.events) {
        return data.events;
      }

      return [];
    } catch (error) {
      console.error(`Erro ao buscar eventos do calendário ${calendarId}:`, error);
      return [];
    }
  });

  const results = await Promise.all(eventPromises);
  
  // Combinar todos os eventos
  results.forEach(events => {
    allEvents.push(...events);
  });

  // Ordenar por data
  return allEvents.sort((a, b) => 
    new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime()
  );
};

export const useAgendamentos = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para calendários do usuário
  const {
    data: userCalendars = [],
    isLoading: calendarsLoading,
    error: calendarsError,
    refetch: refetchCalendars
  } = useQuery({
    queryKey: ['user-calendars', user?.id],
    queryFn: () => user ? loadUserCalendars(user.id) : [],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Query para eventos (será usado quando calendários selecionados mudarem)
  const {
    data: events = [],
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents
  } = useQuery({
    queryKey: ['calendar-events', user?.id, []], // Será atualizado dinamicamente
    queryFn: () => Promise.resolve([]), // Placeholder
    enabled: false, // Será habilitado dinamicamente
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Mutation para criar evento
  const createEventMutation = useMutation({
    mutationFn: async ({ calendarId, eventData }: { calendarId: string; eventData: Omit<GoogleCalendarEvent, 'id' | 'status'> }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.functions.invoke('calendar-manager', {
        body: { 
          action: 'create-event',
          calendarId,
          userId: user.id,
          eventData
        }
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error('Falha ao criar evento');

      return data.event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({
        title: 'Sucesso',
        description: 'Evento criado com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o evento',
        variant: 'destructive',
      });
    },
  });

  // Mutation para atualizar evento
  const updateEventMutation = useMutation({
    mutationFn: async ({ calendarId, eventId, eventData }: { calendarId: string; eventId: string; eventData: Omit<GoogleCalendarEvent, 'id' | 'status'> }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.functions.invoke('calendar-manager', {
        body: { 
          action: 'update-event',
          calendarId,
          userId: user.id,
          eventId,
          eventData
        }
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error('Falha ao atualizar evento');

      return data.event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({
        title: 'Sucesso',
        description: 'Evento atualizado com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o evento',
        variant: 'destructive',
      });
    },
  });

  // Mutation para deletar evento
  const deleteEventMutation = useMutation({
    mutationFn: async ({ calendarId, eventId }: { calendarId: string; eventId: string }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.functions.invoke('calendar-manager', {
        body: { 
          action: 'delete-event',
          calendarId,
          userId: user.id,
          eventId
        }
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error('Falha ao deletar evento');

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({
        title: 'Sucesso',
        description: 'Evento deletado com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar o evento',
        variant: 'destructive',
      });
    },
  });

  // Função para carregar eventos de calendários específicos
  const loadEventsForCalendars = async (selectedCalendars: string[], timeMin?: string, timeMax?: string) => {
    if (!user || !selectedCalendars.length) return [];

    return await loadEventsFromCalendars(selectedCalendars, user.id, timeMin, timeMax);
  };

  return {
    // Dados
    userCalendars,
    events,
    
    // Estados de loading
    isLoading: calendarsLoading || eventsLoading,
    calendarsLoading,
    eventsLoading,
    
    // Estados de erro
    calendarsError,
    eventsError,
    
    // Funções de refetch
    refetchCalendars,
    refetchEvents,
    
    // Mutations
    createEvent: createEventMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,
    
    // Estados das mutations
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
    
    // Função para carregar eventos
    loadEventsForCalendars,
    
    // Utilitários
    getActiveCalendars: () => userCalendars.filter(cal => cal.is_active),
    getPrimaryCalendar: () => userCalendars.find(cal => cal.is_primary),
  };
}; 