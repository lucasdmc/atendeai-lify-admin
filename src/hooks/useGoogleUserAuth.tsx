import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { UserCalendar, GoogleAuthState } from '@/types/calendar'
import { googleAuthManager } from '@/services/google/auth'
import { useGoogleAuthRedirect } from '@/hooks/useGoogleAuthRedirect'
import { googleTokenManager } from '@/services/google/tokens'

export const useGoogleUserAuth = () => {
  const { user } = useAuth()
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
      
      // Buscar calendários do usuário na tabela user_calendars
      const { data: userCalendars, error: calendarsError } = await supabase
        .from('user_calendars')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

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
      
      setState(prev => ({
        ...prev,
        isAuthenticated: Boolean(userCalendars && userCalendars.length > 0 && hasValidTokens),
        userCalendars: userCalendars || [],
        isLoading: false
      }))

      console.log(`✅ ${userCalendars?.length || 0} calendários encontrados para o usuário`)
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
    if (calendars && calendars.length > 0) {
      // Mostrar seletor de calendários
      setAvailableCalendars(calendars)
      setShowCalendarSelector(true)
    } else {
      // Se não há calendários, recarregar status
      await checkAuthentication()
    }
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

  // Desconectar calendários
  const disconnectCalendars = useCallback(async () => {
    if (!user) return

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // Deletar calendários do usuário
      const { error: deleteCalendarsError } = await supabase
        .from('user_calendars')
        .delete()
        .eq('user_id', user.id)

      if (deleteCalendarsError) {
        throw deleteCalendarsError
      }

      // Deletar tokens
      await googleTokenManager.deleteConnection()

      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        userCalendars: [],
        isLoading: false
      }))
      
      toast({
        title: 'Desconectado',
        description: 'Google Calendar desconectado com sucesso',
      })
    } catch (error) {
      console.error('Erro ao desconectar calendários:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao desconectar calendários',
        isLoading: false
      }))
      
      toast({
        title: 'Erro',
        description: 'Falha ao desconectar calendários',
        variant: 'destructive',
      })
    }
  }, [user, toast])

  useEffect(() => {
    checkAuthentication()
  }, [checkAuthentication])

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