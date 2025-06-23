
import { supabase } from '@/integrations/supabase/client';
import { AppointmentService } from './appointmentService';

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

      // Construir prompt do sistema com contexto da clínica e ferramentas de agendamento
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

      systemPrompt += `\n\nFUNCIONALIDADES DE AGENDAMENTO:
Você pode ajudar os pacientes com agendamentos usando as seguintes ações:
- CRIAR agendamento: use quando o paciente quiser marcar uma consulta
- LISTAR agendamentos: use quando o paciente quiser ver seus agendamentos
- REAGENDAR: use quando o paciente quiser mudar um agendamento existente
- CANCELAR: use quando o paciente quiser cancelar um agendamento

Para criar um agendamento, você precisa:
- Nome/título da consulta
- Data (formato DD/MM/AAAA)
- Horário de início (formato HH:MM)
- Horário de fim (formato HH:MM)
- Email do paciente (opcional)
- Local (opcional)

INSTRUÇÕES:
- Responda de forma clara e objetiva
- Quando o paciente mencionar agendamento, ofereça ajuda específica
- Para agendamentos, colete todas as informações necessárias antes de criar
- Sempre confirme os detalhes antes de criar/alterar agendamentos
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

      // Verificar se a mensagem é sobre agendamento
      const isAboutAppointment = this.isAppointmentRelated(message);
      
      if (isAboutAppointment) {
        const appointmentResponse = await this.handleAppointmentRequest(message, phoneNumber);
        if (appointmentResponse) {
          return appointmentResponse;
        }
      }

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

  private static isAppointmentRelated(message: string): boolean {
    const appointmentKeywords = [
      'agendar', 'agendamento', 'consulta', 'horário', 'marcar',
      'reagendar', 'cancelar', 'desmarcar', 'alterar', 'mudar',
      'disponibilidade', 'agenda', 'atendimento'
    ];
    
    const lowerMessage = message.toLowerCase();
    return appointmentKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private static async handleAppointmentRequest(message: string, phoneNumber: string): Promise<string | null> {
    const lowerMessage = message.toLowerCase();

    // Detectar tipo de solicitação
    if (lowerMessage.includes('agendar') || lowerMessage.includes('marcar')) {
      return `Para agendar sua consulta, preciso de algumas informações:

📅 **Data desejada** (ex: 25/12/2024)
🕐 **Horário** (ex: 14:00 às 15:00)
👨‍⚕️ **Tipo de consulta** (ex: Consulta Geral, Cardiologia, etc.)
📧 **Seu email** (para enviar confirmação)

Por favor, me informe esses dados e eu criarei seu agendamento!`;
    }

    if (lowerMessage.includes('cancelar') || lowerMessage.includes('desmarcar')) {
      return `Para cancelar seu agendamento, preciso que me informe:

📅 **Data da consulta** que deseja cancelar
🕐 **Horário** da consulta

Com essas informações, posso localizar e cancelar seu agendamento.`;
    }

    if (lowerMessage.includes('reagendar') || lowerMessage.includes('alterar')) {
      return `Para reagendar sua consulta, preciso saber:

📅 **Data atual** da consulta
🕐 **Horário atual** da consulta
📅 **Nova data** desejada
🕐 **Novo horário** desejado

Com essas informações, posso alterar seu agendamento.`;
    }

    if (lowerMessage.includes('listar') || lowerMessage.includes('ver') && lowerMessage.includes('agendamento')) {
      // Buscar agendamentos do paciente
      const result = await AppointmentService.listAppointments();
      if (result.success && result.appointments) {
        if (result.appointments.length === 0) {
          return 'Você não possui agendamentos marcados no momento. Gostaria de agendar uma consulta?';
        }
        
        let response = 'Seus próximos agendamentos:\n\n';
        result.appointments.forEach((apt, index) => {
          response += `${index + 1}. **${apt.title}**\n`;
          response += `📅 ${apt.date} às ${apt.time}\n`;
          if (apt.location) response += `📍 ${apt.location}\n`;
          response += '\n';
        });
        
        return response + 'Precisa alterar algum agendamento?';
      }
    }

    return null;
  }
}
