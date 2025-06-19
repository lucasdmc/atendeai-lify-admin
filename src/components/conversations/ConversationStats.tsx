
import React from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ConversationStatsProps {
  messageCount: number;
  updatedAt: string;
  onOpenConversation: () => void;
}

const ConversationStats: React.FC<ConversationStatsProps> = ({
  messageCount,
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

  const getStatusColor = (messageCount: number) => {
    if (messageCount > 10) return 'bg-green-100 text-green-800';
    if (messageCount > 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
