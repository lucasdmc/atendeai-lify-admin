
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
    <div className="space-y-6">
      <AgendamentosHeader 
        onRefetch={refetch} 
        isConnected={isConnected}
        onCreateEvent={createEvent}
      />

      {isConnected ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendário principal - ocupa mais espaço */}
          <div className="lg:col-span-8">
            <CalendarView 
              events={events} 
              isLoading={isLoadingEvents}
              onUpdateEvent={updateEvent}
              onDeleteEvent={deleteEvent}
            />
          </div>

          {/* Sidebar com estatísticas e próximos agendamentos */}
          <div className="lg:col-span-4 space-y-6">
            <div className="scale-90 origin-top">
              <AgendamentosStats events={events} />
            </div>

            <div className="scale-90 origin-top">
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
