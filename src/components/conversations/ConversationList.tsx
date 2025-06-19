
import React from 'react';
import ConversationCard from './ConversationCard';
import EmptyState from './EmptyState';

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

interface ConversationListProps {
  conversations: Conversation[];
  searchTerm: string;
  onOpenConversation: (conversationId: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  searchTerm,
  onOpenConversation
}) => {
  if (conversations.length === 0) {
    return <EmptyState searchTerm={searchTerm} />;
  }

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => (
        <ConversationCard
          key={conversation.id}
          conversation={conversation}
          onOpenConversation={onOpenConversation}
        />
      ))}
    </div>
  );
};

export default ConversationList;
