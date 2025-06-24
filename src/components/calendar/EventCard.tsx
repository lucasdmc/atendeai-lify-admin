
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

  // Card pequeno para visualização mensal
  if (size === 'sm') {
    return (
      <div
        className={`p-1.5 rounded-md cursor-pointer transition-all hover:shadow-lg group border border-l-4 ${labelConfig.color} bg-white/95 backdrop-blur-sm overflow-hidden min-h-[60px]`}
        onClick={() => onEdit(event)}
      >
        <div className="flex flex-col gap-1">
          {/* Horário em destaque */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900 truncate">
              {formatEventTime(event.start.dateTime)}
            </span>
            <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-gray-600" />
          </div>
          
          {/* Título do evento */}
          <div className="min-h-[16px]">
            <p className="font-medium text-xs text-gray-800 leading-tight line-clamp-2 break-words">
              {event.summary}
            </p>
          </div>
          
          {/* Label com ícone */}
          <div className="flex items-center gap-1 mt-auto">
            <Tag className="h-2.5 w-2.5 flex-shrink-0 text-gray-500" />
            <span className="text-[10px] text-gray-600 truncate">{labelConfig.name}</span>
          </div>
        </div>
      </div>
    );
  }

  // Card médio para visualização semanal e diária
  return (
    <div className={`p-3 border rounded-lg bg-white hover:shadow-lg transition-all group cursor-pointer overflow-hidden border-l-4 ${labelConfig.color}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Header com título e badges */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">{event.summary}</h4>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <Badge variant="outline" className={`${labelConfig.color} text-xs px-2 py-0.5`}>
                <Tag className="h-3 w-3 mr-1" />
                {labelConfig.name}
              </Badge>
              <Badge variant="outline" className={`${getStatusColor(event.status)} text-xs px-2 py-0.5`}>
                {event.status}
              </Badge>
            </div>
          </div>
          
          {/* Informações principais */}
          <div className="space-y-1.5 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 flex-shrink-0 text-orange-500" />
              <span className="font-medium">
                {showDate && format(new Date(event.start.dateTime), 'dd/MM/yyyy • ', { locale: ptBR })}
                {formatEventTime(event.start.dateTime)} - {formatEventTime(event.end.dateTime)}
              </span>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0 text-gray-500" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            
            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 flex-shrink-0 text-gray-500" />
                <span>{event.attendees.length} participante(s)</span>
              </div>
            )}
          </div>
          
          {/* Descrição */}
          {event.description && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 line-clamp-2 break-words leading-relaxed">
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
