import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useGoogleUserAuth } from '@/hooks/useGoogleUserAuth'
import { useMultiCalendar } from '@/hooks/useMultiCalendar'
import { GoogleCalendarEvent } from '@/types/calendar'
import { LoadingPage } from '@/components/ui/loading'
import GoogleAuthSetup from '@/components/agendamentos/GoogleAuthSetup'
import CalendarSelector from '@/components/agendamentos/CalendarSelector'
import { GoogleCalendarSelector } from '@/components/agendamentos/GoogleCalendarSelector'
import AgendamentosHeader from '@/components/agendamentos/AgendamentosHeader'
import UpcomingAppointments from '@/components/agendamentos/UpcomingAppointments'
import CalendarView from '@/components/calendar/CalendarView'
import { useAuth } from '@/hooks/useAuth'

const Agendamentos = () => {
  const { user } = useAuth()
  const {
    isAuthenticated,
    userCalendars,
    isLoading: authLoading,
    error: authError,
    availableCalendars,
    showCalendarSelector,
    initiateAuth,
    onCalendarsSelected,
    onCancelSelection,
    disconnectCalendars
  } = useGoogleUserAuth()

  // Estado para calendários selecionados
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([])

  // Memoizar os calendários selecionados para evitar re-renders desnecessários
  const memoizedSelectedCalendars = useMemo(() => {
    if (!user || !isAuthenticated || showCalendarSelector || selectedCalendars.length === 0) {
      return []
    }
    return selectedCalendars
  }, [user, isAuthenticated, showCalendarSelector, selectedCalendars])

  // Hook para múltiplos calendários - só chamar quando há usuário autenticado, calendários selecionados e não está mostrando o seletor
  const {
    events,
    isLoading: eventsLoading,
    error: eventsError,
    createEvent,
    updateEvent,
    deleteEvent,
    fetchEventsFromCalendars,
    forceSyncEvents
  } = useMultiCalendar(memoizedSelectedCalendars)

  // Selecionar calendários ativos automaticamente
  useEffect(() => {
    if (
      userCalendars.length > 0 &&
      selectedCalendars.length === 0 &&
      isAuthenticated
    ) {
      const activeCalendars = userCalendars
        .filter(cal => cal.is_active)
        .map(cal => cal.google_calendar_id);

      // Só atualiza se for diferente e não estiver vazio
      if (activeCalendars.length > 0) {
        setSelectedCalendars(activeCalendars);
      }
    }
  }, [userCalendars, isAuthenticated]); // Removido selectedCalendars.length das dependências

  // Toggle de calendário
  const handleCalendarToggle = useCallback((calendarId: string) => {
    setSelectedCalendars(prev => {
      if (prev.includes(calendarId)) {
        return prev.filter(id => id !== calendarId)
      } else {
        return [...prev, calendarId]
      }
    })
  }, [])

  // Criar evento
  const handleCreateEvent = useCallback(async (eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => {
    if (selectedCalendars.length === 0) {
      throw new Error('Selecione pelo menos um calendário')
    }

    // Criar no primeiro calendário selecionado (ou calendário principal)
    const targetCalendar = userCalendars.find(cal => 
      selectedCalendars.includes(cal.google_calendar_id) && cal.is_primary
    ) || userCalendars.find(cal => 
      selectedCalendars.includes(cal.google_calendar_id)
    )

    if (!targetCalendar) {
      throw new Error('Nenhum calendário válido selecionado')
    }

    return await createEvent(targetCalendar.google_calendar_id, eventData)
  }, [selectedCalendars, userCalendars, createEvent])

  // Atualizar evento
  const handleUpdateEvent = useCallback(async (eventId: string, eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => {
    if (selectedCalendars.length === 0) {
      throw new Error('Selecione pelo menos um calendário')
    }

    // Encontrar o calendário que contém o evento
    const targetCalendar = userCalendars.find(cal => 
      selectedCalendars.includes(cal.google_calendar_id)
    )

    if (!targetCalendar) {
      throw new Error('Nenhum calendário válido selecionado')
    }

    await updateEvent(targetCalendar.google_calendar_id, eventId, eventData)
  }, [selectedCalendars, userCalendars, updateEvent])

  // Deletar evento
  const handleDeleteEvent = useCallback(async (eventId: string) => {
    if (selectedCalendars.length === 0) {
      throw new Error('Selecione pelo menos um calendário')
    }

    // Encontrar o calendário que contém o evento
    const targetCalendar = userCalendars.find(cal => 
      selectedCalendars.includes(cal.google_calendar_id)
    )

    if (!targetCalendar) {
      throw new Error('Nenhum calendário válido selecionado')
    }

    await deleteEvent(targetCalendar.google_calendar_id, eventId)
  }, [selectedCalendars, userCalendars, deleteEvent])

  // Função para atualizar eventos manualmente
  const handleRefreshEvents = useCallback(async () => {
    await forceSyncEvents()
  }, [forceSyncEvents])

  // Loading inicial
  if (authLoading) {
    return <LoadingPage text="Carregando agendamentos..." />
  }

  // Se está mostrando o seletor de calendários (PRIORIDADE MÁXIMA)
  if (showCalendarSelector && availableCalendars.length > 0) {
    return (
      <div className="space-y-4 p-6">
        <div className="max-w-2xl mx-auto">
          <GoogleCalendarSelector
            calendars={availableCalendars}
            onCalendarsSelected={() => {
              // O GoogleCalendarSelector já lida com a seleção internamente
              // então só precisamos chamar a função sem parâmetros
              onCalendarsSelected([])
            }}
            onCancel={onCancelSelection}
          />
        </div>
      </div>
    )
  }

  // Se não está autenticado, mostrar setup do Google
  if (!isAuthenticated) {
    return (
      <div className="space-y-4 p-6">
        <div className="max-w-2xl mx-auto">
          <GoogleAuthSetup
            isAuthenticated={isAuthenticated}
            userCalendars={userCalendars}
            isLoading={authLoading}
            error={authError}
            onInitiateAuth={initiateAuth}
            onRefreshCalendars={() => {}} // Removido checkAuthentication
            onDisconnectCalendars={disconnectCalendars}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header com estatísticas */}
        <AgendamentosHeader 
          isConnected={isAuthenticated}
          onCreateEvent={handleCreateEvent}
          eventsCount={events.length}
          calendarsCount={userCalendars.length}
        />

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar com seleção de calendários */}
          <div className="lg:col-span-3">
            <div className="sticky top-6 space-y-4">
              <CalendarSelector 
                userCalendars={userCalendars}
                selectedCalendars={selectedCalendars}
                onCalendarToggle={handleCalendarToggle}
                onRefreshCalendars={() => {}}
                onDisconnectCalendars={disconnectCalendars}
                onAddCalendar={initiateAuth}
                isLoading={authLoading || eventsLoading}
              />
              
              {/* Botões de ação */}
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleRefreshEvents} 
                  disabled={eventsLoading} 
                  variant="outline"
                  className="w-full"
                >
                  {eventsLoading ? 'Atualizando...' : 'Atualizar eventos'}
                </Button>
                <Button 
                  onClick={async () => {
                    const now = new Date()
                    const timeMin = new Date(now.getFullYear(), 0, 1).toISOString()
                    const timeMax = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString()
                    await fetchEventsFromCalendars(selectedCalendars, timeMin, timeMax)
                  }} 
                  disabled={eventsLoading} 
                  variant="secondary"
                  className="w-full"
                >
                  {eventsLoading ? 'Testando...' : 'Testar Ano Todo'}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Área principal do calendário */}
          <div className="lg:col-span-9 space-y-6">
            {/* Aviso para calendários de grupo com erro */}
            {eventsError && selectedCalendars.some(cal => cal.includes('@group.calendar.google.com')) && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
                <p className="text-sm text-yellow-700">
                  Aviso: Calendários de grupo podem ter restrições de permissão. Erro: {eventsError}
                </p>
              </div>
            )}
            
            {/* Próximos agendamentos */}
            <UpcomingAppointments 
              events={events} 
              isLoadingEvents={eventsLoading}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
            />

            {/* Calendário principal */}
            <CalendarView 
              events={events} 
              isLoading={eventsLoading}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          </div>
        </div>

        {/* Mensagem de erro */}
        {eventsError && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg shadow-sm">
            <p className="text-sm text-destructive">
              Erro ao carregar eventos: {eventsError}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Agendamentos
