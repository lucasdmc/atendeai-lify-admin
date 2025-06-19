
import React from 'react';
import { Clock, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { downloadConversation } from '@/utils/downloadUtils';

interface ConversationStatsProps {
  messageCount: number;
  updatedAt: string;
  onOpenConversation: () => void;
  conversationId: string;
  conversationName: string;
}

const ConversationStats: React.FC<ConversationStatsProps> = ({
  messageCount,
  updatedAt,
  onOpenConversation,
  conversationId,
  conversationName
}) => {
  const { toast } = useToast();

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

  const handleDownloadConversation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    toast({
      title: "Preparando download...",
      description: "Gerando arquivo da conversa.",
    });

    const success = await downloadConversation(conversationId, conversationName, supabase);
    
    if (success) {
      toast({
        title: "Download concluído",
        description: "A conversa foi baixada com sucesso.",
      });
    } else {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a conversa. Tente novamente.",
        variant: "destructive",
      });
    }
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
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleDownloadConversation}
          className="flex items-center gap-1"
        >
          <Download className="h-3 w-3" />
          Baixar
        </Button>
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
    </div>
  );
};

export default ConversationStats;
