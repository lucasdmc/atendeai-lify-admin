
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Search, MessageCircle, Phone, Clock, User2 } from 'lucide-react';
import CountryFlag from '@/components/CountryFlag';
import { useNavigate } from 'react-router-dom';

interface Conversation {
  id: string;
  phone_number: string;
  formatted_phone_number: string | null;
  country_code: string | null;
  name: string | null;
  updated_at: string;
  last_message_preview: string | null;
  unread_count: number | null;
  message_count?: number;
}

const Conversas = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const filtered = conversations.filter(conversation =>
      conversation.phone_number.includes(searchTerm) ||
      (conversation.formatted_phone_number && conversation.formatted_phone_number.includes(searchTerm)) ||
      (conversation.name && conversation.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredConversations(filtered);
  }, [searchTerm, conversations]);

  const fetchConversations = async () => {
    try {
      // Buscar conversas e atualizar números formatados se necessário
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select(`
          id,
          phone_number,
          formatted_phone_number,
          country_code,
          name,
          updated_at,
          last_message_preview,
          unread_count
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Simular contagem de mensagens para cada conversa
      const conversationsWithCount = data?.map(conv => ({
        ...conv,
        message_count: Math.floor(Math.random() * 20) + 1
      })) || [];

      // Atualizar conversas que não têm números formatados
      for (const conv of conversationsWithCount) {
        if (!conv.formatted_phone_number) {
          try {
            const formatResult = await supabase
              .rpc('format_phone_number', { phone_number: conv.phone_number });
            
            if (formatResult.data) {
              const countryResult = await supabase
                .rpc('extract_country_code', { phone_number: conv.phone_number });
              
              await supabase
                .from('whatsapp_conversations')
                .update({
                  formatted_phone_number: formatResult.data,
                  country_code: countryResult.data
                })
                .eq('id', conv.id);
              
              conv.formatted_phone_number = formatResult.data;
              conv.country_code = countryResult.data;
            }
          } catch (updateError) {
            console.error('Error formatting phone number:', updateError);
          }
        }
      }
      
      setConversations(conversationsWithCount);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora há pouco';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

  const getStatusColor = (messageCount: number) => {
    if (messageCount > 10) return 'bg-green-100 text-green-800';
    if (messageCount > 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const openConversation = (conversationId: string) => {
    // Navegar para a conversa específica (implementaremos depois)
    console.log('Opening conversation:', conversationId);
    // navigate(`/conversas/${conversationId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
          Conversas WhatsApp
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Lista de Conversas
          </CardTitle>
          <CardDescription>
            Gerencie todas as conversas do WhatsApp Business
          </CardDescription>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por telefone ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border"
                  onClick={() => openConversation(conversation.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
                        {conversation.name ? (
                          <User2 className="h-6 w-6 text-white" />
                        ) : (
                          <Phone className="h-6 w-6 text-white" />
                        )}
                      </div>
                      {conversation.country_code && (
                        <div className="absolute -bottom-1 -right-1">
                          <CountryFlag 
                            countryCode={conversation.country_code} 
                            className="w-4 h-4"
                          />
                        </div>
                      )}
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unread_count}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {conversation.name || 'Usuário Anônimo'}
                        </h3>
                        <Badge variant="outline" className={getStatusColor(conversation.message_count || 0)}>
                          {conversation.message_count} mensagens
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 font-mono">
                        {conversation.formatted_phone_number || conversation.phone_number}
                      </p>
                      {conversation.last_message_preview && (
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                          {conversation.last_message_preview}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      {getTimeAgo(conversation.updated_at)}
                    </div>
                    <Badge variant="secondary">
                      Ativa
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openConversation(conversation.id);
                      }}
                    >
                      Abrir Chat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Conversas;
