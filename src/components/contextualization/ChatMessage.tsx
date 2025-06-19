
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export const ChatMessage = ({ content, isUser, timestamp }: ChatMessageProps) => {
  return (
    <div
      className={`flex items-start gap-3 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      <div className={`p-2 rounded-full flex-shrink-0 ${
        isUser 
          ? 'bg-gradient-to-r from-orange-400 to-pink-500' 
          : 'bg-gray-100'
      }`}>
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-gray-600" />
        )}
      </div>
      <div className={`max-w-[80%] ${
        isUser ? 'text-right' : 'text-left'
      }`}>
        <div className={`p-3 rounded-lg ${
          isUser
            ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white'
            : 'bg-gray-100 text-gray-800'
        }`}>
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};
