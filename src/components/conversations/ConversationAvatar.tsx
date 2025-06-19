
import React from 'react';
import { User2, Phone } from 'lucide-react';
import CountryFlag from '@/components/CountryFlag';

interface ConversationAvatarProps {
  name: string | null;
  countryCode: string | null;
  unreadCount: number | null;
}

const ConversationAvatar: React.FC<ConversationAvatarProps> = ({
  name,
  countryCode,
  unreadCount
}) => {
  return (
    <div className="relative">
      <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
        {name ? (
          <User2 className="h-6 w-6 text-white" />
        ) : (
          <Phone className="h-6 w-6 text-white" />
        )}
      </div>
      {countryCode && (
        <div className="absolute -bottom-1 -right-1">
          <CountryFlag 
            countryCode={countryCode} 
            className="w-4 h-4"
          />
        </div>
      )}
      {unreadCount && unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount}
        </div>
      )}
    </div>
  );
};

export default ConversationAvatar;
