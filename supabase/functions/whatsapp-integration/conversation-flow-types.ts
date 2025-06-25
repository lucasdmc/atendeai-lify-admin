
export interface FlowHandlerParams {
  phoneNumber: string;
  message: string;
  userInput: any;
  supabase: any;
}

export interface AppointmentData {
  specialty?: string;
  date?: string;
  time?: string;
  customerName?: string;
  customerEmail?: string;
}

export interface MessageDetectionResult {
  isGreeting: boolean;
  isAppointmentRequest: boolean;
  specialty?: string;
}

export interface TimeExtractionResult {
  time?: string;
  confidence: number;
}

export interface SpecialtyDetectionResult {
  specialty?: string;
  confidence: number;
}
