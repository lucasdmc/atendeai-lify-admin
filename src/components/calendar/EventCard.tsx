
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
        className={`p-2 rounded-lg cursor-pointer transition-all hover:shadow-md group border ${labelConfig.color} overflow-hidden`}
        onClick={() => onEdit(event)}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1 mb-1">
              <Tag className="h-3 w-3 flex-shrink-0" />
              <span className="text-xs font-medium truncate">{labelConfig.name}</span>
            </div>
            <p className="font-medium text-xs truncate mb-1">{event.summary}</p>
            <p className="text-xs opacity-75 truncate">
              {formatEventTime(event.start.dateTime)} - {formatEventTime(event.end.dateTime)}
            </p>
            {event.description && (
              <p className="text-xs opacity-60 mt-1 line-clamp-1 leading-tight">
                {event.description.replace(/\[LABEL:\w+\]/, '').trim()}
              </p>
            )}
          </div>
          <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg bg-white hover:shadow-md transition-all group cursor-pointer overflow-hidden`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h4 className="font-semibold text-gray-900 truncate flex-shrink-0">{event.summary}</h4>
            <Badge variant="outline" className={`${labelConfig.color} flex-shrink-0`}>
              <Tag className="h-3 w-3 mr-1" />
              {labelConfig.name}
            </Badge>
            <Badge variant="outline" className={`${getStatusColor(event.status)} flex-shrink-0`}>
              {event.status}
            </Badge>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {showDate && format(new Date(event.start.dateTime), 'dd/MM/yyyy • ', { locale: ptBR })}
                {formatEventTime(event.start.dateTime)} - {formatEventTime(event.end.dateTime)}
              </span>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            
            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{event.attendees.length} participante(s)</span>
              </div>
            )}
          </div>
          
          {event.description && (
            <div className="mt-2 overflow-hidden">
              <p className="text-sm text-gray-600 line-clamp-2 break-words">
                {event.description.replace(/\[LABEL:\w+\]/, '').trim()}
              </p>
            </div>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(event);
          }}
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default EventCard;
