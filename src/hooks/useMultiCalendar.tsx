import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { GoogleCalendarEvent } from '@/types/calendar'

export const useMultiCalendar = (selectedCalendars: string[]) => {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [state, setState] = useState<{
    events: GoogleCalendarEvent[]
    isLoading: boolean
    error: string | null
  }>({
    events: [],
    isLoading: false,
    error: null
  })

  const fetchEventsRef = useRef<typeof fetchEventsFromCalendars>()
  const lastFetchRef = useRef<string | null>(null)

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
      
      for (const calendarId of calendarIds) {
        try {
          const { data, error } = await supabase.functions.invoke('calendar-manager', {
            body: { 
              action: 'list-events',
              calendarId,
              userId: user.id,
              timeMin: timeMin || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
              timeMax: timeMax || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              forceRefresh: true
            }
          })

          if (error) {
            console.error(`Erro ao buscar eventos do calendário ${calendarId}:`, error)
            
            let errorMessage = error.message;
            let errorTitle = 'Erro no Calendário';
            
            if (error.message.includes('403') || error.message.includes('Sem permissão')) {
              errorTitle = 'Permissão Negada';
              errorMessage = `Você não tem permissão para acessar o calendário ${calendarId.split('@')[0]}. Verifique se você tem acesso a este calendário.`;
            } else if (error.message.includes('404') || error.message.includes('não encontrado')) {
              errorTitle = 'Calendário Não Encontrado';
              errorMessage = `O calendário ${calendarId.split('@')[0]} não foi encontrado ou não está acessível.`;
            } else if (error.message.includes('401') || error.message.includes('Token de acesso inválido')) {
              errorTitle = 'Token Expirado';
              errorMessage = `O token de acesso para o calendário ${calendarId.split('@')[0]} expirou. Tente reconectar o calendário.`;
            } else if (error.message.includes('500') || error.message.includes('Erro interno')) {
              errorTitle = 'Erro do Google Calendar';
              errorMessage = `Erro interno do Google Calendar para ${calendarId.split('@')[0]}. Tente novamente em alguns minutos.`;
            } else if (calendarId.includes('@group.calendar.google.com')) {
              errorTitle = 'Calendário de Grupo';
              errorMessage = `Problema com o calendário de grupo ${calendarId.split('@')[0]}. Calendários de grupo podem ter restrições de permissão.`;
            }
            
            toast({
              title: errorTitle,
              description: errorMessage,
              variant: 'destructive',
            })
            
            continue
          }

          if (data.success && data.events) {
            allEvents.push(...data.events)
          }
        } catch (error) {
          console.error(`Erro ao buscar eventos do calendário ${calendarId}:`, error)
        }
      }

      const sortedEvents = allEvents.sort((a, b) => 
        new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime()
      )

      setState(prev => ({
        ...prev,
        events: sortedEvents,
        isLoading: false
      }))
    } catch (error) {
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

  useEffect(() => {
    fetchEventsRef.current = fetchEventsFromCalendars
  }, [fetchEventsFromCalendars])

  useEffect(() => {
    if (user && selectedCalendars.length > 0) {
      const currentCalendars = JSON.stringify(selectedCalendars);
      if (fetchEventsRef.current && currentCalendars !== lastFetchRef.current) {
        lastFetchRef.current = currentCalendars;
        
        // Adicionar debounce para evitar múltiplas requisições
        const timeoutId = setTimeout(() => {
          fetchEventsFromCalendars(selectedCalendars);
        }, 300); // 300ms de debounce
        
        return () => clearTimeout(timeoutId);
      }
    } else if (selectedCalendars.length === 0) {
      setState(prev => ({ ...prev, events: [] }));
    }
  }, [selectedCalendars, user, fetchEventsFromCalendars]);

  useEffect(() => {
    if (!user) {
      setState({
        events: [],
        isLoading: false,
        error: null
      })
    }
  }, [user])

  const createEvent = useCallback(async (
    calendarId: string,
    eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>
  ): Promise<GoogleCalendarEvent> => {
    console.log('[DEBUG] 🎯 useMultiCalendar.createEvent - calendarId:', calendarId)
    console.log('[DEBUG] 🎯 useMultiCalendar.createEvent - eventData:', eventData)
    console.log('[DEBUG] 🎯 useMultiCalendar.createEvent - user:', user?.id)
    
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    try {
      console.log('[DEBUG] 🎯 useMultiCalendar.createEvent - Invoking calendar-manager...')
      const { data, error } = await supabase.functions.invoke('calendar-manager', {
        body: { 
          action: 'create-event',
          calendarId,
          userId: user.id,
          eventData
        }
      })

      console.log('[DEBUG] 🎯 useMultiCalendar.createEvent - Response:', { data, error })

      if (error) {
        console.error('[DEBUG] 🎯 useMultiCalendar.createEvent - Supabase error:', error)
        throw new Error(error.message)
      }

      if (!data.success) {
        console.error('[DEBUG] 🎯 useMultiCalendar.createEvent - Data not successful:', data)
        throw new Error('Falha ao criar evento')
      }

      console.log('[DEBUG] 🎯 useMultiCalendar.createEvent - Event created, waiting 5 seconds before reloading...')
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      console.log('[DEBUG] 🎯 useMultiCalendar.createEvent - Now reloading events...')
      if (fetchEventsRef.current) {
        await fetchEventsRef.current(selectedCalendars)
      }
      
      toast({
        title: 'Sucesso',
        description: 'Evento criado com sucesso!',
      })

      console.log('[DEBUG] 🎯 useMultiCalendar.createEvent - Success, returning:', data.event)
      return data.event
    } catch (error) {
      console.error('[DEBUG] 🎯 useMultiCalendar.createEvent - Error:', error)
      
      toast({
        title: 'Erro',
        description: 'Falha ao criar evento',
        variant: 'destructive',
      })
      
      throw error
    }
  }, [user, selectedCalendars, toast])

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

      if (fetchEventsRef.current) {
        await fetchEventsRef.current(selectedCalendars)
      }
      
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
  }, [user, selectedCalendars, toast])

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

      if (fetchEventsRef.current) {
        await fetchEventsRef.current(selectedCalendars)
      }
      
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
  }, [user, selectedCalendars, toast])

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

      if (fetchEventsRef.current) {
        await fetchEventsRef.current(selectedCalendars)
      }
      
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
  }, [user, selectedCalendars, toast])

  const forceSyncEvents = useCallback(async () => {
    console.log('[DEBUG] 🎯 useMultiCalendar.forceSyncEvents - Starting forced sync...')
    if (selectedCalendars.length === 0) {
      console.log('[DEBUG] 🎯 useMultiCalendar.forceSyncEvents - No calendars selected')
      return
    }
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      if (fetchEventsRef.current) {
        await fetchEventsRef.current(selectedCalendars)
      }
      console.log('[DEBUG] 🎯 useMultiCalendar.forceSyncEvents - Forced sync completed')
      
      toast({
        title: 'Sincronização',
        description: 'Eventos atualizados com sucesso!',
      })
    } catch (error) {
      console.error('[DEBUG] 🎯 useMultiCalendar.forceSyncEvents - Error:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao sincronizar eventos',
        variant: 'destructive',
      })
    }
  }, [selectedCalendars, toast])

  return {
    ...state,
    createEvent,
    updateEvent,
    deleteEvent,
    syncCalendar,
    fetchEventsFromCalendars,
    forceSyncEvents
  }
} 