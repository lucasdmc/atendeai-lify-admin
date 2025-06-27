import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { GoogleCalendarEvent, MultiCalendarState, UserCalendar } from '@/types/calendar'

export const useMultiCalendar = (selectedCalendars: string[]) => {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [state, setState] = useState<MultiCalendarState>({
    selectedCalendars: [],
    events: [],
    isLoading: false,
    error: null
  })

  // Buscar eventos de múltiplos calendários
  const fetchEventsFromCalendars = useCallback(async (
    calendarIds: string[],
    timeMin?: string,
    timeMax?: string
  ) => {
    if (!user || calendarIds.length === 0) {
      setState(prev => ({ ...prev, events: [], isLoading: false }))
      return
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const allEvents: GoogleCalendarEvent[] = []
      
      // Buscar eventos de cada calendário selecionado
      for (const calendarId of calendarIds) {
        try {
          const { data, error } = await supabase.functions.invoke('calendar-manager', {
            body: { 
              action: 'list-events',
              calendarId,
              userId: user.id,
              timeMin: timeMin || new Date().toISOString(),
              timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          })

          if (error) {
            console.error(`Erro ao buscar eventos do calendário ${calendarId}:`, error)
            continue
          }

          if (data.success && data.events) {
            allEvents.push(...data.events)
          }
        } catch (error) {
          console.error(`Erro ao buscar eventos do calendário ${calendarId}:`, error)
        }
      }

      // Ordenar eventos por data de início
      const sortedEvents = allEvents.sort((a, b) => 
        new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime()
      )

      setState(prev => ({
        ...prev,
        events: sortedEvents,
        isLoading: false
      }))

      console.log(`✅ ${sortedEvents.length} eventos carregados de ${calendarIds.length} calendários`)
    } catch (error) {
      console.error('Erro ao buscar eventos:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao buscar eventos',
        isLoading: false
      }))
      
      toast({
        title: 'Erro',
        description: 'Falha ao carregar eventos',
        variant: 'destructive',
      })
    }
  }, [user, toast])

  // Criar evento em um calendário específico
  const createEvent = useCallback(async (
    calendarId: string,
    eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>
  ): Promise<GoogleCalendarEvent> => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    try {
      const { data, error } = await supabase.functions.invoke('calendar-manager', {
        body: { 
          action: 'create-event',
          calendarId,
          userId: user.id,
          eventData
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data.success) {
        throw new Error('Falha ao criar evento')
      }

      // Recarregar eventos
      await fetchEventsFromCalendars(selectedCalendars)
      
      toast({
        title: 'Sucesso',
        description: 'Evento criado com sucesso!',
      })

      return data.event
    } catch (error) {
      console.error('Erro ao criar evento:', error)
      
      toast({
        title: 'Erro',
        description: 'Falha ao criar evento',
        variant: 'destructive',
      })
      
      throw error
    }
  }, [user, selectedCalendars, fetchEventsFromCalendars, toast])

  // Atualizar evento
  const updateEvent = useCallback(async (
    calendarId: string,
    eventId: string,
    eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>
  ): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    try {
      const { data, error } = await supabase.functions.invoke('calendar-manager', {
        body: { 
          action: 'update-event',
          calendarId,
          eventId,
          userId: user.id,
          eventData
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data.success) {
        throw new Error('Falha ao atualizar evento')
      }

      // Recarregar eventos
      await fetchEventsFromCalendars(selectedCalendars)
      
      toast({
        title: 'Sucesso',
        description: 'Evento atualizado com sucesso!',
      })
    } catch (error) {
      console.error('Erro ao atualizar evento:', error)
      
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar evento',
        variant: 'destructive',
      })
      
      throw error
    }
  }, [user, selectedCalendars, fetchEventsFromCalendars, toast])

  // Deletar evento
  const deleteEvent = useCallback(async (
    calendarId: string,
    eventId: string
  ): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    try {
      const { data, error } = await supabase.functions.invoke('calendar-manager', {
        body: { 
          action: 'delete-event',
          calendarId,
          eventId,
          userId: user.id
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data.success) {
        throw new Error('Falha ao deletar evento')
      }

      // Recarregar eventos
      await fetchEventsFromCalendars(selectedCalendars)
      
      toast({
        title: 'Sucesso',
        description: 'Evento deletado com sucesso!',
      })
    } catch (error) {
      console.error('Erro ao deletar evento:', error)
      
      toast({
        title: 'Erro',
        description: 'Falha ao deletar evento',
        variant: 'destructive',
      })
      
      throw error
    }
  }, [user, selectedCalendars, fetchEventsFromCalendars, toast])

  // Sincronizar calendário
  const syncCalendar = useCallback(async (calendarId: string): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      const { data, error } = await supabase.functions.invoke('calendar-manager', {
        body: { 
          action: 'sync-calendar',
          calendarId,
          userId: user.id
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data.success) {
        throw new Error('Falha ao sincronizar calendário')
      }

      // Recarregar eventos
      await fetchEventsFromCalendars(selectedCalendars)
      
      toast({
        title: 'Sucesso',
        description: `Calendário sincronizado! ${data.eventsCount} eventos processados.`,
      })
    } catch (error) {
      console.error('Erro ao sincronizar calendário:', error)
      
      toast({
        title: 'Erro',
        description: 'Falha ao sincronizar calendário',
        variant: 'destructive',
      })
      
      throw error
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [user, selectedCalendars, fetchEventsFromCalendars, toast])

  // Buscar eventos quando calendários selecionados mudarem
  useEffect(() => {
    if (selectedCalendars.length > 0) {
      fetchEventsFromCalendars(selectedCalendars)
    } else {
      setState(prev => ({ ...prev, events: [] }))
    }
  }, [selectedCalendars, fetchEventsFromCalendars])

  return {
    ...state,
    createEvent,
    updateEvent,
    deleteEvent,
    syncCalendar,
    fetchEventsFromCalendars
  }
} 