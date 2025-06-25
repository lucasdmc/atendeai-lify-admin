
import { ConversationMemoryManager, ConversationMemory } from './conversation-memory.ts';
import { SentimentAnalyzer, SentimentAnalysis } from './sentiment-analyzer.ts';

interface ResponseContext {
  memory: ConversationMemory;
  sentiment: SentimentAnalysis;
  timeContext: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek: string;
    isBusinessHours: boolean;
  };
  userMessage: string;
  conversationFlow: string;
}

export class HumanizedResponseGenerator {
  static generateContextualPrompt(context: ResponseContext): string {
    const { memory, sentiment, timeContext, userMessage } = context;
    
    const empathyPhrase = SentimentAnalyzer.generateEmpatheticResponse(sentiment);
    const personalityAdaptation = this.getPersonalityAdaptation(memory);
    const relationshipContext = this.getRelationshipContext(memory);
    const timeContextStr = this.getTimeContext(timeContext);
    const medicalContext = this.getMedicalContext(memory);

    return `Você é Dra. Ana, uma experiente atendente de clínica médica com mais de 10 anos de experiência. Você é conhecida por sua comunicação empática, natural e humana.

CONTEXTO PESSOAL DO PACIENTE:
${relationshipContext}

PERSONALIDADE E ESTILO:
${personalityAdaptation}

CONTEXTO TEMPORAL:
${timeContextStr}

CONTEXTO MÉDICO E HISTÓRICO:
${medicalContext}

ANÁLISE EMOCIONAL DA MENSAGEM:
- Emoção primária: ${sentiment.primaryEmotion}
- Intensidade: ${sentiment.intensity}
- Urgência: ${sentiment.urgencyLevel}
- Tom de resposta apropriado: ${sentiment.responseTone}
- Estado emocional: ${sentiment.emotionalState}
${sentiment.medicalConcern ? '- ATENÇÃO: Preocupação médica detectada' : ''}

INSTRUÇÃO EMPÁTICA:
${empathyPhrase} Continue a conversa de forma natural, como uma profissional experiente que genuinamente se importa com o bem-estar do paciente.

DIRETRIZES DE COMUNICAÇÃO:
✅ Seja natural e conversacional - evite respostas robóticas
✅ Use o tom apropriado baseado na análise emocional
✅ Mantenha continuidade com conversas anteriores
✅ Seja proativa quando necessário
✅ Adapte-se ao estilo de comunicação preferido
✅ Use conhecimento médico quando relevante
✅ Demonstre empatia genuína
✅ Evite menus ou listas numeradas - seja fluida
✅ Responda como se fosse uma conversa presencial

EVITE:
❌ Respostas mecânicas ou formatadas
❌ Repetir informações já discutidas
❌ Ignorar o contexto emocional
❌ Ser excessivamente formal se o paciente é casual
❌ Menus numerados ou estruturas rígidas
❌ Respostas genéricas

CONTEXTO ESPECÍFICO DESTA CONVERSA:
${this.getSpecificContext(memory, userMessage)}

Responda de forma natural, empática e profissional, mantendo a fluidez da conversa.`;
  }

  private static getPersonalityAdaptation(memory: ConversationMemory): string {
    const { communicationStyle, responsePreference } = memory.personalityProfile;
    
    let adaptation = '';
    
    switch (communicationStyle) {
      case 'formal':
        adaptation += 'O paciente prefere comunicação formal e respeitosa. Use "senhor/senhora" e seja mais protocolar.';
        break;
      case 'casual':
        adaptation += 'O paciente é casual e descontraído. Pode usar linguagem mais relaxada e próxima.';
        break;
      case 'direct':
        adaptation += 'O paciente valoriza objetividade. Seja direta, clara e vá direto ao ponto.';
        break;
      case 'empathetic':
        adaptation += 'O paciente aprecia empatia e cuidado. Seja mais acolhedora e demonstre preocupação genuína.';
        break;
    }
    
    switch (responsePreference) {
      case 'brief':
        adaptation += ' Prefere respostas concisas e diretas.';
        break;
      case 'detailed':
        adaptation += ' Aprecia explicações detalhadas e completas.';
        break;
      case 'step-by-step':
        adaptation += ' Gosta de orientações passo a passo e bem estruturadas.';
        break;
    }
    
    return adaptation;
  }

  private static getRelationshipContext(memory: ConversationMemory): string {
    switch (memory.relationshipStage) {
      case 'first_contact':
        return 'PRIMEIRO CONTATO: Este é seu primeiro atendimento com este paciente. Seja acolhedora e estabeleça rapport.';
      case 'getting_familiar':
        return 'CONHECENDO O PACIENTE: Já tiveram algumas interações. Continue construindo confiança.';
      case 'established':
        return 'RELACIONAMENTO ESTABELECIDO: Vocês já se conhecem bem. Seja mais natural e personalizada.';
      case 'trusted':
        return 'RELACIONAMENTO DE CONFIANÇA: O paciente confia em você. Seja mais próxima e proativa.';
    }
  }

  private static getTimeContext(timeContext: ResponseContext['timeContext']): string {
    let context = `Agora é ${timeContext.timeOfDay === 'morning' ? 'manhã' : 
                            timeContext.timeOfDay === 'afternoon' ? 'tarde' : 
                            timeContext.timeOfDay === 'evening' ? 'início da noite' : 'noite'} de ${timeContext.dayOfWeek}.`;
    
    if (!timeContext.isBusinessHours) {
      context += ' A clínica está fechada, mas você pode dar informações e agendar para os próximos dias úteis.';
    }
    
    return context;
  }

  private static getMedicalContext(memory: ConversationMemory): string {
    let context = '';
    
    if (memory.personalityProfile.medicalHistory.length > 0) {
      context += `Histórico médico conhecido: ${memory.personalityProfile.medicalHistory.join(', ')}. `;
    }
    
    if (memory.conversationContext.nextAppointment) {
      context += `Próxima consulta: ${memory.conversationContext.nextAppointment}. `;
    }
    
    if (memory.conversationContext.lastAppointment) {
      context += `Última consulta: ${memory.conversationContext.lastAppointment}. `;
    }
    
    if (memory.conversationContext.recentConcerns.length > 0) {
      context += `Preocupações recentes: ${memory.conversationContext.recentConcerns.join(', ')}.`;
    }
    
    return context || 'Nenhum histórico médico específico conhecido ainda.';
  }

  private static getSpecificContext(memory: ConversationMemory, userMessage: string): string {
    let context = '';
    
    if (memory.conversationContext.currentTopic) {
      context += `Tópico atual da conversa: ${memory.conversationContext.currentTopic}. `;
    }
    
    if (memory.conversationContext.followUpNeeded) {
      context += 'Follow-up necessário com este paciente. ';
    }
    
    if (memory.conversationContext.lastInteractionSentiment !== 'neutral') {
      context += `Última interação teve sentimento: ${memory.conversationContext.lastInteractionSentiment}. `;
    }
    
    return context;
  }

  static getCurrentTimeContext(): ResponseContext['timeContext'] {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.toLocaleDateString('pt-BR', { weekday: 'long' });
    
    let timeOfDay: ResponseContext['timeContext']['timeOfDay'];
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';
    
    // Horário comercial: 8h às 18h, segunda a sexta
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    const isBusinessHours = isWeekday && hour >= 8 && hour < 18;
    
    return {
      timeOfDay,
      dayOfWeek,
      isBusinessHours
    };
  }

  static async generateHumanizedResponse(
    userMessage: string,
    phoneNumber: string,
    supabase: any,
    contextData: any[],
    conversationHistory: any[]
  ): Promise<string> {
    // Carregar memória do usuário
    const memory = await ConversationMemoryManager.loadMemory(phoneNumber, supabase);
    
    // Analisar sentimento da mensagem
    const sentiment = SentimentAnalyzer.analyzeSentiment(userMessage);
    
    // Adaptar personalidade baseado na mensagem
    ConversationMemoryManager.adaptPersonality(memory, userMessage);
    
    // Obter contexto temporal
    const timeContext = this.getCurrentTimeContext();
    
    // Gerar prompt contextualizado
    const responseContext: ResponseContext = {
      memory,
      sentiment,
      timeContext,
      userMessage,
      conversationFlow: 'ongoing'
    };
    
    const contextualPrompt = this.generateContextualPrompt(responseContext);
    
    // Atualizar histórico de interação
    ConversationMemoryManager.updateInteractionHistory(
      memory, 
      memory.conversationContext.currentTopic || 'general',
      sentiment.primaryEmotion,
      'in_progress'
    );
    
    // Evoluir relacionamento baseado nas interações
    ConversationMemoryManager.evolveRelationship(memory);
    
    // Salvar memória atualizada
    await ConversationMemoryManager.saveMemory(phoneNumber, memory, supabase);
    
    return contextualPrompt;
  }
}
