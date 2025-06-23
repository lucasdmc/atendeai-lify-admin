
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import NewAppointmentModal from './NewAppointmentModal';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';

interface AgendamentosHeaderProps {
  onRefetch: () => void;
  isConnected: boolean;
  onCreateEvent: (eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => Promise<GoogleCalendarEvent>;
}

const AgendamentosHeader = ({ onRefetch, isConnected, onCreateEvent }: AgendamentosHeaderProps) => {
  const [showNewModal, setShowNewModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agendamentos</h1>
          <p className="text-gray-600 mt-2">Gerencie seus agendamentos integrados ao Google Calendar</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={onRefetch}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Atualizar
          </Button>
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
