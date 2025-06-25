
interface ConversationState {
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

export class ConversationStateManager {
  private static states = new Map<string, ConversationState>();

  // Salvar estado no banco de dados para persistência real
  static async saveStateToDB(phoneNumber: string, state: ConversationState, supabase: any) {
    try {
      await supabase
        .from('whatsapp_conversation_memory')
        .upsert({
          phone_number: phoneNumber,
          memory_data: state
        });
      console.log(`💾 Estado salvo no banco para ${phoneNumber}`);
    } catch (error) {
      console.error('❌ Erro ao salvar estado no banco:', error);
    }
  }

  // Carregar estado do banco de dados
  static async loadStateFromDB(phoneNumber: string, supabase: any): Promise<ConversationState | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversation_memory')
        .select('memory_data')
        .eq('phone_number', phoneNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erro ao carregar estado do banco:', error);
        return null;
      }

      if (data?.memory_data) {
        console.log(`📂 Estado carregado do banco para ${phoneNumber}`);
        return data.memory_data as ConversationState;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar estado:', error);
    }
    return null;
  }

  static async getState(phoneNumber: string, supabase?: any): Promise<ConversationState> {
    // Primeiro, tentar carregar do cache em memória
    let existing = this.states.get(phoneNumber);
    
    // Se não existe no cache ou expirou, tentar carregar do banco
    if (!existing || (Date.now() - existing.lastActivity > 30 * 60 * 1000)) {
      if (supabase) {
        const dbState = await this.loadStateFromDB(phoneNumber, supabase);
        if (dbState && (Date.now() - dbState.lastActivity < 30 * 60 * 1000)) {
          this.states.set(phoneNumber, dbState);
          console.log(`🔄 Estado restaurado do banco para ${phoneNumber}`);
          return dbState;
        }
      }
    }

    // Se ainda existe no cache e não expirou, usar ele
    if (existing && (Date.now() - existing.lastActivity < 30 * 60 * 1000)) {
      return existing;
    }

    // Criar novo estado
    const newState: ConversationState = {
      phoneNumber,
      currentState: 'initial',
      lastActivity: Date.now(),
      attempts: 0,
      conversationStarted: false,
      messageCount: 0
    };
    
    this.states.set(phoneNumber, newState);
    console.log(`🆕 Novo estado criado para ${phoneNumber}`);
    return newState;
  }

  static async updateState(phoneNumber: string, updates: Partial<ConversationState>, supabase?: any): Promise<ConversationState> {
    const current = await this.getState(phoneNumber, supabase);
    const updated = {
      ...current,
      ...updates,
      lastActivity: Date.now(),
      messageCount: current.messageCount + 1
    };
    
    this.states.set(phoneNumber, updated);
    
    // Salvar no banco se disponível
    if (supabase) {
      await this.saveStateToDB(phoneNumber, updated, supabase);
    }
    
    console.log(`🔄 Estado atualizado para ${phoneNumber}:`, JSON.stringify({
      currentState: updated.currentState,
      conversationStarted: updated.conversationStarted,
      messageCount: updated.messageCount,
      selectedService: updated.selectedService,
      selectedTime: updated.selectedTime
    }, null, 2));
    
    return updated;
  }

  static clearState(phoneNumber: string) {
    this.states.delete(phoneNumber);
    console.log(`🗑️ Estado limpo para ${phoneNumber}`);
  }

  static analyzeUserInput(message: string): {
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
  } {
    const lowerMessage = message.toLowerCase().trim();
    
    // Detectar saudações (mais flexível)
    const greetingPatterns = ['oi', 'olá', 'ola', 'hello', 'hi', 'bom dia', 'boa tarde', 'boa noite'];
    const isGreeting = greetingPatterns.some(greeting => lowerMessage.includes(greeting));
    
    // Detectar solicitação de agendamento (mais flexível)
    const appointmentPatterns = ['agendar', 'agendamento', 'consulta', 'marcar', 'horário', 'hora', 'médico', 'doutor'];
    const isAppointmentRequest = appointmentPatterns.some(pattern => lowerMessage.includes(pattern));
    
    // Detectar seleção de especialidade (melhorado)
    const specialties = {
      'ortopedia': 'Ortopedia',
      'ortopedista': 'Ortopedia', 
      'osso': 'Ortopedia',
      'cardiologia': 'Cardiologia',
      'cardio': 'Cardiologia',
      'cardiologista': 'Cardiologia',
      'coração': 'Cardiologia',
      'psicologia': 'Psicologia',
      'psico': 'Psicologia',
      'psicologo': 'Psicologia',
      'psicóloga': 'Psicologia',
      'dermatologia': 'Dermatologia',
      'derma': 'Dermatologia',
      'dermatologista': 'Dermatologia',
      'pele': 'Dermatologia',
      'ginecologia': 'Ginecologia',
      'gineco': 'Ginecologia',
      'ginecologista': 'Ginecologia',
      'pediatria': 'Pediatria',
      'pediatr': 'Pediatria',
      'pediatra': 'Pediatria',
      'criança': 'Pediatria',
      'clínica geral': 'Clínica Geral',
      'clinica geral': 'Clínica Geral',
      'geral': 'Clínica Geral',
      'clínico geral': 'Clínica Geral'
    };
    
    let extractedSpecialty = '';
    for (const [key, value] of Object.entries(specialties)) {
      if (lowerMessage.includes(key)) {
        extractedSpecialty = value;
        break;
      }
    }
    
    // Detectar seleção de horário (muito mais flexível)
    const timePatterns = [
      /(?:às?\s*)?(\d{1,2})(?:h|:00|:\d{2})?(?:\s*(?:da\s*)?(?:manhã|tarde))?/i,
      /(\d{1,2}):(\d{2})/,
      /(\d{1,2})\s*horas?/i,
      /(\d{1,2})\s*da\s*(manhã|tarde)/i
    ];
    
    let extractedTime = '';
    for (const pattern of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        const hour = parseInt(match[1]);
        if (hour >= 8 && hour <= 18) {
          extractedTime = `${hour.toString().padStart(2, '0')}:00`;
          break;
        }
      }
    }

    // Detectar data (mais flexível)
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/,
      /dia\s+(\d{1,2})\/(\d{1,2})/i,
      /(\d{1,2})\s+de\s+(\w+)/i,
      /amanhã|amanha/i,
      /hoje/i,
      /depois\s+de\s+amanhã/i
    ];
    
    let extractedDate = '';
    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        if (pattern.source.includes('amanhã') || pattern.source.includes('amanha')) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          extractedDate = tomorrow.toLocaleDateString('pt-BR');
        } else if (pattern.source.includes('hoje')) {
          extractedDate = new Date().toLocaleDateString('pt-BR');
        } else {
          extractedDate = match[0];
        }
        break;
      }
    }

    // Detectar confirmação (mais amplo)
    const confirmationWords = ['sim', 'confirmar', 'confirmo', 'ok', 'certo', 'perfeito', 'pode ser', 'tá bom', 'beleza', 'fechado'];
    const isConfirmation = confirmationWords.some(word => lowerMessage.includes(word));

    // Detectar email
    const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const extractedEmail = emailMatch ? emailMatch[1] : undefined;

    // Detectar nome (melhorado)
    const namePatterns = [
      /(?:nome|sou|me chamo|eu sou)\s+([A-Za-zÀ-ÿ\s]+)/i,
      /^([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)+)$/
    ];
    
    let extractedName = undefined;
    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match) {
        extractedName = match[1].trim();
        break;
      }
    }

    return {
      isTimeSelection: !!extractedTime,
      isConfirmation,
      isSpecialtySelection: !!extractedSpecialty,
      isGreeting,
      isAppointmentRequest,
      extractedTime,
      extractedDate,
      extractedEmail,
      extractedName,
      extractedSpecialty
    };
  }
}
