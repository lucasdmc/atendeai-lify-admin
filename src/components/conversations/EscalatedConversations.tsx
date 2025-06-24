import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EscalatedConversation {
  id: string;
  phone_number: string;
  formatted_phone_number: string | null;
  name: string | null;
  escalation_reason: string;
  escalated_at: string;
  last_message_preview: string | null;
  loop_counter: number;
}

export default function EscalatedConversations() {
  const [escalatedConversations, setEscalatedConversations] = useState<EscalatedConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEscalatedConversations();
    
    // Configurar realtime para novas escalações
    const channel = supabase
      .channel('escalated-conversations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_conversations',
          filter: 'escalated_to_human=eq.true'
        },
        (payload) => {
          console.log('Nova conversa escalada:', payload);
          fetchEscalatedConversations();
          toast({
            title: "Nova conversa escalada",
            description: "Uma conversa foi escalada para atendimento humano",
            variant: "default",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const fetchEscalatedConversations = async () => {
    try {
      setLoading(true);
      console.log('🔍 Buscando conversas escaladas...');
      
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('escalated_to_human', true)
        .order('escalated_at', { ascending: false });

      if (error) throw error;
      
      console.log('📊 Conversas escaladas encontradas:', data?.length || 0);
      setEscalatedConversations(data || []);
    } catch (error) {
      console.error('Erro ao buscar conversas escaladas:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar conversas escaladas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsResolved = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update({
          escalated_to_human: false,
          escalation_reason: null,
          escalated_at: null,
          loop_counter: 0,
          consecutive_same_responses: 0,
          last_ai_response: null
        })
        .eq('id', conversationId);

      if (error) throw error;

      setEscalatedConversations(prev => 
        prev.filter(conv => conv.id !== conversationId)
      );

      toast({
        title: "Conversa resolvida",
        description: "A conversa foi marcada como resolvida e pode voltar ao bot",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao resolver conversa:', error);
      toast({
        title: "Erro",
        description: "Falha ao marcar conversa como resolvida",
        variant: "destructive",
      });
    }
  };

  const getDisplayName = (conversation: EscalatedConversation) => {
    if (conversation.name && conversation.name !== 'Unknown' && !conversation.name.includes('@')) {
      return conversation.name;
    }
    return conversation.formatted_phone_number || conversation.phone_number;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Conversas Escaladas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Conversas Escaladas ({escalatedConversations.length})
          <Button
            size="sm"
            variant="outline"
            onClick={fetchEscalatedConversations}
            className="ml-auto"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {escalatedConversations.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma conversa escalada no momento</p>
            <p className="text-sm text-gray-400 mt-2">Todas as conversas estão sendo atendidas pelo bot</p>
          </div>
        ) : (
          <div className="space-y-4">
            {escalatedConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="border rounded-lg p-4 space-y-3 bg-orange-50 border-orange-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {getDisplayName(conversation)}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {conversation.phone_number}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    Escalada
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Motivo:</span>
                    <span>{conversation.escalation_reason}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Escalada há:</span>
                    <span>
                      {formatDistanceToNow(new Date(conversation.escalated_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </div>

                  {conversation.loop_counter > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Loops detectados:</span> {conversation.loop_counter}
                    </div>
                  )}

                  {conversation.last_message_preview && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Última mensagem:</span>
                      <p className="mt-1 text-xs bg-white p-2 rounded border">
                        {conversation.last_message_preview}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => markAsResolved(conversation.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Resolvida
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/conversas/${conversation.id}`, '_blank')}
                  >
                    Ver Conversa
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
