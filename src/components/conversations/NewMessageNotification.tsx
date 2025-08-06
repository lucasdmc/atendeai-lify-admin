import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConversation } from '@/contexts/ConversationContext';

interface NewMessageNotificationProps {
  conversationId: string;
  message: string;
  senderName: string;
  onDismiss: () => void;
}

const NewMessageNotification: React.FC<NewMessageNotificationProps> = ({
  conversationId,
  message,
  senderName,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const { setSelectedConversation, markConversationAsRead } = useConversation();

  useEffect(() => {
    // Auto-dismiss após 5 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Aguardar animação terminar
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleOpenConversation = async () => {
    // Marcar como lida
    await markConversationAsRead(conversationId);
    
    // Fechar notificação
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-right duration-300">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Bell className="h-5 w-5 text-green-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              Nova mensagem de {senderName}
            </h4>
            <p className="text-sm text-gray-600 truncate mb-3">
              {message}
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleOpenConversation}
                className="text-xs"
              >
                Abrir conversa
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-xs"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewMessageNotification; 