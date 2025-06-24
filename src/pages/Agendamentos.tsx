
import { useGoogleServiceAccount } from '@/hooks/useGoogleServiceAccount';
import CalendarView from '@/components/calendar/CalendarView';
import AgendamentosHeader from '@/components/agendamentos/AgendamentosHeader';
import AgendamentosStats from '@/components/agendamentos/AgendamentosStats';
import UpcomingAppointments from '@/components/agendamentos/UpcomingAppointments';
import EmptyConnectionState from '@/components/agendamentos/EmptyConnectionState';
import LoadingState from '@/components/agendamentos/LoadingState';

const Agendamentos = () => {
  const {
    isConnected,
    isLoading,
    events,
    isLoadingEvents,
    calendarId,
    refetch,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useGoogleServiceAccount();

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6 p-6">
      <AgendamentosHeader 
        onRefetch={refetch} 
        isConnected={isConnected}
        onCreateEvent={createEvent}
      />

      {isConnected ? (
        <div className="space-y-6">
          {/* Estatísticas no topo */}
          <AgendamentosStats events={events} />

          {/* Layout principal: Calendário e Próximos Agendamentos */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Calendário principal */}
            <div className="xl:col-span-2">
              <CalendarView 
                events={events} 
                isLoading={isLoadingEvents}
                onUpdateEvent={updateEvent}
                onDeleteEvent={deleteEvent}
              />
            </div>

            {/* Próximos agendamentos na lateral direita */}
            <div className="xl:col-span-1">
              <UpcomingAppointments 
                events={events} 
                isLoadingEvents={isLoadingEvents}
                onUpdateEvent={updateEvent}
                onDeleteEvent={deleteEvent}
              />
            </div>
          </div>
        </div>
      ) : (
        <EmptyConnectionState calendarId={calendarId} />
      )}
    </div>
  );
};

export default Agendamentos;
