
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, MessageCircle, Phone } from 'lucide-react';

interface Conversation {
  id: string;
  phone_number: string;
  name: string | null;
  updated_at: string;
  message_count?: number;
}

const Conversas = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const filtered = conversations.filter(conversation =>
      conversation.phone_number.includes(searchTerm) ||
      (conversation.name && conversation.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredConversations(filtered);
  }, [searchTerm, conversations]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select(`
          id,
          phone_number,
          name,
          updated_at
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Simular contagem de mensagens para cada conversa
      const conversationsWithCount = data?.map(conv => ({
        ...conv,
        message_count: Math.floor(Math.random() * 20) + 1
      })) || [];
      
      setConversations(conversationsWithCount);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Formatar número de telefone brasileiro
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
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
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {conversation.name || 'Usuário Anônimo'}
                        </h3>
                        <Badge variant="outline" className={getStatusColor(conversation.message_count || 0)}>
                          {conversation.message_count} mensagens
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatPhoneNumber(conversation.phone_number)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {getTimeAgo(conversation.updated_at)}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      Ativa
                    </Badge>
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
