
export function getEscalationMessage(): string {
  return `Sua conversa foi transferida para um atendente humano. Nossa equipe entrará em contato em breve para dar continuidade ao seu atendimento. 

Para urgências, entre em contato pelo telefone da clínica.`;
}

export async function handleEscalatedConversation(phoneNumber: string, supabase: any): Promise<void> {
  console.log('🚨 Conversa escalada - enviando mensagem de transferência');
  const escalationMessage = getEscalationMessage();
  const { sendMessageWithRetry } = await import('./message-retry.ts');
  await sendMessageWithRetry(phoneNumber, escalationMessage, supabase);
}
