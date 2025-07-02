import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useGoogleUserAuth } from '@/hooks/useGoogleUserAuth'
import { useMultiCalendar } from '@/hooks/useMultiCalendar'
import CalendarView from '@/components/calendar/CalendarView'
import AgendamentosHeader from '@/components/agendamentos/AgendamentosHeader'
import UpcomingAppointments from '@/components/agendamentos/UpcomingAppointments'
import CalendarSelector from '@/components/agendamentos/CalendarSelector'
import GoogleAuthSetup from '@/components/agendamentos/GoogleAuthSetup'
import LoadingState from '@/components/agendamentos/LoadingState'
import { GroupCalendarWarning } from '@/components/agendamentos/GroupCalendarWarning'
import { GoogleCalendarEvent } from '@/types/calendar'
import { Button } from '@/components/ui/button'

const Agendamentos = () => {
  // Hook para autenticação geral
  const { user } = useAuth()
  
  // Hook para autenticação Google
  const {
    isAuthenticated,
    userCalendars,
    isLoading: authLoading,
    error: authError,
    initiateAuth,
    showCalendarSelector,
    availableCalendars,
    onCalendarsSelected,
    onCancelSelection,
    disconnectCalendars
  } = useGoogleUserAuth()

  // Estado para calendários selecionados
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([])

  // Hook para múltiplos calendários - só chamar quando há usuário autenticado, calendários selecionados e não está mostrando o seletor
  const {
    events,
    isLoading: eventsLoading,
    error: eventsError,
    createEvent,
    updateEvent,
    deleteEvent,
    syncCalendar,
    fetchEventsFromCalendars,
    forceSyncEvents
  } = useMultiCalendar(
    user && isAuthenticated && !showCalendarSelector && selectedCalendars.length > 0 ? selectedCalendars : []
  )

  // DEBUG: Log eventos e calendários selecionados - Comentado para limpar console
  // console.log('[DEBUG] 🎯 Events state:', {
  //   eventsCount: events.length,
  //   selectedCalendarsCount: selectedCalendars.length,
  //   selectedCalendars,
  //   eventsLoading,
  //   eventsError,
  //   events: events.slice(0, 2) // Mostrar apenas os 2 primeiros eventos para debug
  // })

  // DEBUG LOG - Comentado para limpar console
  // console.log('[DEBUG] showCalendarSelector:', showCalendarSelector, 'availableCalendars:', availableCalendars)
  // console.log('[DEBUG] showCalendarSelector type:', typeof showCalendarSelector)
  // console.log('[DEBUG] availableCalendars.length:', availableCalendars.length)
  // console.log('[DEBUG] availableCalendars type:', typeof availableCalendars)
  // console.log('[DEBUG] Condition check:', showCalendarSelector && availableCalendars.length > 0)
  
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

      // Só atualiza se for diferente
      if (
        activeCalendars.length > 0 &&
        (selectedCalendars.length !== activeCalendars.length ||
          !activeCalendars.every(id => selectedCalendars.includes(id)))
      ) {
        setSelectedCalendars(activeCalendars);
      }
    }
  }, [userCalendars, selectedCalendars, isAuthenticated]);

  // Toggle de calendário
  const handleCalendarToggle = (calendarId: string) => {
    setSelectedCalendars(prev => {
      if (prev.includes(calendarId)) {
        return prev.filter(id => id !== calendarId)
      } else {
        return [...prev, calendarId]
      }
    })
  }

  // Criar evento
  const handleCreateEvent = async (eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => {
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
  }

  // Atualizar evento
  const handleUpdateEvent = async (eventId: string, eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => {
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
  }

  // Deletar evento
  const handleDeleteEvent = async (eventId: string) => {
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
  }

  // Função para atualizar eventos manualmente
  const handleRefreshEvents = async () => {
    await forceSyncEvents()
  }

  // Loading inicial
  // console.log('[DEBUG] 🎯 CHECKING AUTH LOADING:', authLoading)
  if (authLoading) {
    // console.log('[DEBUG] 🎯 RETURNING LOADING STATE')
    return <LoadingState />
  }

  // Se está mostrando o seletor de calendários (PRIORIDADE MÁXIMA)
  if (showCalendarSelector && availableCalendars.length > 0) {
    return (
      <div className="space-y-4 p-6">
        <div className="max-w-2xl mx-auto">
          <CalendarSelector
            calendars={availableCalendars}
            onCalendarsSelected={onCalendarsSelected}
            onCancel={onCancelSelection}
          />
        </div>
      </div>
    )
  }

  // Se não está autenticado, mostrar setup do Google
  // console.log('[DEBUG] 🎯 CHECKING AUTHENTICATION:', isAuthenticated)
  // console.log('[DEBUG] 🎯 Will show Google setup?', !isAuthenticated)
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
    <div className="space-y-4 p-6">
      {/* Botão de atualizar eventos */}
      <div className="flex justify-end mb-2 gap-2">
        <Button 
          onClick={async () => {
            // Testar janela de tempo específica
            const now = new Date()
            const timeMin = new Date(now.getFullYear(), 0, 1).toISOString() // 1º de janeiro
            const timeMax = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString() // 31 de dezembro
            
            await fetchEventsFromCalendars(selectedCalendars, timeMin, timeMax)
          }} 
          disabled={eventsLoading} 
          variant="outline"
        >
          {eventsLoading ? 'Testando...' : 'Testar Ano Todo'}
        </Button>
        <Button onClick={handleRefreshEvents} disabled={eventsLoading} variant="outline">
          {eventsLoading ? 'Atualizando...' : 'Atualizar eventos'}
        </Button>
      </div>
      {/* Header com estatísticas */}
      <AgendamentosHeader 
        isConnected={isAuthenticated}
        onCreateEvent={handleCreateEvent}
        eventsCount={events.length}
        calendarsCount={userCalendars.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar com seleção de calendários */}
        <div className="lg:col-span-1">
          <CalendarSelector 
            userCalendars={userCalendars}
            selectedCalendars={selectedCalendars}
            onCalendarToggle={handleCalendarToggle}
            onRefreshCalendars={() => {}} // Removido checkAuthentication
            onDisconnectCalendars={disconnectCalendars}
            onAddCalendar={initiateAuth}
            isLoading={authLoading || eventsLoading}
          />
        </div>
        
        {/* Área principal do calendário */}
        <div className="lg:col-span-3 space-y-4">
          {/* Aviso para calendários de grupo com erro */}
          {eventsError && selectedCalendars.some(cal => cal.includes('@group.calendar.google.com')) && (
            <GroupCalendarWarning 
              calendarId={selectedCalendars.find(cal => cal.includes('@group.calendar.google.com')) || ''}
              error={eventsError}
            />
          )}
          
          {/* Próximos agendamentos */}
          <UpcomingAppointments 
            events={events} 
            isLoadingEvents={eventsLoading}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
          />

          {/* Calendário principal */}
          <div className="w-full">
            <CalendarView 
              events={events} 
              isLoading={eventsLoading}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          </div>
        </div>
      </div>

      {/* Mensagem de erro */}
      {eventsError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            Erro ao carregar eventos: {eventsError}
          </p>
        </div>
      )}
    </div>
  )
}

export default Agendamentos
