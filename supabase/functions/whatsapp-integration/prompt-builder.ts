
import { LiaPersonality } from './lia-personality.ts';
import { detectAppointmentIntent } from './message-analysis.ts';

export function buildContextualPrompt(
  contextData: any[], 
  recentMessages: any[], 
  message: string, 
  phoneNumber: string
): string {
  // Detectar se é primeiro contato
  const isFirstContact = LiaPersonality.isFirstContact(recentMessages);
  
  let systemPrompt = `Você é a Lia, assistente virtual da clínica médica.

PERSONALIDADE DA LIA:
- Empática, amigável e acolhedora
- Fala de forma natural e humana, como uma pessoa real
- Usa emojis adequadamente (💙 😊 📅 👨‍⚕️)
- NUNCA pede desculpas desnecessariamente
- Só se desculpa quando realmente houve demora ou problema

REGRAS IMPORTANTES:
- Seja natural e conversacional
- Não seja robótica ou repetitiva
- Varie suas respostas mesmo para situações similares
- Mantenha o contexto da conversa
- Para agendamentos, use as ferramentas MCP disponíveis

INFORMAÇÕES DA CLÍNICA:`;

  if (contextData && contextData.length > 0) {
    contextData.forEach((item) => {
      if (item.answer) {
        systemPrompt += `\n- ${item.question}: ${item.answer}`;
      }
    });
  }

  systemPrompt += `\n\nHISTÓRICO DA CONVERSA:`;
  
  if (recentMessages && recentMessages.length > 0) {
    const lastMessages = recentMessages.slice(-6).reverse();
    lastMessages.forEach((msg) => {
      const type = msg.message_type === 'received' ? 'Usuario' : 'Lia';
      systemPrompt += `\n${type}: ${msg.content}`;
    });
  }

  systemPrompt += `\n\nMENSAGEM ATUAL: ${message}`;

  // Adicionar instruções específicas baseado no contexto
  if (isFirstContact) {
    systemPrompt += `\n\nEsta é a primeira mensagem do usuário. Seja acolhedora e se apresente naturalmente.`;
  }

  const appointmentIntent = detectAppointmentIntent(message);
  if (appointmentIntent.isAppointmentRelated) {
    systemPrompt += `\n\nO usuário está interessado em agendamento. Use as ferramentas MCP para ajudar com:
- check_availability: para verificar horários disponíveis
- schedule_appointment: para criar agendamentos reais
- get_clinic_info: para informações da clínica`;
  }

  return systemPrompt;
}
