import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useGoogleUserAuth } from '@/hooks/useGoogleUserAuth'
import { useMultiCalendar } from '@/hooks/useMultiCalendar'
import { useClinic } from '@/contexts/ClinicContext'
import CalendarView from '@/components/calendar/CalendarView'
import AgendamentosHeader from '@/components/agendamentos/AgendamentosHeader'
import UpcomingAppointments from '@/components/agendamentos/UpcomingAppointments'
import CalendarSelector from '@/components/agendamentos/CalendarSelector'
import GoogleAuthSetup from '@/components/agendamentos/GoogleAuthSetup'
import LoadingState from '@/components/agendamentos/LoadingState'
import { GroupCalendarWarning } from '@/components/agendamentos/GroupCalendarWarning'
import { GoogleCalendarEvent } from '@/types/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, AlertCircle } from 'lucide-react'

const Agendamentos = () => {
  // Hook para autenticação geral
  const { user } = useAuth()
  const { selectedClinic } = useClinic();
  
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

  // Filtrar os calendários pela clínica selecionada
  const filteredUserCalendars = selectedClinic
    ? userCalendars.filter(cal => cal.clinic_id === selectedClinic.id)
    : userCalendars;

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
    syncCalendar,
    fetchEventsFromCalendars,
    forceSyncEvents
  } = useMultiCalendar(
    user && isAuthenticated && !showCalendarSelector && selectedCalendars.length > 0 ? selectedCalendars : []
  )

  // Selecionar calendários ativos automaticamente
  useEffect(() => {
    if (
      filteredUserCalendars.length > 0 &&
      selectedCalendars.length === 0 &&
      isAuthenticated
    ) {
      const activeCalendars = filteredUserCalendars
        .filter(cal => cal.is_active)
        .map(cal => cal.google_calendar_id);

      if (activeCalendars.length > 0) {
        setSelectedCalendars(activeCalendars);
      }
    }
  }, [filteredUserCalendars, isAuthenticated, selectedCalendars.length]);

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

    const targetCalendar = filteredUserCalendars.find(cal => 
      selectedCalendars.includes(cal.google_calendar_id) && cal.is_primary
    ) || filteredUserCalendars.find(cal => 
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

    const targetCalendar = filteredUserCalendars.find(cal => 
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

    const targetCalendar = filteredUserCalendars.find(cal => 
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
  if (authLoading) {
    return <LoadingState />
  }

  // Se está mostrando o seletor de calendários
  if (showCalendarSelector && availableCalendars.length > 0) {
    return (
      <div className="container mx-auto p-6">
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
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <GoogleAuthSetup
            isAuthenticated={isAuthenticated}
            userCalendars={filteredUserCalendars}
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

  // Verificar se há clínica selecionada
  if (!selectedClinic) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Selecione uma clínica no cabeçalho para visualizar os agendamentos.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Botões de ação */}
      <div className="flex justify-end gap-2">
        <Button 
          onClick={handleRefreshEvents} 
          disabled={eventsLoading} 
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${eventsLoading ? 'animate-spin' : ''}`} />
          {eventsLoading ? 'Atualizando...' : 'Atualizar eventos'}
        </Button>
      </div>

      {/* Header com estatísticas */}
      <AgendamentosHeader 
        isConnected={isAuthenticated}
        onCreateEvent={handleCreateEvent}
        eventsCount={events.length}
        calendarsCount={filteredUserCalendars.length}
      />

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar com seleção de calendários */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <CalendarSelector 
                userCalendars={filteredUserCalendars}
                selectedCalendars={selectedCalendars}
                onCalendarToggle={handleCalendarToggle}
                onRefreshCalendars={() => {}}
                onDisconnectCalendars={disconnectCalendars}
                onAddCalendar={initiateAuth}
                isLoading={authLoading || eventsLoading}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Área principal do calendário */}
        <div className="lg:col-span-3 space-y-6">
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
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar eventos: {eventsError}
          </AlertDescription>
        </Alert>
      )}

      {/* Mensagem quando não há calendários selecionados */}
      {isAuthenticated && selectedCalendars.length === 0 && filteredUserCalendars.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Selecione pelo menos um calendário para visualizar os eventos.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default Agendamentos
