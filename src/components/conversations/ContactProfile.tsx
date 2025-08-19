import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageCircle, 
  
  Edit,
  Star,
  MoreVertical
} from 'lucide-react';
import { getAvatarUrl, generateColorsFromName } from '@/utils/avatarUtils';

interface ContactProfileProps {
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

  const ContactProfile: React.FC<ContactProfileProps> = ({
  conversation,
  getDisplayName
}) => {
  const displayName = getDisplayName(conversation);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const colors = generateColorsFromName(displayName);

  useEffect(() => {
    const generateAvatar = async () => {
      try {
        const url = getAvatarUrl({
          name: displayName,
          phone: conversation.phone_number,
          size: 300
        });
        setAvatarUrl(url);
      } catch (error) {
        console.error('Erro ao gerar avatar:', error);
      }
    };

    generateAvatar();
  }, [displayName, conversation.phone_number]);
  
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
    <div className="p-6 space-y-6">
      {/* Foto de Perfil Grande */}
      <div className="text-center">
        <div className="relative inline-block">
          <Avatar className="h-32 w-32 mx-auto mb-4">
            <AvatarImage 
              src={avatarUrl} 
            />
            <AvatarFallback 
              className="text-4xl font-bold"
              style={{
                backgroundColor: colors.backgroundColor,
                color: colors.textColor
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{displayName}</h2>
        <p className="text-gray-500 mb-4">{conversation.formatted_phone_number}</p>
        
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Online
          </Badge>
          <Button variant="ghost" size="sm">
            <Star className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Informações de Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações de Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium">{conversation.formatted_phone_number}</p>
              <p className="text-sm text-gray-500">Número principal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium">{conversation.message_count || 0} mensagens</p>
              <p className="text-sm text-gray-500">Total de conversas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium">{formatTime(conversation.updated_at)}</p>
              <p className="text-sm text-gray-500">Última atividade</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {conversation.message_count || 0}
              </div>
              <div className="text-sm text-gray-600">Mensagens</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {conversation.unread_count || 0}
              </div>
              <div className="text-sm text-gray-600">Não Lidas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Phone className="h-4 w-4 mr-3" />
              Ligar
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Mail className="h-4 w-4 mr-3" />
              Enviar Email
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MapPin className="h-4 w-4 mr-3" />
              Ver Localização
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MessageCircle className="h-4 w-4 mr-3" />
              Ver Histórico
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactProfile; 