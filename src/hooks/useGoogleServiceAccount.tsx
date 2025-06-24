
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const useGoogleServiceAccount = () => {
  const [isConnected, setIsConnected] = useState(true); // Service Account sempre conectado
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const calendarId = 'fb2b1dfb1e6c600594b05785de5cf04fb38bd0376bd3f5e5d1c08c60d4c894df@group.calendar.google.com';

  const fetchEvents = async () => {
    if (!user) return;
    
    try {
      setIsLoadingEvents(true);
      console.log('📅 Buscando eventos do banco de dados...');
      
      // Buscar eventos do banco de dados local em vez do Google Calendar
      const { data: dbEvents, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar eventos do banco:', error);
        throw error;
      }

      console.log(`✅ ${dbEvents?.length || 0} eventos encontrados no banco`);

      // Converter formato do banco para o formato esperado
      const formattedEvents: GoogleCalendarEvent[] = (dbEvents || []).map(event => ({
        id: event.google_event_id,
        summary: event.title,
        description: event.description || '',
        start: {
          dateTime: event.start_time,
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: event.end_time,
          timeZone: 'America/Sao_Paulo'
        },
        location: event.location || '',
        attendees: event.attendees ? JSON.parse(event.attendees) : [],
        status: event.status || 'confirmed'
      }));

      setEvents(formattedEvents);
      console.log('✅ Eventos carregados:', formattedEvents.length);
      
    } catch (error) {
      console.error('❌ Erro ao buscar eventos:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar agendamentos',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingEvents(false);
    }
  };

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
      await fetchEvents();
      
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
      
      const { data, error } = await supabase.functions.invoke('appointment-manager', {
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

      await fetchEvents();
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
      
      const { data, error } = await supabase.functions.invoke('appointment-manager', {
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

      await fetchEvents();
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
    fetchEvents();
  };

  useEffect(() => {
    if (user) {
      console.log('👤 Usuário logado, carregando agendamentos...');
      setIsLoading(false);
      fetchEvents();
    } else {
      setIsLoading(false);
    }
  }, [user]);

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
  };
};
