
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  questionsCompleted: boolean;
}

export const ChatInput = ({ 
  inputMessage, 
  setInputMessage, 
  onSendMessage, 
  isLoading, 
  questionsCompleted 
}: ChatInputProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="p-4 border-t flex-shrink-0">
      <div className="flex gap-2">
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={questionsCompleted ? "Contextualização concluída! 🎉" : "Digite sua resposta..."}
          disabled={isLoading || questionsCompleted}
          className="flex-1"
        />
        <Button 
          onClick={onSendMessage}
          disabled={isLoading || !inputMessage.trim() || questionsCompleted}
          className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {questionsCompleted && (
        <p className="text-xs text-green-600 mt-2 text-center">
          ✨ Seu chatbot está pronto para atender os pacientes!
        </p>
      )}
    </div>
  );
};
