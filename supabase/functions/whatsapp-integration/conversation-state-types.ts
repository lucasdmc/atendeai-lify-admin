
export interface ConversationState {
  phoneNumber: string;
  currentState: 'initial' | 'service_selection' | 'time_selection' | 'contact_info' | 'confirmation' | 'completed';
  selectedService?: string;
  selectedDate?: string;
  selectedTime?: string;
  customerName?: string;
  customerEmail?: string;
  lastActivity: number;
  attempts: number;
  conversationStarted: boolean;
  messageCount: number;
}

export interface UserInputAnalysis {
  isTimeSelection: boolean;
  isConfirmation: boolean;
  isSpecialtySelection: boolean;
  isGreeting: boolean;
  isAppointmentRequest: boolean;
  extractedTime?: string;
  extractedDate?: string;
  extractedName?: string;
  extractedEmail?: string;
  extractedSpecialty?: string;
}
