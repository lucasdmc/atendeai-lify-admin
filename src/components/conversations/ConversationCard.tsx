
import React from 'react';
import { Badge } from '@/components/ui/badge';
import ConversationAvatar from './ConversationAvatar';
import ConversationStats from './ConversationStats';

interface Conversation {
  id: string;
  phone_number: string;
  formatted_phone_number: string | null;
  country_code: string | null;
  name: string | null;
  updated_at: string;
  last_message_preview: string | null;
  unread_count: number | null;
  message_count?: number;
}

interface ConversationCardProps {
  conversation: Conversation;
  onOpenConversation: (conversationId: string) => void;
  getDisplayName: (conversation: Conversation) => string;
}

const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  onOpenConversation,
  getDisplayName
}) => {
  const getStatusColor = (messageCount: number) => {
    if (messageCount > 10) return 'bg-green-100 text-green-800';
    if (messageCount > 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div
      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border"
      onClick={() => onOpenConversation(conversation.id)}
    >
      <div className="flex items-center gap-4">
        <ConversationAvatar
          name={conversation.name}
          countryCode={conversation.country_code}
          unreadCount={conversation.unread_count}
        />
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">
              {getDisplayName(conversation)}
            </h3>
            <Badge variant="outline" className={getStatusColor(conversation.message_count || 0)}>
              {conversation.message_count} mensagens
            </Badge>
          </div>
          <p className="text-sm text-gray-600 font-mono">
            {conversation.formatted_phone_number || conversation.phone_number}
          </p>
          {conversation.last_message_preview && (
            <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
              {conversation.last_message_preview}
            </p>
          )}
        </div>
      </div>
      
      <ConversationStats
        messageCount={conversation.message_count || 0}
        updatedAt={conversation.updated_at}
        onOpenConversation={() => onOpenConversation(conversation.id)}
      />
    </div>
  );
};

export default ConversationCard;
