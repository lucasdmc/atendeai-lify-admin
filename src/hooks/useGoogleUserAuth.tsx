import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { UserCalendar, GoogleAuthState } from '@/types/calendar'
import { googleAuthManager } from '@/services/google/auth'
import { useGoogleAuthRedirect } from '@/hooks/useGoogleAuthRedirect'

export const useGoogleUserAuth = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [state, setState] = useState<GoogleAuthState>({
    isAuthenticated: false,
    userCalendars: [],
    isLoading: false,
    error: null
  })

  // Verificar se o usuário já tem calendários conectados
  const checkAuthentication = useCallback(async () => {
    if (!user) return

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const { data, error } = await supabase.functions.invoke('google-user-auth', {
        body: { 
          action: 'list-calendars',
          userId: user.id
        }
      })

      if (error) {
        console.error('Erro ao verificar autenticação:', error)
        setState(prev => ({ 
          ...prev, 
          isAuthenticated: false, 
          userCalendars: [],
          error: error.message 
        }))
        return
      }

      const calendars = data.calendars || []
      setState(prev => ({
        ...prev,
        isAuthenticated: calendars.length > 0,
        userCalendars: calendars,
        isLoading: false
      }))

      console.log(`✅ ${calendars.length} calendários encontrados para o usuário`)
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

  // Iniciar processo de autenticação - USANDO A LÓGICA QUE FUNCIONA
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
  useGoogleAuthRedirect(() => {
    // Recarregar calendários após autenticação bem-sucedida
    checkAuthentication()
  })

  // Adicionar calendário específico
  const addCalendar = useCallback(async (
    calendarId: string, 
    calendarName: string, 
    calendarColor: string
  ) => {
    if (!user) return

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const { data, error } = await supabase.functions.invoke('google-user-auth', {
        body: { 
          action: 'add-calendar',
          userId: user.id,
          calendarId,
          calendarName,
          calendarColor
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      // Recarregar calendários
      await checkAuthentication()
      
      toast({
        title: 'Sucesso',
        description: 'Calendário adicionado com sucesso!',
      })
    } catch (error) {
      console.error('Erro ao adicionar calendário:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao adicionar calendário',
        isLoading: false
      }))
      
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar calendário',
        variant: 'destructive',
      })
    }
  }, [user, checkAuthentication, toast])

  // Desconectar calendários
  const disconnectCalendars = useCallback(async () => {
    if (!user) return

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const { data, error } = await supabase.functions.invoke('google-user-auth', {
        body: { 
          action: 'disconnect-calendar',
          userId: user.id
        }
      })

      if (error) {
        throw new Error(error.message)
      }

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

  // Verificar autenticação quando o usuário mudar
  useEffect(() => {
    checkAuthentication()
  }, [user, checkAuthentication])

  return {
    ...state,
    initiateAuth,
    addCalendar,
    disconnectCalendars,
    checkAuthentication,
  }
} 