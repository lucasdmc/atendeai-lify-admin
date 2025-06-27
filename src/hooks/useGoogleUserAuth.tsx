import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { UserCalendar, GoogleAuthState } from '@/types/calendar'

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
      
      const { data, error } = await supabase.functions.invoke('google-user-auth', {
        body: { 
          action: 'initiate-auth',
          state: 'auth_' + Date.now(),
          userId: user.id
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      // Redirecionar para o Google OAuth
      window.location.href = data.authUrl
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

  // Processar callback do Google OAuth
  const handleCallback = useCallback(async (code: string, state: string) => {
    if (!user) return

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const { data, error } = await supabase.functions.invoke('google-user-auth', {
        body: { 
          action: 'handle-callback',
          code,
          state,
          userId: user.id
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      // Recarregar calendários após autenticação bem-sucedida
      await checkAuthentication()
      
      toast({
        title: 'Sucesso',
        description: `${data.calendarsCount} calendários conectados com sucesso!`,
      })
    } catch (error) {
      console.error('Erro ao processar callback:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao processar autenticação',
        isLoading: false
      }))
      
      toast({
        title: 'Erro',
        description: 'Falha ao processar autenticação',
        variant: 'destructive',
      })
    }
  }, [user, checkAuthentication, toast])

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

  // Renovar token
  const refreshToken = useCallback(async () => {
    if (!user) return

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const { data, error } = await supabase.functions.invoke('google-user-auth', {
        body: { 
          action: 'refresh-token',
          userId: user.id
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      // Recarregar calendários
      await checkAuthentication()
      
      toast({
        title: 'Sucesso',
        description: 'Token renovado com sucesso!',
      })
    } catch (error) {
      console.error('Erro ao renovar token:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao renovar token',
        isLoading: false
      }))
      
      toast({
        title: 'Erro',
        description: 'Falha ao renovar token',
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
        title: 'Sucesso',
        description: 'Calendários desconectados com sucesso!',
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

  // Verificar autenticação na inicialização
  useEffect(() => {
    if (user) {
      checkAuthentication()
    }
  }, [user, checkAuthentication])

  // Verificar se há código de autorização na URL (callback do Google)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    
    if (code && state && user) {
      handleCallback(code, state)
      
      // Limpar parâmetros da URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('code')
      newUrl.searchParams.delete('state')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [user, handleCallback])

  return {
    ...state,
    initiateAuth,
    handleCallback,
    addCalendar,
    refreshToken,
    disconnectCalendars,
    checkAuthentication
  }
} 