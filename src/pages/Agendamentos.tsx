import { useState, useEffect, useMemo, useCallback } from 'react'
import { useGoogleUserAuth } from '@/hooks/useGoogleUserAuth'
import { useMultiCalendar } from '@/hooks/useMultiCalendar'
import { GoogleCalendarEvent } from '@/types/calendar'
import { LoadingPage } from '@/components/ui/loading'
import GoogleAuthSetup from '@/components/agendamentos/GoogleAuthSetup'
import { GoogleCalendarSelector } from '@/components/agendamentos/GoogleCalendarSelector'
import { useAuth } from '@/hooks/useAuth'
import CalendarMainView from '@/components/agendamentos/CalendarMainView'
import CalendarSidebar from '@/components/agendamentos/CalendarSidebar'
import CalendarHeader from '@/components/agendamentos/CalendarHeader'

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

  // Estados para o calendário
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('month')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Memoizar os calendários selecionados
  const memoizedSelectedCalendars = useMemo(() => {
    if (!user || !isAuthenticated || showCalendarSelector || selectedCalendars.length === 0) {
      return []
    }
    return selectedCalendars
  }, [user, isAuthenticated, showCalendarSelector, selectedCalendars])

  // Hook para múltiplos calendários
  const {
    events,
    isLoading: eventsLoading,
    error: eventsError,
    createEvent,
    updateEvent,
    deleteEvent,
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

      if (activeCalendars.length > 0) {
        setSelectedCalendars(activeCalendars);
      }
    }
  }, [userCalendars, isAuthenticated]);

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

    const targetCalendar = userCalendars.find(cal => 
      selectedCalendars.includes(cal.google_calendar_id)
    )

    if (!targetCalendar) {
      throw new Error('Nenhum calendário válido selecionado')
    }

    await deleteEvent(targetCalendar.google_calendar_id, eventId)
  }, [selectedCalendars, userCalendars, deleteEvent])

  // Navegação do calendário
  const handleNavigateDate = useCallback((direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate)
    
    if (direction === 'today') {
      setCurrentDate(new Date())
      return
    }

    if (viewType === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    }
    
    setCurrentDate(newDate)
  }, [currentDate, viewType])

  // Loading inicial
  if (authLoading) {
    return <LoadingPage text="Carregando agendamentos..." />
  }

  // Se está mostrando o seletor de calendários
  if (showCalendarSelector && availableCalendars.length > 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <GoogleCalendarSelector
            calendars={availableCalendars}
            onCalendarsSelected={() => {
              onCalendarsSelected([])
            }}
            onCancel={onCancelSelection}
          />
        </div>
      </div>
    )
  }

  // Se não está autenticado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <GoogleAuthSetup
            isAuthenticated={isAuthenticated}
            userCalendars={userCalendars}
            isLoading={authLoading}
            error={authError}
            onInitiateAuth={initiateAuth}
            onRefreshCalendars={() => {}}
            onDisconnectCalendars={disconnectCalendars}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        viewType={viewType}
        onViewTypeChange={setViewType}
        onNavigateDate={handleNavigateDate}
        onCreateEvent={handleCreateEvent}
        onRefreshEvents={forceSyncEvents}
        isLoading={eventsLoading}
        eventsCount={events.length}
        calendarsCount={userCalendars.length}
        isConnected={isAuthenticated}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />

      {/* Layout principal */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <CalendarSidebar
          isOpen={sidebarOpen}
          userCalendars={userCalendars}
          selectedCalendars={selectedCalendars}
          onCalendarToggle={handleCalendarToggle}
          onAddCalendar={initiateAuth}
          onDisconnectCalendars={disconnectCalendars}
          events={events}
          isLoading={eventsLoading}
        />

        {/* Área principal do calendário */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Erro de calendários de grupo */}
          {eventsError && selectedCalendars.some(cal => cal.includes('@group.calendar.google.com')) && (
            <div className="p-4 bg-yellow-50 border-b border-yellow-200">
              <p className="text-sm text-yellow-700">
                Aviso: Calendários de grupo podem ter restrições de permissão. Erro: {eventsError}
              </p>
            </div>
          )}

          {/* Calendário principal */}
          <CalendarMainView
            events={events}
            currentDate={currentDate}
            viewType={viewType}
            isLoading={eventsLoading}
            onCreateEvent={handleCreateEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onDateClick={setCurrentDate}
          />

          {/* Erro geral */}
          {eventsError && !selectedCalendars.some(cal => cal.includes('@group.calendar.google.com')) && (
            <div className="p-4 bg-destructive/10 border-t border-destructive/20">
              <p className="text-sm text-destructive">
                Erro ao carregar eventos: {eventsError}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Agendamentos