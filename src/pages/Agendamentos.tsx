
import { useGoogleServiceAccount } from '@/hooks/useGoogleServiceAccount';
import CalendarView from '@/components/calendar/CalendarView';
import AgendamentosHeader from '@/components/agendamentos/AgendamentosHeader';
import ConnectionStatusCard from '@/components/agendamentos/ConnectionStatusCard';
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
    <div className="space-y-6">
      <AgendamentosHeader 
        onRefetch={refetch} 
        isConnected={isConnected}
        onCreateEvent={createEvent}
      />

      <ConnectionStatusCard 
        isConnected={isConnected} 
        calendarId={calendarId} 
      />

      {isConnected ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AgendamentosStats events={events} />

          <UpcomingAppointments 
            events={events} 
            isLoadingEvents={isLoadingEvents}
            onUpdateEvent={updateEvent}
            onDeleteEvent={deleteEvent}
          />

          <div className="lg:col-span-3">
            <CalendarView 
              events={events} 
              isLoading={isLoadingEvents}
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
