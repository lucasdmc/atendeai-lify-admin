
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Users, Edit, Tag } from 'lucide-react';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getLabelConfig, getLabelFromString, AppointmentLabel } from '@/utils/appointmentLabels';

interface EventCardProps {
  event: GoogleCalendarEvent;
  onEdit: (event: GoogleCalendarEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  showDate?: boolean;
}

const EventCard = ({ event, onEdit, size = 'md', showDate = false }: EventCardProps) => {
  const formatEventTime = (dateTimeString: string) => {
    return format(new Date(dateTimeString), 'HH:mm', { locale: ptBR });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'tentative': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Extrair label da descrição do evento
  const getEventLabel = (): AppointmentLabel => {
    if (event.description) {
      const labelMatch = event.description.match(/\[LABEL:(\w+)\]/);
      if (labelMatch) {
        return getLabelFromString(labelMatch[1]);
      }
    }
    return 'consulta'; // Default
  };

  const eventLabel = getEventLabel();
  const labelConfig = getLabelConfig(eventLabel);

  if (size === 'sm') {
    return (
      <div
        className={`p-2 rounded-lg cursor-pointer transition-all hover:shadow-md group border ${labelConfig.color}`}
        onClick={() => onEdit(event)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <Tag className="h-3 w-3" />
              <span className="text-xs font-medium">{labelConfig.name}</span>
            </div>
            <p className="font-medium text-xs truncate">{event.summary}</p>
            <p className="text-xs opacity-75">
              {formatEventTime(event.start.dateTime)} - {formatEventTime(event.end.dateTime)}
            </p>
          </div>
          <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg bg-white hover:shadow-md transition-all group cursor-pointer`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900">{event.summary}</h4>
            <Badge variant="outline" className={labelConfig.color}>
              <Tag className="h-3 w-3 mr-1" />
              {labelConfig.name}
            </Badge>
            <Badge variant="outline" className={getStatusColor(event.status)}>
              {event.status}
            </Badge>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {showDate && format(new Date(event.start.dateTime), 'dd/MM/yyyy • ', { locale: ptBR })}
                {formatEventTime(event.start.dateTime)} - {formatEventTime(event.end.dateTime)}
              </span>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            
            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{event.attendees.length} participante(s)</span>
              </div>
            )}
          </div>
          
          {event.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {event.description.replace(/\[LABEL:\w+\]/, '').trim()}
            </p>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(event);
          }}
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default EventCard;
