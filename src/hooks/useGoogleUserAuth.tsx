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
import { useGoogleConnectionManager } from '@/hooks/useGoogleConnectionManager'
import apiClient from '@/services/apiClient'

export const useGoogleUserAuth = () => {
  const { user } = useAuth()
  const { selectedClinicId } = useClinic()
  const { toast } = useToast()
  
  // Usar o hook de conexão para evitar duplicação
  const connectionManager = useGoogleConnectionManager()
  
  const [state, setState] = useState<GoogleAuthState>({
    isAuthenticated: false,
    userCalendars: [],
    isLoading: false,
    error: null
  })

  const [showCalendarSelector, setShowCalendarSelector] = useState(false)
  const [availableCalendars, setAvailableCalendars] = useState<any[]>([])

  const loadAvailableCalendars = useCallback(async () => {
    if (!selectedClinicId) return
    const resp = await apiClient.get(`/api/google/calendars/list`, { params: { clinicId: selectedClinicId } } as any)
    if (resp.success) {
      setAvailableCalendars(resp.data as any)
      setShowCalendarSelector(true)
    } else {
      toast({ title: 'Erro', description: resp.error || 'Falha ao listar calendários', variant: 'destructive' })
    }
  }, [selectedClinicId, toast])

  // Verificar se o usuário já tem calendários conectados
  const checkAuthentication = useCallback(async () => {
    if (!user) return

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // Verificar migração necessária
      if (selectedClinicId) {
        try {
          const { needsMigration } = await CalendarMigrationService.checkMigrationNeeded(user.id)
          if (needsMigration) {
            await CalendarMigrationService.autoMigrateCalendars(user.id, selectedClinicId)
          }
        } catch {}
      }
      
      // Usar o connectionManager para verificar status de conexão
      const isConnected = connectionManager.isConnected
      
      // Buscar calendários do usuário (legado) para manter compatibilidade de UI
      let query = supabase
        .from('user_calendars')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
      if (selectedClinicId) query = query.eq('clinic_id', selectedClinicId)
      const { data: userCalendars, error: calendarsError } = await query

      if (calendarsError) {
        setState(prev => ({ ...prev, isAuthenticated: false, userCalendars: [], isLoading: false, error: 'Erro ao carregar calendários' }))
        return
      }

      const tokens = await googleTokenManager.getStoredTokens()
      const hasValidTokens = tokens && new Date(tokens.expires_at) > new Date()

      setState(prev => ({
        ...prev,
        isAuthenticated: Boolean((userCalendars || []).length > 0 && hasValidTokens) || isConnected,
        userCalendars: (userCalendars || []).map(cal => ({
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

      // Se conectado por clínica, buscar calendários disponíveis pelo backend
      if (selectedClinicId && isConnected) {
        await loadAvailableCalendars()
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isAuthenticated: false, 
        userCalendars: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        isLoading: false
      }))
    }
  }, [user, selectedClinicId, loadAvailableCalendars, connectionManager.isConnected])

  // Iniciar processo de autenticação
  const initiateAuth = useCallback(async () => {
    if (!user) {
      toast({ title: 'Erro', description: 'Usuário não autenticado', variant: 'destructive' })
      return
    }
    if (!selectedClinicId) {
      toast({ title: 'Erro', description: 'Selecione uma clínica para conectar', variant: 'destructive' })
      return
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // Usar o connectionManager se disponível, senão usar o método legado
      if (connectionManager.connectToGoogle) {
        await connectionManager.connectToGoogle()
      } else {
        await googleAuthManager.initiateAuth(selectedClinicId)
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao iniciar autenticação', isLoading: false }))
      toast({ title: 'Erro', description: 'Falha ao conectar com Google', variant: 'destructive' })
    }
  }, [user, toast, selectedClinicId, connectionManager.connectToGoogle])

  // Processar callback (legado) — manter compatível
  useGoogleAuthRedirect(async (calendars) => {
    if (calendars && calendars.length > 0) {
      setAvailableCalendars(calendars)
      setShowCalendarSelector(true)
    }
  })

  // Pós-associação de calendários
  const handleCalendarsSelected = useCallback(async () => {
    setShowCalendarSelector(false)
    setAvailableCalendars([])
    await checkAuthentication()
    toast({ title: 'Sucesso', description: `Calendários associados à clínica com sucesso!` })
  }, [checkAuthentication, toast])

  // Cancelar seleção
  const handleCancelSelection = useCallback(() => {
    setShowCalendarSelector(false)
    setAvailableCalendars([])
    checkAuthentication()
  }, [checkAuthentication])

  // Desconectar calendários
  const disconnectCalendars = useCallback(async (calendarIds?: string[]) => {
    if (!selectedClinicId) {
      toast({ title: 'Erro', description: 'Selecione uma clínica para desconectar calendários', variant: 'destructive' })
      return
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // Usar o connectionManager para desconectar
      await connectionManager.disconnectFromGoogle()
      
      // Atualizar estado local para sincronizar com connectionManager
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        userCalendars: [],
        isLoading: false
      }))
      
      // Limpar calendários selecionados
      setShowCalendarSelector(false)
      setAvailableCalendars([])
      
      toast({ title: 'Sucesso', description: 'Calendários desconectados com sucesso' })
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao desconectar calendários',
        isLoading: false 
      }))
      toast({ title: 'Erro', description: 'Falha ao desconectar calendários', variant: 'destructive' })
    }
  }, [selectedClinicId, toast, connectionManager])

  // Verificar autenticação quando o usuário mudar
  useEffect(() => {
    if (user) {
      checkAuthentication()
    } else {
      setState({ isAuthenticated: false, userCalendars: [], isLoading: false, error: null })
      setShowCalendarSelector(false)
      setAvailableCalendars([])
    }
  }, [user])

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