
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, Edit, Tag, Clock } from 'lucide-react';
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
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-orange-500" />
            Próximos Agendamentos
            {isLoadingEvents && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[600px] overflow-y-auto px-4">
          {events.slice(0, 5).map((event) => {
            const eventLabel = getEventLabel(event);
            const labelConfig = getLabelConfig(eventLabel);
            
            return (
              <div key={event.id} className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:border-gray-200">
                {/* Header com título e badges */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm truncate mb-2">
                      {event.summary}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={`text-xs ${labelConfig.color}`}>
                        <Tag className="h-3 w-3 mr-1" />
                        {labelConfig.name}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditEvent(event)}
                    className="h-8 w-8 p-0 flex-shrink-0 ml-2"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>

                {/* Informações de data e hora */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="font-medium">
                      {format(new Date(event.start.dateTime), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="font-medium">
                      {format(new Date(event.start.dateTime), 'HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                </div>

                {/* Descrição */}
                {event.description && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {event.description.replace(/\[LABEL:\w+\]/, '').trim()}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
          
          {events.length === 0 && !isLoadingEvents && (
            <div className="text-center py-12 text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-sm font-medium">Nenhum evento encontrado</p>
              <p className="text-xs mt-1">Crie seu primeiro agendamento</p>
            </div>
          )}
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
