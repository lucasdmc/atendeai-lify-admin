// Tipos para serviços de IA
// Substitui as importações do intentRecognitionService.ts que foi migrado para o back-end

export interface Intent {
  name: string;
  confidence: number;
  entities: Record<string, any>;
  requiresAction: boolean;
  category: 'appointment' | 'information' | 'conversation' | 'support';
}

export interface IntentContext {
  message: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  clinicContext: Record<string, any>;
  userProfile?: {
    phone: string;
    name?: string;
    previousAppointments?: number;
  };
} 