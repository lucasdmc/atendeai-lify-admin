
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, Edit, Tag, Clock, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);

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

  const nextEvents = events.slice(0, 3);
  const hasMoreEvents = events.length > 3;

  return (
    <>
      <Card className="bg-gradient-to-r from-orange-50 to-pink-50 border-orange-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="h-4 w-4 text-orange-500" />
              Próximos Agendamentos
              {isLoadingEvents && <Loader2 className="h-3 w-3 animate-spin" />}
              {!isLoadingEvents && events.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {events.length}
                </Badge>
              )}
            </CardTitle>
            {hasMoreEvents && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {nextEvents.length === 0 && !isLoadingEvents ? (
            <div className="text-center py-4 text-gray-400">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-gray-300" />
              <p className="text-xs">Nenhum evento próximo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Sempre mostrar os próximos 3 eventos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {nextEvents.map((event) => {
                  const eventLabel = getEventLabel(event);
                  const labelConfig = getLabelConfig(eventLabel);
                  
                  return (
                    <div key={event.id} className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-lg p-3 hover:shadow-md transition-all duration-200 hover:bg-white group">
                      {/* Header compacto */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-xs truncate mb-1">
                            {event.summary}
                          </h4>
                          <Badge variant="outline" className={`text-[10px] px-1 py-0 ${labelConfig.color}`}>
                            {labelConfig.name}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEvent(event)}
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Informações de data e hora compactas */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[10px] text-gray-600">
                          <Calendar className="h-2.5 w-2.5 text-gray-400" />
                          <span className="font-medium">
                            {format(new Date(event.start.dateTime), 'dd/MM', { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-600">
                          <Clock className="h-2.5 w-2.5 text-gray-400" />
                          <span className="font-medium">
                            {format(new Date(event.start.dateTime), 'HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Eventos expandidos */}
              {isExpanded && hasMoreEvents && (
                <div className="mt-3 pt-3 border-t border-orange-200/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {events.slice(3, 8).map((event) => {
                      const eventLabel = getEventLabel(event);
                      const labelConfig = getLabelConfig(eventLabel);
                      
                      return (
                        <div key={event.id} className="bg-white/60 backdrop-blur-sm border border-white/30 rounded-md p-2 hover:bg-white/80 transition-all group">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-[10px] truncate mb-1">
                                {event.summary}
                              </p>
                              <div className="flex items-center gap-2 text-[9px] text-gray-500">
                                <span>{format(new Date(event.start.dateTime), 'dd/MM • HH:mm', { locale: ptBR })}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEvent(event)}
                              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {events.length > 8 && (
                    <div className="text-center mt-2">
                      <p className="text-[10px] text-gray-500">
                        +{events.length - 8} eventos adicionais
                      </p>
                    </div>
                  )}
                </div>
              )}
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
