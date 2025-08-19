import { useState, useEffect, useMemo, useCallback } from 'react'
import { useGoogleUserAuth } from '@/hooks/useGoogleUserAuth'
import { useMultiCalendar } from '@/hooks/useMultiCalendar'
import { GoogleCalendarEvent } from '@/types/calendar'
import { LoadingPage } from '@/components/ui/loading'
import GoogleAuthSetup from '@/components/agendamentos/GoogleAuthSetup'
import { GoogleCalendarSelector } from '@/components/agendamentos/GoogleCalendarSelector'
import OAuthDebugPanel from '@/components/agendamentos/OAuthDebugPanel'
import { useAuth } from '@/hooks/useAuth'
import { useClinic } from '@/contexts/ClinicContext'
import CalendarMainView from '@/components/agendamentos/CalendarMainView'
import CalendarSidebar from '@/components/agendamentos/CalendarSidebar'
import CalendarHeader from '@/components/agendamentos/CalendarHeader'
import { CalendarMigrationStatus } from '@/components/agendamentos/CalendarMigrationStatus'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const Agendamentos = () => {
  const { user } = useAuth()
  const { selectedClinicId, selectedClinic } = useClinic()
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
  const [selectedServiceKey, setSelectedServiceKey] = useState<string>('')
  const [selectedProfessionalKey, setSelectedProfessionalKey] = useState<string>('')

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
      isAuthenticated &&
      selectedClinicId // Só selecionar se uma clínica estiver selecionada
    ) {
      const activeCalendars = userCalendars
        .filter(cal => cal.is_active)
        .map(cal => cal.google_calendar_id);

      if (activeCalendars.length > 0) {
        setSelectedCalendars(activeCalendars);
      }
    }
  }, [userCalendars, isAuthenticated, selectedClinicId]);

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

  // Preferências automáticas por serviço/profissional a partir do JSON da clínica
  const clinicJson = (selectedClinic as any)?.contextualization_json || {}
  const clinicCalendars: Array<any> = clinicJson?.google_calendar?.calendarios || []

  useEffect(() => {
    if (!userCalendars || userCalendars.length === 0) return
    const preferredIds = new Set<string>()
    clinicCalendars.forEach((m: any) => {
      if (selectedProfessionalKey && m.level === 'professional' && m.professional_key === selectedProfessionalKey) {
        preferredIds.add(m.calendar_id)
      }
      if (!selectedProfessionalKey && selectedServiceKey && m.level === 'service' && m.service_key === selectedServiceKey) {
        preferredIds.add(m.calendar_id)
      }
    })
    if (preferredIds.size > 0) {
      const intersecting = userCalendars
        .map(c => c.google_calendar_id)
        .filter(id => preferredIds.has(id))
      if (intersecting.length > 0) {
        setSelectedCalendars(intersecting)
      }
    }
  }, [selectedServiceKey, selectedProfessionalKey, userCalendars, clinicCalendars])

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
            onCalendarsSelected={onCalendarsSelected}
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
        <div className="max-w-4xl w-full space-y-6">
          {/* Painel de Debug OAuth - Apenas em desenvolvimento ou quando há erros */}
          {(!isAuthenticated || authError) && (
            <OAuthDebugPanel />
          )}
          
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

  // Verificar se uma clínica está selecionada
  if (!selectedClinicId) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Nenhuma Clínica Selecionada
          </h2>
          <p className="text-gray-600 mb-6">
            Para acessar os agendamentos, selecione uma clínica no seletor acima.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Dica:</strong> Os calendários agora são associados às clínicas específicas para melhor organização.
            </p>
          </div>
        </div>
      </div>
    );
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
        clinicName={selectedClinic?.name || 'Clínica Selecionada'}
      />

      {/* Filtros por Serviço / Profissional (mapeamento do JSON da clínica) */}
      <div className="px-4 pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Select value={selectedServiceKey} onValueChange={(v) => { setSelectedProfessionalKey(''); setSelectedServiceKey(v) }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrar por serviço (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {(clinicJson?.servicos?.consultas || []).map((s: any) => (
                <SelectItem key={s.id || s.nome} value={(s.id || s.nome || '').toString()}>
                  {s.nome || s.id}
                </SelectItem>
              ))}
              {(clinicJson?.servicos?.exames || []).map((s: any) => (
                <SelectItem key={s.id || s.nome} value={(s.id || s.nome || '').toString()}>
                  {s.nome || s.id}
                </SelectItem>
              ))}
              {(clinicJson?.servicos?.procedimentos || []).map((s: any) => (
                <SelectItem key={s.id || s.nome} value={(s.id || s.nome || '').toString()}>
                  {s.nome || s.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={selectedProfessionalKey} onValueChange={(v) => { setSelectedServiceKey(''); setSelectedProfessionalKey(v) }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrar por profissional (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {(clinicJson?.profissionais || []).map((p: any) => (
                <SelectItem key={p.id || p.nome_completo} value={(p.id || p.nome_completo || '').toString()}>
                  {p.nome_completo || p.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
            clinicName={selectedClinic?.name || 'Clínica Selecionada'}
          />

          {/* Área principal do calendário */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Status da migração */}
            <CalendarMigrationStatus />
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