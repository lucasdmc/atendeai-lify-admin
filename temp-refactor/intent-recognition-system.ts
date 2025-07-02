// src/services/ai/intentRecognitionService.ts

import { supabase } from '@/integrations/supabase/client';

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

export class IntentRecognitionService {
  private static readonly INTENT_PROMPT = `
You are an intent recognition system for a medical clinic's WhatsApp chatbot.
Analyze the user message and conversation history to identify the intent.

Available intents:
- APPOINTMENT_CREATE: User wants to schedule an appointment
- APPOINTMENT_RESCHEDULE: User wants to change an existing appointment
- APPOINTMENT_CANCEL: User wants to cancel an appointment
- APPOINTMENT_LIST: User wants to see their appointments
- INFO_HOURS: Asking about clinic hours
- INFO_LOCATION: Asking about clinic address/location
- INFO_SERVICES: Asking about available services/specialties
- INFO_DOCTORS: Asking about doctors/professionals
- INFO_PRICES: Asking about prices/insurance
- INFO_GENERAL: General information questions
- GREETING: Greeting messages
- FAREWELL: Goodbye messages
- HUMAN_HANDOFF: User wants to speak with a human
- UNCLEAR: Intent is not clear

Extract entities like:
- dates, times, doctor names, services, symptoms, etc.

Return a JSON with: {
  "intent": "INTENT_NAME",
  "confidence": 0.0-1.0,
  "entities": { extracted entities },
  "reasoning": "brief explanation"
}`;

  static async recognizeIntent(context: IntentContext): Promise<Intent> {
    try {
      // Preparar mensagens para o LLM
      const messages = [
        {
          role: 'system' as const,
          content: this.INTENT_PROMPT
        },
        {
          role: 'user' as const,
          content: `
Current message: "${context.message}"

Conversation history:
${context.conversationHistory.map(h => `${h.role}: ${h.content}`).join('\n')}

Clinic context:
- Services: ${JSON.stringify(context.clinicContext.services || [])}
- Doctors: ${JSON.stringify(context.clinicContext.doctors || [])}
          `.trim()
        }
      ];

      // Chamar LLM para reconhecimento de intenção
      const { data, error } = await supabase.functions.invoke('ai-intent-recognition', {
        body: { messages }
      });

      if (error || !data?.intent) {
        console.error('Intent recognition error:', error);
        return this.fallbackIntentRecognition(context.message);
      }

      // Mapear categoria baseado na intenção
      const category = this.mapIntentToCategory(data.intent);
      
      return {
        name: data.intent,
        confidence: data.confidence || 0.8,
        entities: data.entities || {},
        requiresAction: category === 'appointment',
        category
      };
    } catch (error) {
      console.error('Intent recognition failed:', error);
      return this.fallbackIntentRecognition(context.message);
    }
  }

  private static fallbackIntentRecognition(message: string): Intent {
    const lowerMessage = message.toLowerCase();
    
    // Detecção básica por palavras-chave
    if (this.containsAppointmentKeywords(lowerMessage)) {
      return {
        name: 'APPOINTMENT_CREATE',
        confidence: 0.6,
        entities: {},
        requiresAction: true,
        category: 'appointment'
      };
    }
    
    if (this.containsInfoKeywords(lowerMessage)) {
      return {
        name: 'INFO_GENERAL',
        confidence: 0.6,
        entities: {},
        requiresAction: false,
        category: 'information'
      };
    }
    
    return {
      name: 'UNCLEAR',
      confidence: 0.3,
      entities: {},
      requiresAction: false,
      category: 'conversation'
    };
  }

  private static containsAppointmentKeywords(message: string): boolean {
    const keywords = [
      'agendar', 'agendamento', 'consulta', 'marcar',
      'remarcar', 'reagendar', 'cancelar', 'desmarcar',
      'horário', 'disponibilidade', 'agenda'
    ];
    return keywords.some(k => message.includes(k));
  }

  private static containsInfoKeywords(message: string): boolean {
    const keywords = [
      'endereço', 'localização', 'onde fica', 'como chegar',
      'horário', 'funciona', 'abre', 'fecha',
      'preço', 'valor', 'quanto custa', 'convênio',
      'médico', 'doutor', 'especialista', 'atende'
    ];
    return keywords.some(k => message.includes(k));
  }

  private static mapIntentToCategory(intent: string): Intent['category'] {
    if (intent.startsWith('APPOINTMENT_')) return 'appointment';
    if (intent.startsWith('INFO_')) return 'information';
    if (['GREETING', 'FAREWELL', 'UNCLEAR'].includes(intent)) return 'conversation';
    if (intent === 'HUMAN_HANDOFF') return 'support';
    return 'conversation';
  }
}