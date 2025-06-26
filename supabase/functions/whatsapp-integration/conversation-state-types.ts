
export interface ConversationState {
  phoneNumber: string;
  currentState: string;
  conversationStarted: number;
  lastActivity: number;
  messageCount: number;
  selectedService: string | null;
  selectedTime: string | null;
  selectedDate: string | null;
  customerName: string | null;
  customerEmail: string | null;
  bookingConfirmed: boolean;
  contextData: Record<string, any>;
  agentId: string | null;
  clinicId: string | null;
}

export interface ConversationContext {
  phoneNumber: string;
  messageHistory: string[];
  currentIntent: string;
  userPreferences: Record<string, any>;
  sessionData: Record<string, any>;
}

export interface AgentConfig {
  id: string;
  name: string;
  personality: string;
  temperature: number;
  clinicId: string;
  contexts: AgentContext[];
}

export interface AgentContext {
  id: string;
  category: string;
  title: string;
  content: string;
}
