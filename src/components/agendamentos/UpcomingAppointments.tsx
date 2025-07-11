import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, Edit, Tag, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { GoogleCalendarEvent } from '@/types/calendar';
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
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Calendar className="h-5 w-5 text-orange-500" />
              Próximos Agendamentos
              {isLoadingEvents && <Loader2 className="h-4 w-4 animate-spin" />}
              {!isLoadingEvents && events.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {events.length}
                </Badge>
              )}
            </CardTitle>
            {hasMoreEvents && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
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
        <CardContent>
          {nextEvents.length === 0 && !isLoadingEvents ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm font-medium">Nenhum evento próximo</p>
              <p className="text-xs mt-1">Os próximos agendamentos aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Próximos 3 eventos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {nextEvents.map((event) => {
                  const eventLabel = getEventLabel(event);
                  const labelConfig = getLabelConfig(eventLabel);
                  
                  return (
                    <div 
                      key={event.id} 
                      className="bg-gradient-to-br from-orange-50 to-pink-50 border border-orange-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:bg-gradient-to-br hover:from-orange-100 hover:to-pink-100 group cursor-pointer"
                      onClick={() => handleEditEvent(event)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-2">
                            {event.summary}
                          </h4>
                          <Badge variant="outline" className={`text-xs ${labelConfig.color}`}>
                            <Tag className="h-3 w-3 mr-1" />
                            {labelConfig.name}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEvent(event);
                          }}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Informações de data e hora */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">
                            {format(new Date(event.start.dateTime), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">
                            {format(new Date(event.start.dateTime), 'HH:mm', { locale: ptBR })} - {format(new Date(event.end.dateTime), 'HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                      </div>

                      {/* Localização se disponível */}
                      {event.location && (
                        <div className="mt-3 pt-3 border-t border-orange-200/50">
                          <p className="text-xs text-gray-600 truncate">
                            📍 {event.location}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Eventos expandidos */}
              {isExpanded && hasMoreEvents && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Mais eventos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {events.slice(3, 9).map((event) => {
                      const eventLabel = getEventLabel(event);
                      const labelConfig = getLabelConfig(eventLabel);
                      
                      return (
                        <div 
                          key={event.id} 
                          className="bg-white border border-gray-200 rounded-md p-3 hover:shadow-sm transition-all cursor-pointer group"
                          onClick={() => handleEditEvent(event)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 text-sm truncate mb-1">
                                {event.summary}
                              </h5>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                <span>{format(new Date(event.start.dateTime), 'dd/MM • HH:mm', { locale: ptBR })}</span>
                              </div>
                              <Badge variant="outline" className={`text-xs ${labelConfig.color}`}>
                                {labelConfig.name}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvent(event);
                              }}
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {events.length > 9 && (
                    <div className="text-center mt-3">
                      <p className="text-xs text-gray-500">
                        +{events.length - 9} eventos adicionais
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
