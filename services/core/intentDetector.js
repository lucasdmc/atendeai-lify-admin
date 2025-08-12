import config from '../config/index.js';
import OpenAI from 'openai';

export default class IntentDetector {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
      ...(config.OPENAI_BASE_URL ? { baseURL: config.OPENAI_BASE_URL } : {}),
    });
  }

  async detect(message, conversationHistory = [], clinicContext = {}) {
    const prompt = `You are an intent recognition system for a medical clinic's WhatsApp chatbot.
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

Extract entities like: dates, times, doctor names, services, symptoms, etc.

Current message: "${message}"

Conversation history:
${conversationHistory.map(h => `${h.role}: ${h.content}`).join('\n')}

Clinic context:
- Services: ${JSON.stringify(clinicContext.services || [])}
- Doctors: ${JSON.stringify(clinicContext.professionals || [])}

Return a JSON with: { "intent": "INTENT_NAME", "confidence": 0.0-1.0, "entities": {}, "reasoning": "brief explanation" }`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 200,
    });

    const response = completion.choices[0]?.message?.content || '';
    let intentData;
    try {
      let cleanResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      if (!cleanResponse.trim().startsWith('{')) {
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) cleanResponse = jsonMatch[0];
      }
      intentData = JSON.parse(cleanResponse.trim());
    } catch {
      return this.fallback(message);
    }

    if (!intentData.intent) return this.fallback(message);
    return intentData;
  }

  fallback(message) {
    const lower = message.toLowerCase();
    if (/(agendar|marcar|consulta|atendimento)/.test(lower)) return { intent: 'APPOINTMENT_CREATE', confidence: 0.6, entities: {}, reasoning: 'keyword' };
    if (/(remarcar|reagendar|mudar|alterar).*(consulta|atendimento)/.test(lower)) return { intent: 'APPOINTMENT_RESCHEDULE', confidence: 0.55, entities: {}, reasoning: 'keyword' };
    if (/(cancelar|desmarcar).*(consulta|atendimento)/.test(lower)) return { intent: 'APPOINTMENT_CANCEL', confidence: 0.55, entities: {}, reasoning: 'keyword' };
    if (/(meus?\s*agendamentos|minhas?\s*consultas|ver\s*consultas)/.test(lower)) return { intent: 'APPOINTMENT_LIST', confidence: 0.5, entities: {}, reasoning: 'keyword' };
    return { intent: 'UNCLEAR', confidence: 0.3, entities: {}, reasoning: 'fallback' };
  }
}
