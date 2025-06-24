
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MessageSquare, AlertTriangle, User } from 'lucide-react';
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
  const timeAgo = formatDistanceToNow(new Date(conversation.updated_at), {
    addSuffix: true,
    locale: ptBR
  });

  const hasLoop = (conversation.loop_counter || 0) > 0;
  const isEscalated = conversation.escalated_to_human;

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
        isEscalated 
          ? 'border-l-red-500 bg-red-50' 
          : hasLoop 
            ? 'border-l-orange-500 bg-orange-50' 
            : 'border-l-transparent hover:border-l-blue-500'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <ConversationAvatar 
            name={displayName}
            countryCode={conversation.phone_number}
            unreadCount={conversation.unread_count || 0}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-gray-900 truncate">
                {displayName}
              </h3>
              
              <div className="flex items-center gap-2">
                {isEscalated && (
                  <Badge variant="destructive" className="text-xs">
                    <User className="h-3 w-3 mr-1" />
                    Escalado
                  </Badge>
                )}
                {hasLoop && !isEscalated && (
                  <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Loop {conversation.loop_counter}
                  </Badge>
                )}
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              {conversation.formatted_phone_number || conversation.phone_number}
            </p>
            
            {conversation.last_message_preview && (
              <p className="text-sm text-gray-800 line-clamp-2 mb-2">
                {conversation.last_message_preview}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {conversation.message_count || 0} mensagens
                </span>
                
                {(conversation.consecutive_same_responses || 0) > 0 && (
                  <span className="text-orange-600">
                    {conversation.consecutive_same_responses} respostas repetidas
                  </span>
                )}
              </div>
              
              {(conversation.unread_count || 0) > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {conversation.unread_count} não lidas
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
