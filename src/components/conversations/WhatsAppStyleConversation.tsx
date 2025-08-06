import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getAvatarUrl, generateColorsFromName } from '@/utils/avatarUtils';
import { formatPhoneNumber } from '@/utils/conversationUtils';

interface WhatsAppStyleConversationProps {
  conversation: {
    id: string;
    phone_number: string;
    formatted_phone_number: string | null;
    country_code: string | null;
    name: string | null;
    updated_at: string | null;
    last_message_preview: string | null;
    unread_count: number | null;
    message_count?: number;
    last_message_type?: string;
  };
  isSelected: boolean;
  onClick: () => void;
  getDisplayName: (conversation: any) => string;
}

const WhatsAppStyleConversation: React.FC<WhatsAppStyleConversationProps> = ({
  conversation,
  isSelected,
  onClick,
  getDisplayName
}) => {
  const displayName = getDisplayName(conversation);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [avatarError, setAvatarError] = useState(false);
  const colors = generateColorsFromName(displayName);

  useEffect(() => {
    const generateAvatar = async () => {
      try {
        const url = getAvatarUrl({
          name: displayName,
          phone: conversation.phone_number,
          size: 200
        });
        setAvatarUrl(url);
      } catch (error) {
        console.error('Erro ao gerar avatar:', error);
        setAvatarError(true);
      }
    };

    generateAvatar();
  }, [displayName, conversation.phone_number]);
  
  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const hasUnreadMessages = conversation.unread_count && conversation.unread_count > 0;

  return (
    <div
      className={cn(
        "flex items-center p-3 cursor-pointer transition-all duration-200 hover:bg-gray-50 border-b border-gray-100 last:border-b-0",
        isSelected && "bg-blue-50 border-r-2 border-blue-500",
        hasUnreadMessages && !isSelected && "bg-gray-50"
      )}
      onClick={onClick}
    >
      {/* Avatar com indicador de status */}
      <div className="relative mr-3 flex-shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage 
            src={avatarUrl} 
            onError={() => setAvatarError(true)}
          />
          <AvatarFallback 
            className="font-semibold"
            style={{
              backgroundColor: colors.backgroundColor,
              color: colors.textColor
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Indicador de mensagens não lidas */}
        {hasUnreadMessages && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-green-500 text-white border-2 border-white font-medium">
            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
          </Badge>
        )}
        
        {/* Indicador de status online (simulado) */}
        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
      </div>

      {/* Informações da conversa */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className={cn(
            "font-semibold truncate",
            hasUnreadMessages ? "text-gray-900" : "text-gray-700"
          )}>
            {displayName}
          </h3>
          <span className={cn(
            "text-xs flex-shrink-0 ml-2",
            hasUnreadMessages ? "text-gray-500" : "text-gray-400"
          )}>
            {formatTime(conversation.updated_at)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {conversation.last_message_type === 'sent' && (
              <span className="text-xs text-gray-400 flex-shrink-0">✓</span>
            )}
            <p className={cn(
              "text-sm truncate",
              hasUnreadMessages ? "text-gray-900 font-medium" : "text-gray-600"
            )}>
              {conversation.last_message_preview || formatPhoneNumber(conversation)}
            </p>
          </div>
          
          {/* Indicadores de status */}
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {hasUnreadMessages && (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppStyleConversation; 