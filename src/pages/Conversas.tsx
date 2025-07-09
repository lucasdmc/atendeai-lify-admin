
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConversationSearch from '@/components/conversations/ConversationSearch';
import ConversationList from '@/components/conversations/ConversationList';
import LoadingState from '@/components/conversations/LoadingState';
import { getDisplayName } from '@/utils/conversationUtils';

// Função JavaScript para formatar número de telefone
const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove todos os caracteres não numéricos
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Se começa com código do país (55 para Brasil)
  if (cleaned.startsWith('55')) {
    const number = cleaned.substring(2);
    if (number.length === 10) {
      return `(${number.substring(0, 2)}) ${number.substring(2, 6)}-${number.substring(6)}`;
    } else if (number.length === 11) {
      return `(${number.substring(0, 2)}) ${number.substring(2, 7)}-${number.substring(7)}`;
    }
  }
  
  // Se é um número brasileiro sem código do país
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  } else if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  }
  
  // Se não conseguir formatar, retorna o número original
  return phoneNumber;
};

// Função JavaScript para extrair código do país
const extractCountryCode = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.startsWith('55')) {
    return 'BR';
  }
  return 'BR'; // Default para Brasil
};

interface Conversation {
  id: string;
  phone_number: string;
  formatted_phone_number: string | null;
  country_code: string | null;
  name: string | null;
  updated_at: string | null;
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
            message_count: count || 0,
            updated_at: conv.updated_at || new Date().toISOString()
          };
        })
      );

      // Atualizar conversas que não têm números formatados
      for (const conv of conversationsWithCount) {
        if (!conv.formatted_phone_number) {
          try {
            const formattedNumber = formatPhoneNumber(conv.phone_number);
            const countryCode = extractCountryCode(conv.phone_number);
            
            await supabase
              .from('whatsapp_conversations')
              .update({
                formatted_phone_number: formattedNumber,
                country_code: countryCode
              })
              .eq('id', conv.id);
            
            conv.formatted_phone_number = formattedNumber;
            conv.country_code = countryCode;
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
