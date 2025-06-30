import { useState, useEffect } from 'react'
import { useGoogleUserAuth } from '@/hooks/useGoogleUserAuth'
import { useMultiCalendar } from '@/hooks/useMultiCalendar'
import CalendarView from '@/components/calendar/CalendarView'
import AgendamentosHeader from '@/components/agendamentos/AgendamentosHeader'
import UpcomingAppointments from '@/components/agendamentos/UpcomingAppointments'
import CalendarSelector from '@/components/agendamentos/CalendarSelector'
import GoogleAuthSetup from '@/components/agendamentos/GoogleAuthSetup'
import LoadingState from '@/components/agendamentos/LoadingState'
import { GoogleCalendarEvent } from '@/types/calendar'

const Agendamentos = () => {
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

  // Hook para múltiplos calendários
  const {
    events,
    isLoading: eventsLoading,
    error: eventsError,
    createEvent,
    updateEvent,
    deleteEvent,
    syncCalendar
  } = useMultiCalendar(selectedCalendars)

  // Selecionar calendários ativos automaticamente
  useEffect(() => {
    if (userCalendars.length > 0 && selectedCalendars.length === 0) {
      // Selecionar calendários ativos por padrão
      const activeCalendars = userCalendars
        .filter(cal => cal.is_active)
        .map(cal => cal.google_calendar_id)
      
      setSelectedCalendars(activeCalendars)
    }
  }, [userCalendars, selectedCalendars.length])

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

  // Loading inicial
  if (authLoading) {
    return <LoadingState />
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

  // Se está mostrando o seletor de calendários
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

  return (
    <div className="space-y-4 p-6">
      {/* Header com estatísticas */}
      <AgendamentosHeader 
        onRefetch={() => {}} // Removido checkAuthentication
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
