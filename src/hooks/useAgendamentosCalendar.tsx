import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{ email: string }>;
  status: string;
}

export const useAgendamentosCalendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [calendarId] = useState('primary');
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [hasCheckedCalendars, setHasCheckedCalendars] = useState(false);

  // Cache para evitar múltiplas requisições
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  const fetchEvents = useCallback(async (force = false) => {
    if (!user) return;
    
    // Verificar cache para evitar requisições desnecessárias
    const now = Date.now();
    if (!force && now - lastFetchTime < CACHE_DURATION && events.length > 0) {
      console.log('📅 Usando cache de eventos (última busca há', Math.round((now - lastFetchTime) / 1000), 'segundos)');
      return;
    }
    
    try {
      setIsLoadingEvents(true);
      console.log('📅 Buscando eventos do banco de dados...');
      
      // Buscar eventos do banco de dados local em vez do Google Calendar
      const { data: dbEvents, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(50); // Limitar para performance

      if (error) {
        console.error('❌ Erro ao buscar eventos do banco:', error);
        return;
      }

      console.log(`✅ ${dbEvents?.length || 0} eventos encontrados no banco`);

      // Converter formato do banco para o formato esperado
      const formattedEvents: GoogleCalendarEvent[] = (dbEvents || [])
        .filter(event => event.start_time && event.end_time)
        .map(event => ({
          id: event.google_event_id,
          summary: event.summary || 'Sem título',
          description: '',
          start: {
            dateTime: event.start_time!,
            timeZone: 'America/Sao_Paulo'
          },
          end: {
            dateTime: event.end_time!,
            timeZone: 'America/Sao_Paulo'
          },
          location: '',
          attendees: [],
          status: 'confirmed'
        }));

      setEvents(formattedEvents);
      setLastFetchTime(now);
      console.log('✅ Eventos carregados:', formattedEvents.length);
      
    } catch (error) {
      console.error('❌ Erro ao buscar eventos:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [user, lastFetchTime, events.length]);

  const createEvent = async (eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => {
    try {
      console.log('📝 Criando novo agendamento...');
      
      // Extrair data e hora do evento
      const startDate = new Date(eventData.start.dateTime);
      const endDate = new Date(eventData.end.dateTime);
      
      const appointmentData = {
        title: eventData.summary,
        description: eventData.description || '',
        date: startDate.toISOString().split('T')[0], // YYYY-MM-DD
        startTime: startDate.toTimeString().slice(0, 5), // HH:MM
        endTime: endDate.toTimeString().slice(0, 5), // HH:MM
        location: eventData.location || 'Clínica',
        patientEmail: eventData.attendees?.[0]?.email
      };

      const { data, error } = await supabase.functions.invoke('appointment-manager', {
        body: {
          action: 'create',
          appointmentData
        }
      });

      if (error) {
        console.error('❌ Erro ao criar agendamento:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.message || 'Falha ao criar agendamento');
      }

      console.log('✅ Agendamento criado com sucesso');
      toast({
        title: 'Agendamento criado',
        description: 'Agendamento adicionado com sucesso',
      });

      // Recarregar eventos
      await fetchEvents(true);
      
      return data.appointment;
    } catch (error) {
      console.error('❌ Erro ao criar agendamento:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar agendamento',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateEvent = async (eventId: string, eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => {
    try {
      console.log('📝 Atualizando agendamento:', eventId);
      
      const { error } = await supabase.functions.invoke('appointment-manager', {
        body: {
          action: 'update',
          eventId,
          appointmentData: eventData
        }
      });

      if (error) throw error;

      toast({
        title: 'Agendamento atualizado',
        description: 'Agendamento atualizado com sucesso',
      });

      await fetchEvents(true);
    } catch (error) {
      console.error('❌ Erro ao atualizar agendamento:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar agendamento',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      console.log('🗑️ Deletando agendamento:', eventId);
      
      const { error } = await supabase.functions.invoke('appointment-manager', {
        body: {
          action: 'delete',
          eventId
        }
      });

      if (error) throw error;

      toast({
        title: 'Agendamento cancelado',
        description: 'Agendamento cancelado com sucesso',
      });

      await fetchEvents(true);
    } catch (error) {
      console.error('❌ Erro ao deletar agendamento:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao cancelar agendamento',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const refetch = () => {
    console.log('🔄 Recarregando agendamentos...');
    fetchEvents(true);
  };

  // Verificar se o usuário tem calendários conectados
  const checkCalendarConnection = useCallback(async () => {
    if (!user) return false;
    
    try {
      setIsLoading(true);
      console.log('👤 Verificando calendários integrados...');
      
      const { data: userCalendars, error } = await supabase
        .from('user_calendars')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('❌ Erro ao verificar calendários:', error);
        return false;
      }

      const hasCalendars = userCalendars && userCalendars.length > 0;
      setIsConnected(hasCalendars);
      setHasCheckedCalendars(true);
      
      if (hasCalendars) {
        console.log('✅ Calendários conectados, carregando eventos...');
        await fetchEvents();
      } else {
        console.log('⚠️ Nenhum calendário conectado');
      }
      
      return hasCalendars;
    } catch (error) {
      console.error('❌ Erro ao verificar conexão:', error);
      setIsConnected(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchEvents]);

  // Verificar calendários apenas quando o hook for inicializado
  useEffect(() => {
    if (user && !hasCheckedCalendars) {
      checkCalendarConnection();
    } else if (!user) {
      setIsLoading(false);
      setHasCheckedCalendars(false);
      setIsConnected(false);
      setEvents([]);
    }
  }, [user, hasCheckedCalendars, checkCalendarConnection]);

  return {
    isConnected,
    isLoading,
    events,
    isLoadingEvents,
    calendarId,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch,
    checkCalendarConnection,
  };
}; 