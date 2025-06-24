
import { BookingFlowManager } from './booking-flow-manager.ts';
import { ApprovalSystem } from './approval-system.ts';
import { isAppointmentRelated } from './appointment-utils.ts';

export async function handleEnhancedAppointmentRequest(
  message: string, 
  phoneNumber: string, 
  supabase: any
): Promise<string | null> {
  console.log('🏥 === PROCESSAMENTO AVANÇADO DE AGENDAMENTO ===');
  console.log(`📞 Número: ${phoneNumber}`);
  console.log(`💬 Mensagem: ${message}`);
  
  // Verificar se é relacionado a agendamento
  if (!isAppointmentRelated(message)) {
    console.log('❌ Mensagem não é sobre agendamento');
    return null;
  }

  try {
    // Usar o novo fluxo de agendamento
    const response = await BookingFlowManager.handleBookingMessage(
      phoneNumber,
      message,
      supabase
    );

    console.log('✅ Resposta do fluxo de agendamento gerada');
    return response;

  } catch (error) {
    console.error('❌ Erro no processamento avançado de agendamento:', error);
    
    return `😔 Ops! Tive um probleminha ao processar seu agendamento.

Por favor, tente novamente ou entre em contato por telefone:
📞 (XX) XXXX-XXXX

Estou aqui para ajudar! 😊`;
  }
}

// Função para processar comandos de aprovação dos atendentes
export async function handleApprovalCommand(
  message: string,
  attendantId: string,
  supabase: any
): Promise<string | null> {
  console.log('⚖️ Processando comando de aprovação do atendente');
  
  const lowerMessage = message.toLowerCase();
  
  // Detectar comandos de aprovação
  const approveMatch = message.match(/\/aprovar\s+([a-zA-Z0-9_]+)(?:\s+(.+))?/i);
  const rejectMatch = message.match(/\/rejeitar\s+([a-zA-Z0-9_]+)(?:\s+(.+))?/i);
  
  if (approveMatch) {
    const [, approvalId, notes] = approveMatch;
    const success = await ApprovalSystem.processApprovalResponse(
      supabase,
      approvalId,
      'approved',
      attendantId,
      notes
    );
    
    return success 
      ? `✅ Aprovação ${approvalId} processada com sucesso!`
      : `❌ Erro ao processar aprovação ${approvalId}`;
  }
  
  if (rejectMatch) {
    const [, approvalId, notes] = rejectMatch;
    const success = await ApprovalSystem.processApprovalResponse(
      supabase,
      approvalId,
      'rejected',
      attendantId,
      notes || 'Solicitação negada pelo atendente'
    );
    
    return success 
      ? `✅ Rejeição ${approvalId} processada com sucesso!`
      : `❌ Erro ao processar rejeição ${approvalId}`;
  }
  
  return null;
}
