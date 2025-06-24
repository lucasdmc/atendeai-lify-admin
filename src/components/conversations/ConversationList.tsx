
import ConversationCard from './ConversationCard';
import EmptyState from './EmptyState';

interface ConversationListProps {
  conversations: Array<{
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
  }>;
  searchTerm: string;
  onOpenConversation: (conversationId: string) => void;
  getDisplayName: (conversation: any) => string;
}

export default function ConversationList({
  conversations,
  searchTerm,
  onOpenConversation,
  getDisplayName
}: ConversationListProps) {
  if (conversations.length === 0) {
    return <EmptyState searchTerm={searchTerm} />;
  }

  return (
    <div className="space-y-3">
      {conversations.map((conversation) => (
        <ConversationCard
          key={conversation.id}
          conversation={conversation}
          searchTerm={searchTerm}
          onClick={() => onOpenConversation(conversation.id)}
          getDisplayName={getDisplayName}
        />
      ))}
    </div>
  );
}
