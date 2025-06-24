
import { isAppointmentRelated } from './appointment-utils.ts';
import { handleAppointmentRequest } from './appointment-handler.ts';
import { generateAIResponse } from './openai-service.ts';

export async function processMessageResponse(
  message: string, 
  phoneNumber: string, 
  contextData: any[], 
  recentMessages: any[], 
  supabase: any
): Promise<string> {
  // Verificar se é sobre agendamento e tentar processar
  const isAboutAppointment = isAppointmentRelated(message);
  console.log(`📅 Mensagem sobre agendamento: ${isAboutAppointment ? 'SIM' : 'NÃO'}`);

  let aiResponse: string;

  if (isAboutAppointment) {
    console.log('🔄 Processando solicitação de agendamento...');
    const appointmentResponse = await handleAppointmentRequest(message, phoneNumber, supabase);
    if (appointmentResponse) {
      aiResponse = appointmentResponse;
      console.log('📅 Resposta de agendamento gerada:', appointmentResponse.substring(0, 100) + '...');
    } else {
      // Se não conseguiu processar agendamento, usar IA
      console.log('🤖 Processando com IA...');
      aiResponse = await generateAIResponse(contextData, recentMessages, message);
    }
  } else {
    // Processar com IA
    console.log('🤖 Processando com IA...');
    aiResponse = await generateAIResponse(contextData, recentMessages, message);
  }

  return aiResponse;
}
