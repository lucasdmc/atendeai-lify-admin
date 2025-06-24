
import { useGoogleServiceAccount } from '@/hooks/useGoogleServiceAccount';
import CalendarView from '@/components/calendar/CalendarView';
import AgendamentosHeader from '@/components/agendamentos/AgendamentosHeader';
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
    <div className="space-y-4 p-6">
      <AgendamentosHeader 
        onRefetch={refetch} 
        isConnected={isConnected}
        onCreateEvent={createEvent}
      />

      {isConnected ? (
        <div className="space-y-4">
          {/* Próximos agendamentos - mais compacto */}
          <UpcomingAppointments 
            events={events} 
            isLoadingEvents={isLoadingEvents}
            onUpdateEvent={updateEvent}
            onDeleteEvent={deleteEvent}
          />

          {/* Calendário principal - destaque principal */}
          <div className="w-full">
            <CalendarView 
              events={events} 
              isLoading={isLoadingEvents}
              onUpdateEvent={updateEvent}
              onDeleteEvent={deleteEvent}
            />
          </div>
        </div>
      ) : (
        <EmptyConnectionState calendarId={calendarId} />
      )}
    </div>
  );
};

export default Agendamentos;
