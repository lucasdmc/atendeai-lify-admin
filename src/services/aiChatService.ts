
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class AIChatService {
  static async processMessage(phoneNumber: string, message: string): Promise<string> {
    try {
      // Buscar contexto da clínica
      const { data: contextData } = await supabase
        .from('contextualization_data')
        .select('question, answer')
        .order('order_number');

      // Buscar histórico recente da conversa
      const { data: recentMessages } = await supabase
        .from('whatsapp_messages')
        .select('content, message_type, timestamp')
        .eq('conversation_id', `conv_${phoneNumber.replace(/\D/g, '')}`)
        .order('timestamp', { ascending: false })
        .limit(10);

      // Construir prompt do sistema com contexto da clínica
      let systemPrompt = `Você é um assistente virtual de uma clínica médica. Seja sempre educado, profissional e prestativo.

INFORMAÇÕES DA CLÍNICA:`;

      if (contextData && contextData.length > 0) {
        contextData.forEach((item) => {
          if (item.answer) {
            systemPrompt += `\n- ${item.question}: ${item.answer}`;
          }
        });
      } else {
        systemPrompt += `\n- Esta é uma clínica médica que oferece diversos serviços de saúde.`;
      }

      systemPrompt += `\n\nINSTRUÇÕES:
- Responda de forma clara e objetiva
- Se não souber uma informação específica, seja honesto e ofereça alternativas
- Para agendamentos ou informações específicas, oriente o paciente a entrar em contato por telefone
- Mantenha sempre um tom profissional e acolhedor
- Respostas devem ser concisas (máximo 2-3 parágrafos)`;

      // Construir histórico da conversa
      const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

      if (recentMessages && recentMessages.length > 0) {
        // Adicionar mensagens recentes ao contexto (em ordem cronológica)
        recentMessages
          .reverse()
          .slice(0, 8) // Limitar a 8 mensagens para não exceder tokens
          .forEach((msg) => {
            if (msg.content) {
              messages.push({
                role: msg.message_type === 'inbound' ? 'user' : 'assistant',
                content: msg.content
              });
            }
          });
      }

      // Adicionar mensagem atual
      messages.push({ role: 'user', content: message });

      // Chamar a OpenAI
      const { data, error } = await supabase.functions.invoke('ai-chat-response', {
        body: { messages, phoneNumber }
      });

      if (error) {
        console.error('Erro ao chamar AI:', error);
        return 'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns minutos ou entre em contato por telefone.';
      }

      return data?.response || 'Olá! Como posso ajudá-lo hoje?';
    } catch (error) {
      console.error('Erro no serviço de AI:', error);
      return 'Desculpe, estou temporariamente indisponível. Por favor, tente novamente em alguns minutos.';
    }
  }
}
