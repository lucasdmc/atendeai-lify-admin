import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, Edit, Clock, ChevronDown, ChevronUp, MapPin, User, MoreHorizontal } from 'lucide-react';
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

  const getTimeUntilEvent = (eventDate: string) => {
    const now = new Date();
    const event = new Date(eventDate);
    const diffInHours = Math.floor((event.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 0) return 'Agora';
    if (diffInHours < 1) return 'Em breve';
    if (diffInHours < 24) return `Em ${diffInHours}h`;
    return `Em ${Math.floor(diffInHours / 24)}d`;
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-background via-muted/20 to-background border-border shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5"></div>
        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 lify-gradient-primary rounded-xl shadow-lg">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  Próximos Agendamentos
                  {isLoadingEvents && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {events.length > 0 ? `${events.length} eventos agendados` : 'Nenhum evento próximo'}
                </p>
              </div>
            </div>
            {hasMoreEvents && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all"
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
        <CardContent className="pt-0 relative z-10">
          {nextEvents.length === 0 && !isLoadingEvents ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum evento próximo</h3>
              <p className="text-sm text-muted-foreground">Seus próximos agendamentos aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Eventos principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nextEvents.map((event, index) => {
                  const eventLabel = getEventLabel(event);
                  const labelConfig = getLabelConfig(eventLabel);
                  const timeUntil = getTimeUntilEvent(event.start.dateTime);
                  const isToday = format(new Date(event.start.dateTime), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  
                  return (
                    <div 
                      key={event.id} 
                      className={`
                        group relative overflow-hidden rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
                        ${isToday ? 'ring-2 ring-blue-500/20 bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-white'}
                      `}
                      style={{
                        background: isToday 
                          ? 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)'
                          : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
                      }}
                    >
                      {/* Indicador de urgência para eventos de hoje */}
                      {isToday && (
                        <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-blue-500"></div>
                      )}
                      
                      {/* Header do evento */}
                      <div className="p-4 pb-3">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm leading-tight mb-2 line-clamp-2">
                              {event.summary}
                            </h4>
                                                         <div className="flex items-center gap-2 mb-2">
                               <Badge 
                                 className={`text-xs px-2 py-1 font-medium border-0 ${labelConfig.color} shadow-sm`}
                               >
                                 {labelConfig.name}
                               </Badge>
                              {isToday && (
                                <Badge variant="destructive" className="text-xs px-2 py-1 bg-red-500 text-white">
                                  Hoje
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEvent(event)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100 rounded-full flex-shrink-0 ml-2"
                          >
                            <Edit className="h-3 w-3 text-gray-600" />
                          </Button>
                        </div>

                        {/* Informações de data e hora */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="p-1 bg-blue-100 rounded-full">
                              <Calendar className="h-3 w-3 text-blue-600" />
                            </div>
                            <span className="font-medium">
                              {format(new Date(event.start.dateTime), 'EEEE, dd/MM', { locale: ptBR })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="p-1 bg-green-100 rounded-full">
                              <Clock className="h-3 w-3 text-green-600" />
                            </div>
                            <span className="font-medium">
                              {format(new Date(event.start.dateTime), 'HH:mm', { locale: ptBR })} - {format(new Date(event.end.dateTime), 'HH:mm', { locale: ptBR })}
                            </span>
                          </div>

                          {/* Localização */}
                          {event.location && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <div className="p-1 bg-purple-100 rounded-full">
                                <MapPin className="h-3 w-3 text-purple-600" />
                              </div>
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}

                          {/* Participantes */}
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <div className="p-1 bg-orange-100 rounded-full">
                                <User className="h-3 w-3 text-orange-600" />
                              </div>
                              <span className="truncate">
                                {event.attendees[0].email}
                                {event.attendees.length > 1 && ` +${event.attendees.length - 1}`}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Indicador de tempo */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">
                              {timeUntil}
                            </span>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-green-600 font-medium">Confirmado</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Eventos expandidos */}
              {isExpanded && hasMoreEvents && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <MoreHorizontal className="h-4 w-4" />
                    Mais eventos
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {events.slice(3, 8).map((event) => {
                      const eventLabel = getEventLabel(event);
                      const labelConfig = getLabelConfig(eventLabel);
                      
                      return (
                        <div 
                          key={event.id} 
                          className="group bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg p-3 hover:bg-white hover:shadow-md transition-all duration-200 hover:border-gray-300"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 text-xs leading-tight truncate mb-1">
                                {event.summary}
                              </h5>
                                                             <Badge 
                                 className={`text-[10px] px-1.5 py-0.5 font-medium border-0 ${labelConfig.color}`}
                               >
                                 {labelConfig.name}
                               </Badge>
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
                  {events.length > 8 && (
                    <div className="text-center mt-4">
                      <p className="text-xs text-gray-500 bg-gray-50 rounded-full px-3 py-1 inline-block">
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
