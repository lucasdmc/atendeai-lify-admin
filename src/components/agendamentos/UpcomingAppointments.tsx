
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
      <Card className="bg-white/95 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Calendar className="h-5 w-5 text-lify-orange" />
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
                <div key={event.id} className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm border border-gray-100 rounded-lg hover:shadow-md hover:bg-white/80 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-lify-pink/10 to-lify-purple/10 border border-lify-pink/20">
                      <Tag className="h-6 w-6 text-lify-pink" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-800">{event.summary}</p>
                        <Badge variant="outline" className="border-lify-pink/30 text-lify-pink bg-lify-pink/5">
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
                      <Badge variant="outline" className="mb-2 border-gray-300">
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
                      className="h-8 w-8 p-0 border-lify-pink/30 hover:bg-lify-pink/10"
                    >
                      <Edit className="h-4 w-4 text-lify-pink" />
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
