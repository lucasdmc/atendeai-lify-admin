
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  sending: boolean;
}

const MessageInput = ({ onSendMessage, sending }: MessageInputProps) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    await onSendMessage(newMessage.trim());
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t p-4">
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem..."
          disabled={sending}
          className="flex-1"
        />
        <Button 
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
        >
          {sending ? (
            <MessageCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
