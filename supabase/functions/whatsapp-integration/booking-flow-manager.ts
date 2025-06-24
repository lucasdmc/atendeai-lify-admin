
import { BookingSessionManager } from './booking-session.ts';
import { BookingStepHandlers } from './booking-steps.ts';
import { BookingConfirmationHandler } from './booking-confirmation.ts';
import { BookingManagementHandler } from './booking-management.ts';

export class BookingFlowManager {
  static async handleBookingMessage(
    phoneNumber: string, 
    message: string, 
    supabase: any
  ): Promise<string> {
    console.log(`📋 Processando mensagem de agendamento de ${phoneNumber}: ${message}`);
    
    const session = BookingSessionManager.getSession(phoneNumber);
    const lowerMessage = message.toLowerCase().trim();

    // Detectar intenção de cancelamento
    if (lowerMessage.includes('cancelar') || lowerMessage.includes('desmarcar')) {
      return await BookingManagementHandler.handleCancellationRequest(phoneNumber, message, supabase);
    }

    // Detectar intenção de reagendamento
    if (lowerMessage.includes('reagendar') || lowerMessage.includes('alterar') || lowerMessage.includes('mudar')) {
      return await BookingManagementHandler.handleRescheduleRequest(phoneNumber, message, supabase);
    }

    // Fluxo principal de agendamento
    switch (session.currentStep) {
      case 'service':
        return await BookingStepHandlers.handleServiceSelection(phoneNumber, message, supabase);
      
      case 'slots':
        return await BookingStepHandlers.handleSlotSelection(phoneNumber, message, supabase);
      
      case 'contact_info':
        return await BookingStepHandlers.handleContactInfo(phoneNumber, message, supabase);
      
      case 'confirmation':
        return await BookingConfirmationHandler.handleConfirmation(phoneNumber, message, supabase);
      
      default:
        return await this.startBookingFlow(phoneNumber, supabase);
    }
  }

  private static async startBookingFlow(phoneNumber: string, supabase: any): Promise<string> {
    BookingSessionManager.updateSession(phoneNumber, { 
      currentStep: 'service',
      appointmentType: 'new'
    });

    return BookingStepHandlers.generateServiceMenu();
  }
}

// Export the interface for backward compatibility
export type { BookingSession } from './booking-session.ts';
