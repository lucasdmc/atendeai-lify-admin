import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';

interface ConversationDetailsProps {
  conversation: {
    id: string;
    phone_number: string;
    formatted_phone_number: string | null;
    country_code: string | null;
    name: string | null;
    updated_at: string | null;
    last_message_preview: string | null;
    unread_count: number | null;
    message_count?: number;
    last_message_type?: string;
  };
  getDisplayName: (conversation: any) => string;
}

const ConversationDetails: React.FC<ConversationDetailsProps> = ({
  conversation,
  getDisplayName
}) => {
  const displayName = getDisplayName(conversation);
  
  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Informações do Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src="" />
              <AvatarFallback className="bg-green-500 text-white">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{displayName}</h3>
              <p className="text-sm text-gray-500">{conversation.formatted_phone_number}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{conversation.formatted_phone_number}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{conversation.message_count || 0} mensagens</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm">Última atividade: {formatTime(conversation.updated_at)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {conversation.message_count || 0}
              </div>
              <div className="text-sm text-gray-500">Total de Mensagens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {conversation.unread_count || 0}
              </div>
              <div className="text-sm text-gray-500">Não Lidas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Phone className="h-4 w-4 mr-2" />
              Ligar
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Enviar Email
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MapPin className="h-4 w-4 mr-2" />
              Ver Localização
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversationDetails; 