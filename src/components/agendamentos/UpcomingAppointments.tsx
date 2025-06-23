
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Loader2, Edit, Tag } from 'lucide-react';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getLabelConfig, getLabelFromString, AppointmentLabel } from '@/utils/appointmentLabels';
import EditAppointmentModal from './EditAppointmentModal';

interface UpcomingAppointmentsProps {
  events: GoogleCalendarEvent[];
  isLoadingEvents: boolean;
  onUpdateEvent: (eventId: string, eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
}

const UpcomingAppointments = ({ 
  events, 
  isLoadingEvents, 
  onUpdateEvent, 
  onDeleteEvent 
}: UpcomingAppointmentsProps) => {
  const [selectedEvent, setSelectedEvent] = useState<GoogleCalendarEvent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEditEvent = (event: GoogleCalendarEvent) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedEvent(null);
  };

  const getEventLabel = (event: GoogleCalendarEvent): AppointmentLabel => {
    if (event.description) {
      const labelMatch = event.description.match(/\[LABEL:(\w+)\]/);
      if (labelMatch) {
        return getLabelFromString(labelMatch[1]);
      }
    }
    return 'consulta'; // Default
  };

  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            Próximos Agendamentos
            {isLoadingEvents && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.slice(0, 5).map((event) => {
              const eventLabel = getEventLabel(event);
              const labelConfig = getLabelConfig(eventLabel);
              
              return (
                <div key={event.id} className={`flex items-center justify-between p-4 border-2 rounded-lg hover:shadow-md transition-all ${labelConfig.color}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${labelConfig.color.replace('bg-', 'border-').replace('text-', 'bg-').replace('-800', '-200').replace('-100', '-50')}`}>
                      <Tag className={`h-6 w-6 ${labelConfig.color.split(' ')[1]}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{event.summary}</p>
                        <Badge variant="outline" className={labelConfig.color}>
                          <Tag className="h-3 w-3 mr-1" />
                          {labelConfig.name}
                        </Badge>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600">
                          {event.description.replace(/\[LABEL:\w+\]/, '').trim()}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(event.start.dateTime), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-3">
                      <Badge variant="outline" className="mb-2">
                        {format(new Date(event.start.dateTime), 'dd/MM', { locale: ptBR })}
                      </Badge>
                      <p className="text-xs text-gray-500">
                        Status: {event.status}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditEvent(event)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {events.length === 0 && !isLoadingEvents && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum evento encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EditAppointmentModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        event={selectedEvent}
        onUpdateEvent={onUpdateEvent}
        onDeleteEvent={onDeleteEvent}
      />
    </>
  );
};

export default UpcomingAppointments;
