
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConversationSearch from '@/components/conversations/ConversationSearch';
import ConversationList from '@/components/conversations/ConversationList';
import LoadingState from '@/components/conversations/LoadingState';
import { getDisplayName } from '@/utils/conversationUtils';

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
    const filtered = conversations.filter(conversation => {
      const displayName = getDisplayName(conversation);
      return displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.phone_number.includes(searchTerm) ||
        (conversation.formatted_phone_number && conversation.formatted_phone_number.includes(searchTerm));
    });
    setFilteredConversations(filtered);
  }, [searchTerm, conversations]);

  const fetchConversations = async () => {
    try {
      console.log('🔄 Buscando conversas...');
      // Buscar conversas e contagem de mensagens
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
      
      console.log('📊 Conversas encontradas:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📝 Primeira conversa:', data[0]);
      }
      
      // Para cada conversa, buscar a contagem real de mensagens
      const conversationsWithCount = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from('whatsapp_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);
          
          return {
            ...conv,
            message_count: count || 0
          };
        })
      );

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

  const openConversation = (conversationId: string) => {
    navigate(`/conversas/${conversationId}`);
  };

  if (loading) {
    return <LoadingState />;
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
          
          <ConversationSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </CardHeader>
        <CardContent>
          <ConversationList
            conversations={filteredConversations}
            searchTerm={searchTerm}
            onOpenConversation={openConversation}
            getDisplayName={getDisplayName}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Conversas;
