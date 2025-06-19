
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Phone, User2 } from 'lucide-react';
import CountryFlag from '@/components/CountryFlag';

interface Conversation {
  id: string;
  phone_number: string;
  formatted_phone_number: string | null;
  country_code: string | null;
  name: string | null;
  updated_at: string;
  last_message_preview: string | null;
  unread_count: number | null;
}

interface ConversationHeaderProps {
  conversation: Conversation;
  onBack: () => void;
  getDisplayName: (conversation: Conversation) => string;
}

const ConversationHeader = ({ conversation, onBack, getDisplayName }: ConversationHeaderProps) => {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
                {conversation.name && conversation.name !== conversation.phone_number && !conversation.name.includes('@s.whatsapp.net') ? (
                  <User2 className="h-5 w-5 text-white" />
                ) : (
                  <Phone className="h-5 w-5 text-white" />
                )}
              </div>
              {conversation.country_code && (
                <div className="absolute -bottom-1 -right-1">
                  <CountryFlag 
                    countryCode={conversation.country_code} 
                    className="w-3 h-3"
                  />
                </div>
              )}
            </div>
            
            <div>
              <CardTitle className="text-lg">{getDisplayName(conversation)}</CardTitle>
              <p className="text-sm text-gray-600 font-mono">
                {conversation.formatted_phone_number || conversation.phone_number}
              </p>
            </div>
          </div>
          
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Online
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
};

export default ConversationHeader;
