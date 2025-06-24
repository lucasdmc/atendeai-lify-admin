
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ConversationAvatar from './ConversationAvatar';

interface ConversationCardProps {
  conversation: {
    id: string;
    phone_number: string;
    formatted_phone_number: string | null;
    name: string | null;
    updated_at: string;
    last_message_preview: string | null;
    unread_count: number | null;
    message_count?: number;
    escalated_to_human?: boolean;
    loop_counter?: number;
    consecutive_same_responses?: number;
  };
  searchTerm: string;
  onClick: () => void;
  getDisplayName: (conversation: any) => string;
}

export default function ConversationCard({
  conversation,
  searchTerm,
  onClick,
  getDisplayName
}: ConversationCardProps) {
  const displayName = getDisplayName(conversation);
  
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? 
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : 
        part
    );
  };

  const getLoopStatus = () => {
    if (conversation.escalated_to_human) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Escalada
        </Badge>
      );
    }
    
    if ((conversation.loop_counter || 0) > 0) {
      return (
        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {conversation.loop_counter} loops
        </Badge>
      );
    }
    
    return null;
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:border-orange-300 ${
        conversation.escalated_to_human ? 'border-red-200 bg-red-50' : 
        (conversation.loop_counter || 0) > 0 ? 'border-orange-200 bg-orange-50' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <ConversationAvatar name={displayName} />
          
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 truncate">
                {highlightText(displayName, searchTerm)}
              </h3>
              <div className="flex items-center gap-2">
                {getLoopStatus()}
                {(conversation.unread_count || 0) > 0 && (
                  <Badge variant="default" className="bg-orange-500">
                    {conversation.unread_count}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span className="truncate">
                {highlightText(
                  conversation.formatted_phone_number || conversation.phone_number, 
                  searchTerm
                )}
              </span>
              <div className="flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(conversation.updated_at), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </div>
            </div>
            
            {conversation.last_message_preview && (
              <p className="text-sm text-gray-600 truncate">
                {highlightText(conversation.last_message_preview, searchTerm)}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span>{conversation.message_count || 0} mensagens</span>
              </div>
              
              {(conversation.consecutive_same_responses || 0) > 1 && (
                <span className="text-orange-600">
                  {conversation.consecutive_same_responses} respostas repetidas
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
