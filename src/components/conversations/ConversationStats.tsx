
import React from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ConversationStatsProps {
  messageCount: number;
  updatedAt: string;
  onOpenConversation: () => void;
  conversationId: string;
  conversationName: string;
}

const ConversationStats: React.FC<ConversationStatsProps> = ({
  updatedAt,
  onOpenConversation
}) => {
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora há pouco';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

  return (
    <div className="text-right flex flex-col items-end gap-2">
      <div className="flex items-center gap-1 text-sm text-gray-500">
        <Clock className="h-3 w-3" />
        {getTimeAgo(updatedAt)}
      </div>
      <Badge variant="secondary">
        Ativa
      </Badge>
      <Button 
        size="sm" 
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          onOpenConversation();
        }}
      >
        Abrir Chat
      </Button>
    </div>
  );
};

export default ConversationStats;
