import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useClinic } from '@/contexts/ClinicContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { GoogleAuthState } from '@/types/calendar'
import { googleAuthManager } from '@/services/google/auth'
import { useGoogleAuthRedirect } from '@/hooks/useGoogleAuthRedirect'
import { googleTokenManager } from '@/services/google/tokens'
import { CalendarMigrationService } from '@/services/calendarMigrationService'

export const useGoogleUserAuth = () => {
  const { user } = useAuth()
  const { selectedClinicId } = useClinic()
  const { toast } = useToast()
  
  const [state, setState] = useState<GoogleAuthState>({
    isAuthenticated: false,
    userCalendars: [],
    isLoading: false,
    error: null
  })

  const [showCalendarSelector, setShowCalendarSelector] = useState(false)
  const [availableCalendars, setAvailableCalendars] = useState<any[]>([])

  // Verificar se o usuário já tem calendários conectados
  const checkAuthentication = useCallback(async () => {
    if (!user) return

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // Verificar se há migração necessária
      if (selectedClinicId) {
        try {
          const { needsMigration, unmigratedCount } = await CalendarMigrationService.checkMigrationNeeded(user.id)
          
          if (needsMigration) {
            console.log(`🔄 ${unmigratedCount} calendários precisam ser migrados para a clínica ${selectedClinicId}`)
            
            // Executar migração automática
            const migrationResult = await CalendarMigrationService.autoMigrateCalendars(user.id, selectedClinicId)
            
            if (migrationResult) {
              console.log('✅ Migração automática concluída:', migrationResult)
            }
          }
        } catch (error) {
          console.error('❌ Erro ao verificar migração:', error)
          // Continuar mesmo com erro na migração
        }
      }
      
      // Buscar calendários do usuário na tabela user_calendars
      // Filtrar por clínica se uma estiver selecionada
      let query = supabase
        .from('user_calendars')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
      
      // Se uma clínica está selecionada, filtrar por ela
      if (selectedClinicId) {
        query = query.eq('clinic_id', selectedClinicId)
      }
      
      const { data: userCalendars, error: calendarsError } = await query

      if (calendarsError) {
        console.error('Erro ao buscar calendários:', calendarsError)
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          userCalendars: [],
          isLoading: false,
          error: 'Erro ao carregar calendários'
        }))
        return
      }

      // Verificar se há tokens válidos usando a função do tokenManager
      const tokens = await googleTokenManager.getStoredTokens()
      const hasValidTokens = tokens && new Date(tokens.expires_at) > new Date()
      
      // Se houve migração, recarregar calendários para incluir os migrados
      let finalUserCalendars = userCalendars
      if (selectedClinicId && userCalendars && userCalendars.length === 0) {
        // Tentar buscar novamente após migração
        const { data: migratedCalendars } = await supabase
          .from('user_calendars')
          .select('*')
          .eq('user_id', user.id)
          .eq('clinic_id', selectedClinicId)
          .eq('is_active', true)
        
        if (migratedCalendars && migratedCalendars.length > 0) {
          finalUserCalendars = migratedCalendars
          console.log('✅ Calendários migrados encontrados:', migratedCalendars.length)
        }
      }
      
      setState(prev => ({
        ...prev,
        isAuthenticated: Boolean(finalUserCalendars && finalUserCalendars.length > 0 && hasValidTokens),
        userCalendars: (finalUserCalendars || []).map(cal => ({
          ...cal,
          is_primary: cal.is_primary ?? false,
          is_active: cal.is_active ?? true,
          access_token: cal.access_token || '',
          refresh_token: cal.refresh_token || null,
          expires_at: cal.expires_at || '',
          created_at: cal.created_at || new Date().toISOString(),
          updated_at: cal.updated_at || new Date().toISOString()
        })),
        isLoading: false
      }))
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      setState(prev => ({ 
        ...prev, 
        isAuthenticated: false, 
        userCalendars: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        isLoading: false
      }))
    }
  }, [user])

  // Iniciar processo de autenticação
  const initiateAuth = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive',
      })
      return
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // Usar a lógica que funciona do sistema antigo
      await googleAuthManager.initiateAuth()
    } catch (error) {
      console.error('Erro ao iniciar autenticação:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao iniciar autenticação',
        isLoading: false
      }))
      
      toast({
        title: 'Erro',
        description: 'Falha ao conectar com Google',
        variant: 'destructive',
      })
    }
  }, [user, toast])

  // Processar callback do Google OAuth usando o sistema que funciona
  useGoogleAuthRedirect(async (calendars) => {
    console.log('[DEBUG] Callback useGoogleAuthRedirect', calendars)
    if (calendars && calendars.length > 0) {
      setAvailableCalendars(calendars)
      setShowCalendarSelector(true)
      console.log('[DEBUG] setShowCalendarSelector(true)')
    }
    // Removido checkAuthentication() aqui para evitar conflitos
  })

  // Função para quando calendários são selecionados
  const handleCalendarsSelected = useCallback(async (selectedCalendars: any[]) => {
    if (!user) return

    try {
      setState(prev => ({ ...prev, isLoading: true }))

      // Buscar tokens do usuário usando o tokenManager
      const tokens = await googleTokenManager.getStoredTokens()

      if (!tokens) {
        throw new Error('Tokens não encontrados')
      }

      // Salvar calendários selecionados na tabela user_calendars
      const calendarsToSave = selectedCalendars.map((cal, index) => ({
        user_id: user.id,
        google_calendar_id: cal.id,
        calendar_name: cal.summary,
        calendar_color: cal.backgroundColor || '#4285f4',
        is_primary: cal.primary || index === 0, // Primeiro calendário como principal
        is_active: true,
        clinic_id: selectedClinicId, // Associar à clínica selecionada
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expires_at: tokens.expires_at,
      }))

      const { error: saveError } = await supabase
        .from('user_calendars')
        .upsert(calendarsToSave, { onConflict: 'user_id,google_calendar_id' })

      if (saveError) {
        throw saveError
      }

      setShowCalendarSelector(false)
      setAvailableCalendars([])
      await checkAuthentication() // Recarregar calendários conectados

      toast({
        title: 'Sucesso',
        description: `${selectedCalendars.length} calendário(s) conectado(s) com sucesso!`,
      })
    } catch (error) {
      console.error('Erro ao salvar calendários:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao conectar calendários',
        variant: 'destructive',
      })
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [user, checkAuthentication, toast])

  // Função para cancelar seleção
  const handleCancelSelection = useCallback(() => {
    setShowCalendarSelector(false)
    setAvailableCalendars([])
    checkAuthentication() // Recarregar status
  }, [checkAuthentication])

  // Desconectar calendários (seletivo ou todos)
  const disconnectCalendars = useCallback(async (calendarIds?: string[]) => {
    if (!user) {
      console.log('[DEBUG] 🎯 disconnectCalendars - No user found')
      return
    }

    console.log('[DEBUG] 🎯 disconnectCalendars - Starting disconnect for user:', user.id, 'calendarIds:', calendarIds)

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      let calendarsToDelete: any[] = []
      
      if (calendarIds && calendarIds.length > 0) {
        // Desconectar apenas calendários selecionados
        console.log('[DEBUG] 🎯 disconnectCalendars - Disconnecting selected calendars:', calendarIds)
        
        const { data: selectedCalendars, error: fetchError } = await supabase
          .from('user_calendars')
          .select('id, google_calendar_id, calendar_name')
          .eq('user_id', user.id)
          .in('google_calendar_id', calendarIds)

        if (fetchError) {
          console.error('[DEBUG] 🎯 disconnectCalendars - Error fetching selected calendars:', fetchError)
          throw new Error(`Erro ao buscar calendários selecionados: ${fetchError.message}`)
        }

        calendarsToDelete = selectedCalendars || []
        console.log('[DEBUG] 🎯 disconnectCalendars - Found calendars to delete:', calendarsToDelete)
      } else {
        // Desconectar todos os calendários (comportamento original)
        console.log('[DEBUG] 🎯 disconnectCalendars - Disconnecting all calendars')
        
        const { data: userCalendars, error: fetchError } = await supabase
          .from('user_calendars')
          .select('id, google_calendar_id, calendar_name')
          .eq('user_id', user.id)

        if (fetchError) {
          console.error('[DEBUG] 🎯 disconnectCalendars - Error fetching all calendars:', fetchError)
          throw new Error(`Erro ao buscar calendários: ${fetchError.message}`)
        }

        calendarsToDelete = userCalendars || []
      }

      if (calendarsToDelete.length > 0) {
        const calendarIdsToDelete = calendarsToDelete.map(cal => cal.id)
        
        // 1. Deletar logs de sincronização primeiro (para evitar foreign key constraint)
        console.log('[DEBUG] 🎯 disconnectCalendars - Deleting sync logs...')
        const { error: deleteLogsError } = await supabase
          .from('calendar_sync_logs')
          .delete()
          .in('user_calendar_id', calendarIdsToDelete)

        if (deleteLogsError) {
          console.error('[DEBUG] 🎯 disconnectCalendars - Error deleting sync logs:', deleteLogsError)
          // Não falhar se não conseguir deletar logs, continuar
        } else {
          console.log('[DEBUG] 🎯 disconnectCalendars - Sync logs deleted successfully')
        }

        // 2. Deletar eventos de calendário (se existir a tabela)
        console.log('[DEBUG] 🎯 disconnectCalendars - Deleting calendar events...')
        try {
          const { error: deleteEventsError } = await supabase
            .from('calendar_events')
            .delete()
            .in('user_calendar_id', calendarIdsToDelete)

          if (deleteEventsError) {
            console.error('[DEBUG] 🎯 disconnectCalendars - Error deleting events:', deleteEventsError)
            // Não falhar se não conseguir deletar eventos, continuar
          } else {
            console.log('[DEBUG] 🎯 disconnectCalendars - Calendar events deleted successfully')
          }
        } catch (eventsError) {
          console.log('[DEBUG] 🎯 disconnectCalendars - Calendar events table may not exist, continuing...')
        }

        // 3. Deletar calendários selecionados
        console.log('[DEBUG] 🎯 disconnectCalendars - Deleting selected calendars...')
        const { error: deleteCalendarsError } = await supabase
          .from('user_calendars')
          .delete()
          .in('id', calendarIdsToDelete)

        if (deleteCalendarsError) {
          console.error('[DEBUG] 🎯 disconnectCalendars - Error deleting calendars:', deleteCalendarsError)
          throw new Error(`Erro ao deletar calendários: ${deleteCalendarsError.message}`)
        }

        console.log('[DEBUG] 🎯 disconnectCalendars - Calendars deleted successfully')

        // 4. Se desconectou todos os calendários, deletar tokens também
        if (!calendarIds || calendarIds.length === 0) {
          console.log('[DEBUG] 🎯 disconnectCalendars - Deleting tokens...')
          try {
            await googleTokenManager.deleteConnection()
            console.log('[DEBUG] 🎯 disconnectCalendars - Tokens deleted successfully')
          } catch (tokenError) {
            console.error('[DEBUG] 🎯 disconnectCalendars - Error deleting tokens:', tokenError)
            // Não falhar se não conseguir deletar tokens, continuar
          }
        }
      }

      // 5. Recarregar estado
      console.log('[DEBUG] 🎯 disconnectCalendars - Updating state...')
      await checkAuthentication()
      
      console.log('[DEBUG] 🎯 disconnectCalendars - Disconnect completed successfully')
      
      const calendarNames = calendarsToDelete.map(cal => cal.calendar_name).join(', ')
      toast({
        title: 'Desconectado',
        description: calendarIds && calendarIds.length > 0 
          ? `Calendário(s) desconectado(s): ${calendarNames}`
          : 'Google Calendar desconectado com sucesso',
      })
    } catch (error) {
      console.error('[DEBUG] 🎯 disconnectCalendars - Error:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao desconectar calendários',
        isLoading: false
      }))
      
      toast({
        title: 'Erro',
        description: `Falha ao desconectar calendários: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive',
      })
    }
  }, [user, toast, checkAuthentication])

  // Verificar autenticação quando o usuário mudar
  useEffect(() => {
    if (user) {
      checkAuthentication()
    } else {
      // Limpar estado quando não há usuário (logout)
      console.log('[DEBUG] 🎯 useGoogleUserAuth - User logged out, clearing state')
      setState({
        isAuthenticated: false,
        userCalendars: [],
        isLoading: false,
        error: null
      })
      setShowCalendarSelector(false)
      setAvailableCalendars([])
    }
  }, [user]) // Dependência apenas no user, não no checkAuthentication

  return {
    ...state,
    showCalendarSelector,
    availableCalendars,
    initiateAuth,
    onCalendarsSelected: handleCalendarsSelected,
    onCancelSelection: handleCancelSelection,
    disconnectCalendars,
    refetch: checkAuthentication
  }
} 