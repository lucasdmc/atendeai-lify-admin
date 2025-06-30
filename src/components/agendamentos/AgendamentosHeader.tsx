import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Calendar, Users } from 'lucide-react';
import NewAppointmentModal from './NewAppointmentModal';
import { GoogleCalendarEvent } from '@/types/calendar';

interface AgendamentosHeaderProps {
  isConnected: boolean;
  onCreateEvent: (eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => Promise<GoogleCalendarEvent>;
  eventsCount?: number;
  calendarsCount?: number;
}

const AgendamentosHeader = ({ 
  isConnected, 
  onCreateEvent, 
  eventsCount = 0,
  calendarsCount = 0
}: AgendamentosHeaderProps) => {
  const [showNewModal, setShowNewModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agendamentos</h1>
          <p className="text-gray-600 mt-2">Gerencie seus agendamentos integrados ao Google Calendar</p>
          
          {/* Estatísticas */}
          {isConnected && (
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{eventsCount} evento{eventsCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{calendarsCount} calendário{calendarsCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            onClick={() => setShowNewModal(true)}
            disabled={!isConnected}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      <NewAppointmentModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreateEvent={onCreateEvent}
      />
    </>
  );
};

export default AgendamentosHeader;
