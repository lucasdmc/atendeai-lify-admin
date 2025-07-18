import { supabase } from '@/integrations/supabase/client';

// Interfaces para o sistema avançado
export interface AdvancedMessageRequest {
  phoneNumber: string;
  message: string;
  agentId?: string;
  conversationId?: string;
}

export interface AdvancedMessageResponse {
  response: string;
  intent: string;
  confidence: number;
  toolsUsed?: string[];
  escalateToHuman?: boolean;
  metadata?: Record<string, any>;
}

export interface Intent {
  name: string;
  confidence: number;
  entities: Record<string, any>;
  requiresAction: boolean;
  category: string;
}

export interface IntentContext {
  message: string;
  conversationHistory: any[];
  clinicContext: Record<string, any>;
  userProfile?: any;
}

export interface RAGContext {
  query: string;
  intent: string;
  entities: Record<string, any>;
  topK?: number;
}

export interface RAGResponse {
  retrievedInfo: any[];
  augmentedPrompt: string;
  sources: string[];
}

export interface ConversationMemory {
  phoneNumber: string;
  history: any[];
  userProfile: any;
  loopCount: number;
  frustrationLevel: number;
  lastInteraction: Date;
}

export interface PersonalizationContext {
  patientProfile: {
    name: string;
    preferences: Record<string, any>;
    history: any[];
  };
  clinicContext: Record<string, any>;
  interactionStyle: string;
}

// Serviço de Reconhecimento de Intenções
class IntentRecognitionService {
  private static readonly INTENT_PROMPT = `
Você é um sistema de reconhecimento de intenções para um chatbot de clínica médica.
Analise a mensagem do usuário e identifique a intenção.

Intenções disponíveis:
- APPOINTMENT_CREATE: Usuário quer agendar consulta
- APPOINTMENT_RESCHEDULE: Usuário quer reagendar consulta
- APPOINTMENT_CANCEL: Usuário quer cancelar consulta
- APPOINTMENT_LIST: Usuário quer ver seus agendamentos
- INFO_HOURS: Perguntando sobre horários da clínica
- INFO_LOCATION: Perguntando sobre endereço/localização
- INFO_SERVICES: Perguntando sobre serviços/especialidades
- INFO_DOCTORS: Perguntando sobre médicos/profissionais
- INFO_PRICES: Perguntando sobre preços/convênios
- INFO_GENERAL: Perguntas gerais de informação
- GREETING: Mensagens de saudação
- FAREWELL: Mensagens de despedida
- HUMAN_HANDOFF: Usuário quer falar com humano
- UNCLEAR: Intenção não está clara

Extraia entidades como:
- datas, horários, nomes de médicos, serviços, sintomas, etc.

Retorne um JSON com: {
  "intent": "NOME_DA_INTENCAO",
  "confidence": 0.0-1.0,
  "entities": { entidades extraídas },
  "reasoning": "explicação breve"
}`;

  static async recognizeIntent(context: IntentContext): Promise<Intent> {
    try {
      const messages = [
        {
          role: 'system' as const,
          content: this.INTENT_PROMPT
        },
        {
          role: 'user' as const,
          content: `
Mensagem atual: "${context.message}"

Histórico da conversa:
${context.conversationHistory.map(h => `${h.role}: ${h.content}`).join('\n')}

Contexto da clínica:
- Serviços: ${JSON.stringify(context.clinicContext.services || [])}
- Médicos: ${JSON.stringify(context.clinicContext.doctors || [])}
          `.trim()
        }
      ];

      const { data, error } = await supabase.functions.invoke('ai-chat-gpt4', {
        body: { 
          messages,
          systemPrompt: 'Você é um sistema de reconhecimento de intenções. Responda APENAS com JSON válido.'
        }
      });

      if (error || !data?.response) {
        console.error('Erro no reconhecimento de intenção:', error);
        return this.fallbackIntentRecognition(context.message);
      }

      try {
        const intentData = JSON.parse(data.response);
        const category = this.mapIntentToCategory(intentData.intent);
        
        return {
          name: intentData.intent,
          confidence: intentData.confidence || 0.8,
          entities: intentData.entities || {},
          requiresAction: category === 'appointment',
          category
        };
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta:', parseError);
        return this.fallbackIntentRecognition(context.message);
      }
    } catch (error) {
      console.error('Falha no reconhecimento de intenção:', error);
      return this.fallbackIntentRecognition(context.message);
    }
  }

  private static fallbackIntentRecognition(message: string): Intent {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('oi') || lowerMessage.includes('olá') || lowerMessage.includes('bom dia') || lowerMessage.includes('boa tarde') || lowerMessage.includes('boa noite')) {
      return { name: 'GREETING', confidence: 0.9, entities: {}, requiresAction: false, category: 'greeting' };
    }
    
    if (lowerMessage.includes('agendar') || lowerMessage.includes('marcar') || lowerMessage.includes('consulta')) {
      return { name: 'APPOINTMENT_CREATE', confidence: 0.8, entities: {}, requiresAction: true, category: 'appointment' };
    }
    
    if (lowerMessage.includes('horário') || lowerMessage.includes('funciona')) {
      return { name: 'INFO_HOURS', confidence: 0.8, entities: {}, requiresAction: false, category: 'info' };
    }
    
    if (lowerMessage.includes('endereço') || lowerMessage.includes('onde') || lowerMessage.includes('local')) {
      return { name: 'INFO_LOCATION', confidence: 0.8, entities: {}, requiresAction: false, category: 'info' };
    }
    
    return { name: 'UNCLEAR', confidence: 0.3, entities: {}, requiresAction: false, category: 'support' };
  }

  private static mapIntentToCategory(intent: string): string {
    const appointmentIntents = ['APPOINTMENT_CREATE', 'APPOINTMENT_RESCHEDULE', 'APPOINTMENT_CANCEL', 'APPOINTMENT_LIST'];
    const infoIntents = ['INFO_HOURS', 'INFO_LOCATION', 'INFO_SERVICES', 'INFO_DOCTORS', 'INFO_PRICES', 'INFO_GENERAL'];
    const greetingIntents = ['GREETING', 'FAREWELL'];
    
    if (appointmentIntents.includes(intent)) return 'appointment';
    if (infoIntents.includes(intent)) return 'info';
    if (greetingIntents.includes(intent)) return 'greeting';
    if (intent === 'HUMAN_HANDOFF') return 'support';
    
    return 'general';
  }
}

// Serviço de Memória de Conversação
class ConversationMemoryService {
  private static memoryCache = new Map<string, ConversationMemory>();

  static async loadMemory(phoneNumber: string): Promise<ConversationMemory> {
    // Verificar cache primeiro
    if (this.memoryCache.has(phoneNumber)) {
      return this.memoryCache.get(phoneNumber)!;
    }

    // Carregar do banco de dados
    const { data: conversations } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('phone_number', phoneNumber)
      .order('timestamp', { ascending: false })
      .limit(20);

    const history = conversations?.map(msg => ({
      role: msg.message_type === 'received' ? 'user' : 'assistant',
      content: msg.content,
      timestamp: msg.timestamp
    })) || [];

    const memory: ConversationMemory = {
      phoneNumber,
      history,
      userProfile: await this.loadUserProfile(phoneNumber),
      loopCount: this.calculateLoopCount(history),
      frustrationLevel: this.calculateFrustrationLevel(history),
      lastInteraction: new Date()
    };

    this.memoryCache.set(phoneNumber, memory);
    return memory;
  }

  static async saveInteraction(
    phoneNumber: string,
    userMessage: string,
    aiResponse: string,
    intent: Intent
  ): Promise<void> {
    const memory = await this.loadMemory(phoneNumber);
    
    memory.history.push(
      { role: 'user', content: userMessage, timestamp: new Date() },
      { role: 'assistant', content: aiResponse, timestamp: new Date() }
    );

    // Manter apenas as últimas 20 mensagens
    if (memory.history.length > 20) {
      memory.history = memory.history.slice(-20);
    }

    memory.lastInteraction = new Date();
    this.memoryCache.set(phoneNumber, memory);

    // Salvar no banco
    await supabase.from('whatsapp_messages').insert([
      {
        phone_number: phoneNumber,
        content: userMessage,
        message_type: 'received',
        timestamp: new Date().toISOString(),
        metadata: { intent: intent.name, confidence: intent.confidence }
      },
      {
        phone_number: phoneNumber,
        content: aiResponse,
        message_type: 'sent',
        timestamp: new Date().toISOString(),
        metadata: { ai_generated: true, intent: intent.name }
      }
    ]);
  }

  private static async loadUserProfile(phoneNumber: string): Promise<any> {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    return data || { name: 'Usuário', preferences: {} };
  }

  private static calculateLoopCount(history: any[]): number {
    if (history.length < 4) return 0;
    
    let loopCount = 0;
    for (let i = history.length - 4; i >= 0; i -= 2) {
      if (i + 3 < history.length) {
        const msg1 = history[i].content.toLowerCase();
        const msg2 = history[i + 2].content.toLowerCase();
        if (this.calculateSimilarity(msg1, msg2) > 0.8) {
          loopCount++;
        }
      }
    }
    return loopCount;
  }

  private static calculateFrustrationLevel(history: any[]): number {
    const frustrationKeywords = ['não entendo', 'não funciona', 'erro', 'problema', 'frustrado', 'irritado'];
    let frustrationCount = 0;
    
    history.forEach(msg => {
      const content = msg.content.toLowerCase();
      frustrationKeywords.forEach(keyword => {
        if (content.includes(keyword)) frustrationCount++;
      });
    });
    
    return Math.min(frustrationCount / 10, 1.0);
  }

  private static calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    return intersection.length / Math.max(words1.length, words2.length);
  }
}

// Serviço de Personalização
class PersonalizationService {
  static async loadPersonalizationContext(phoneNumber: string): Promise<PersonalizationContext> {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    const { data: clinicData } = await supabase
      .from('contextualization_data')
      .select('*');

    return {
      patientProfile: {
        name: profile?.name || 'Usuário',
        preferences: profile?.preferences || {},
        history: []
      },
      clinicContext: this.organizeClinicData(clinicData || []),
      interactionStyle: profile?.interaction_style || 'formal'
    };
  }

  static generatePersonalizedMessage(
    response: string,
    personalization: PersonalizationContext,
    intent: string
  ): string {
    let personalizedResponse = response;

    // Adaptar baseado no estilo de interação
    if (personalization.interactionStyle === 'casual') {
      personalizedResponse = personalizedResponse.replace(/^Olá/, 'Oi');
      personalizedResponse = personalizedResponse.replace(/Obrigado/, 'Valeu');
    }

    // Adicionar nome do usuário se disponível
    if (personalization.patientProfile.name !== 'Usuário') {
      personalizedResponse = personalizedResponse.replace(/^Olá/, `Olá ${personalization.patientProfile.name}`);
    }

    return personalizedResponse;
  }

  static async generatePersonalizedSuggestions(
    personalization: PersonalizationContext,
    service?: string
  ): Promise<string[]> {
    const suggestions: string[] = [];
    
    if (service) {
      suggestions.push(`Posso te ajudar a agendar uma consulta de ${service}.`);
    }
    
    suggestions.push('Gostaria de saber mais sobre nossos horários de atendimento?');
    suggestions.push('Posso te mostrar os serviços disponíveis na nossa clínica.');
    
    return suggestions;
  }

  static adaptLanguageStyle(response: string, personalization: PersonalizationContext): string {
    if (personalization.interactionStyle === 'casual') {
      return response
        .replace(/Por favor/g, 'Pode ser')
        .replace(/Gostaria/g, 'Quer')
        .replace(/Posso ajudá-lo/g, 'Posso te ajudar');
    }
    
    return response;
  }

  private static organizeClinicData(data: any[]): Record<string, any> {
    const organized: Record<string, any> = {};
    
    data.forEach(item => {
      if (!organized[item.category]) {
        organized[item.category] = [];
      }
      organized[item.category].push({
        question: item.question,
        answer: item.answer
      });
    });
    
    return organized;
  }
}

// Serviço RAG Engine
class RAGEngineService {
  private static knowledgeBase: any[] = [];

  static async initializeKnowledgeBase(): Promise<void> {
    const { data } = await supabase
      .from('contextualization_data')
      .select('*')
      .order('order_number');

    this.knowledgeBase = data || [];
  }

  static async retrieve(context: RAGContext): Promise<RAGResponse> {
    if (this.knowledgeBase.length === 0) {
      await this.initializeKnowledgeBase();
    }

    const { query, intent, entities } = context;
    const relevantInfo = this.findRelevantInfo(query, intent, entities);
    
    const augmentedPrompt = this.buildAugmentedPrompt(query, relevantInfo);
    
    return {
      retrievedInfo: relevantInfo,
      augmentedPrompt,
      sources: relevantInfo.map(item => item.source || 'contextualization_data')
    };
  }

  private static findRelevantInfo(query: string, intent: string, entities: Record<string, any>): any[] {
    const relevant: any[] = [];
    const queryLower = query.toLowerCase();

    this.knowledgeBase.forEach(item => {
      let score = 0;
      
      // Busca por palavras-chave
      const questionLower = item.question.toLowerCase();
      const answerLower = item.answer.toLowerCase();
      
      if (questionLower.includes(queryLower) || answerLower.includes(queryLower)) {
        score += 2;
      }
      
      // Busca por categoria de intenção
      if (intent.includes('HOURS') && item.category === 'horarios') {
        score += 1;
      }
      if (intent.includes('LOCATION') && item.category === 'localizacao') {
        score += 1;
      }
      if (intent.includes('SERVICES') && item.category === 'servicos') {
        score += 1;
      }
      
      if (score > 0) {
        relevant.push({
          ...item,
          relevanceScore: score,
          source: 'contextualization_data'
        });
      }
    });

    return relevant.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3);
  }

  private static buildAugmentedPrompt(query: string, relevantInfo: any[]): string {
    let prompt = query;
    
    if (relevantInfo.length > 0) {
      prompt += '\n\nInformações relevantes da clínica:\n';
      relevantInfo.forEach(info => {
        prompt += `- ${info.question}: ${info.answer}\n`;
      });
    }
    
    return prompt;
  }
}

// Serviço Principal de IA Avançada para WhatsApp
export class AdvancedWhatsAppService {
  private static readonly SYSTEM_PROMPT = `Você é uma recepcionista virtual de uma clínica médica.
Sua personalidade é profissional, empática e prestativa.

DIRETRIZES FUNDAMENTAIS:
1. Use EXCLUSIVAMENTE as informações fornecidas no contexto da clínica
2. Seja sempre cordial, profissional e empática
3. Para agendamentos, oriente sobre o processo
4. Se não souber uma informação, diga educadamente que não possui essa informação
5. NUNCA invente informações ou dê conselhos médicos
6. Mantenha respostas concisas e objetivas (máximo 3 parágrafos)
7. Use emojis ocasionalmente para tornar a conversa mais amigável

Use as informações do contexto para responder de forma precisa e útil.`;

  static async processMessage(request: AdvancedMessageRequest): Promise<AdvancedMessageResponse> {
    try {
      console.log('🤖 Advanced WhatsApp Service processing:', request);

      // 1. Carregar memória da conversa
      const memory = await ConversationMemoryService.loadMemory(request.phoneNumber);
      const conversationHistory = memory.getRecentHistory(10);

      // 2. Carregar contexto de personalização
      const personalization = await PersonalizationService.loadPersonalizationContext(request.phoneNumber);

      // 3. Reconhecer intenção
      const intent = await IntentRecognitionService.recognizeIntent({
        message: request.message,
        conversationHistory,
        clinicContext: await this.getClinicContext(),
        userProfile: memory.userProfile
      });

      console.log('📊 Intent recognized:', intent);

      // 4. Verificar se precisa escalar para humano
      if (this.shouldEscalateToHuman(intent, memory)) {
        return {
          response: 'Entendi que você precisa de um atendimento mais personalizado. Vou transferir você para um de nossos atendentes. Por favor, aguarde um momento.',
          intent: intent.name,
          confidence: intent.confidence,
          escalateToHuman: true
        };
      }

      // 5. Executar busca RAG
      const ragResponse = await RAGEngineService.retrieve({
        query: request.message,
        intent: intent.name,
        entities: intent.entities
      });

      console.log('📚 RAG retrieval complete:', ragResponse.sources.length, 'sources');

      // 6. Preparar contexto para o LLM
      const systemPrompt = await this.prepareSystemPrompt(request.agentId);
      const messages = this.buildMessages(systemPrompt, conversationHistory, ragResponse.augmentedPrompt);

      // 7. Gerar resposta via LLM
      const { data, error } = await supabase.functions.invoke('ai-chat-gpt4', {
        body: { 
          messages,
          phoneNumber: request.phoneNumber,
          agentId: request.agentId,
          temperature: 0.7
        }
      });

      if (error) {
        console.error('Error calling AI service:', error);
        throw error;
      }

      let response = data?.response || 'Desculpe, não consegui processar sua mensagem.';

      // 8. Aplicar personalização na resposta
      response = PersonalizationService.generatePersonalizedMessage(
        response,
        personalization,
        intent.name
      );

      // 9. Adicionar sugestões personalizadas se apropriado
      if (intent.category === 'appointment' || intent.name === 'INFO_SERVICES') {
        const suggestions = await PersonalizationService.generatePersonalizedSuggestions(
          personalization,
          intent.entities.service
        );
        
        if (suggestions.length > 0) {
          response += '\n\n💡 ' + suggestions[0];
        }
      }

      // 10. Adaptar estilo de linguagem
      response = PersonalizationService.adaptLanguageStyle(response, personalization);

      // 11. Salvar na memória
      await ConversationMemoryService.saveInteraction(
        request.phoneNumber,
        request.message,
        response,
        intent
      );

      return {
        response,
        intent: intent.name,
        confidence: intent.confidence,
        metadata: {
          ragSources: ragResponse.sources,
          agentId: request.agentId,
          personalization: personalization.patientProfile.name
        }
      };

    } catch (error) {
      console.error('❌ Advanced WhatsApp Service error:', error);
      return {
        response: 'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em alguns instantes ou entre em contato pelo telefone.',
        intent: 'ERROR',
        confidence: 0,
        metadata: { error: error.message }
      };
    }
  }

  private static async prepareSystemPrompt(agentId?: string): Promise<string> {
    let prompt = this.SYSTEM_PROMPT;

    // Se há um agente específico, carregar seu contexto
    if (agentId) {
      const { data: agent } = await supabase
        .from('agents')
        .select('name, description, personality, context_json')
        .eq('id', agentId)
        .single();

      if (agent) {
        prompt = prompt.replace('recepcionista virtual', `recepcionista virtual ${agent.name}`);
        if (agent.personality) {
          prompt = prompt.replace('profissional, empática e prestativa', agent.personality);
        }
        if (agent.context_json) {
          try {
            const context = JSON.parse(agent.context_json);
            prompt += `\n\nContexto específico do agente:\n${JSON.stringify(context, null, 2)}`;
          } catch (e) {
            console.error('Erro ao fazer parse do contexto do agente:', e);
          }
        }
      }
    }

    return prompt;
  }

  private static buildMessages(systemPrompt: string, history: any[], augmentedPrompt: string) {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Adicionar histórico relevante (últimas 6 mensagens)
    history.slice(-6).forEach(h => {
      messages.push({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      });
    });

    // Adicionar prompt aumentado com contexto RAG
    messages.push({
      role: 'user',
      content: augmentedPrompt
    });

    return messages;
  }

  private static async getClinicContext(): Promise<Record<string, any>> {
    const { data } = await supabase
      .from('contextualization_data')
      .select('category, question, answer')
      .order('order_number');

    const context: Record<string, any> = {};
    
    data?.forEach(item => {
      if (!context[item.category]) {
        context[item.category] = [];
      }
      context[item.category].push({
        question: item.question,
        answer: item.answer
      });
    });

    return context;
  }

  private static shouldEscalateToHuman(intent: Intent, memory: ConversationMemory): boolean {
    // Critérios para escalar
    if (intent.name === 'HUMAN_HANDOFF') return true;
    if (intent.confidence < 0.3) return true;
    if (memory.loopCount > 3) return true;
    if (memory.frustrationLevel > 0.7) return true;
    
    return false;
  }
} 