
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useConversationData } from '@/hooks/useConversationData';
import { getDisplayName, formatMessageTime } from '@/utils/conversationUtils';
import ConversationHeader from '@/components/conversation/ConversationHeader';
import MessagesArea from '@/components/conversation/MessagesArea';
import MessageInput from '@/components/conversation/MessageInput';

const ConversaIndividual = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  
  console.log('ConversaIndividual - Conversation ID:', conversationId);
  
  const {
    conversation,
    messages,
    loading,
    sending,
    sendMessage
  } = useConversationData(conversationId);

  console.log('ConversaIndividual - State:', { conversation, messages, loading });

  const handleBack = () => navigate('/conversas');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageCircle className="h-8 w-8 animate-spin mx-auto mb-2 text-orange-500" />
          <p>Carregando conversa...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold mb-2">Conversa não encontrada</h2>
        <Button onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para conversas
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ConversationHeader
        conversation={conversation}
        onBack={handleBack}
        getDisplayName={getDisplayName}
      />

      <div className="flex-1 flex flex-col">
        <MessagesArea
          messages={messages}
          loading={false}
          formatMessageTime={formatMessageTime}
        />
        
        <MessageInput
          onSendMessage={sendMessage}
          sending={sending}
        />
      </div>
    </div>
  );
};

export default ConversaIndividual;
