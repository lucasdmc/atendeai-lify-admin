
import { ConversationStateManager } from './conversation-state-manager.ts';
import { MCPToolsProcessor } from './mcp-tools.ts';

export class SmartConversationHandler {
  static async processMessage(
    phoneNumber: string, 
    message: string, 
    supabase: any
  ): Promise<string> {
    console.log(`🧠 Smart Conversation Handler - Processing: ${message}`);
    
    const state = await ConversationStateManager.getState(phoneNumber, supabase);
    const userInput = ConversationStateManager.analyzeUserInput(message);
    
    console.log(`📊 Current state: ${state.currentState}, Started: ${state.conversationStarted}, Messages: ${state.messageCount}`);
    console.log(`🔍 User input analysis:`, userInput);

    const lowerMessage = message.toLowerCase().trim();

    // PRIMEIRA PRIORIDADE: Detectar se é primeira saudação real
    if (!state.conversationStarted && userInput.isGreeting && state.messageCount === 0) {
      console.log('👋 Primeira saudação detectada');
      await ConversationStateManager.updateState(phoneNumber, { 
        conversationStarted: true,
        currentState: 'initial'
      }, supabase);
      return this.getGreetingResponse();
    }

    // SEGUNDA PRIORIDADE: Se já cumprimentou e usuário quer agendar OU detectou specialty OU appointment request
    if (state.conversationStarted && (
      userInput.isAppointmentRequest || 
      userInput.isSpecialtySelection ||
      this.isAppointmentRequest(lowerMessage)
    )) {
      console.log('📅 Solicitação de agendamento detectada');
      
      // Se já tem especialidade na mensagem, pular para seleção de horário
      if (userInput.isSpecialtySelection && userInput.extractedSpecialty) {
        console.log(`👨‍⚕️ Especialidade detectada na mensagem: ${userInput.extractedSpecialty}`);
        await ConversationStateManager.updateState(phoneNumber, { 
          currentState: 'time_selection',
          selectedService: userInput.extractedSpecialty
        }, supabase);
        return this.getTimeSelectionResponse(userInput.extractedSpecialty, userInput.extractedDate);
      }
      
      // Senão, ir para seleção de especialidade
      await ConversationStateManager.updateState(phoneNumber, { 
        currentState: 'service_selection'
      }, supabase);
      return this.getServiceSelectionResponse();
    }

    // TERCEIRA PRIORIDADE: Fluxo baseado no estado atual
    switch (state.currentState) {
      case 'service_selection':
        return await this.handleServiceSelection(phoneNumber, message, userInput, supabase);
      
      case 'time_selection':
        return await this.handleTimeSelection(phoneNumber, message, userInput, supabase);
      
      case 'contact_info':
        return await this.handleContactInfo(phoneNumber, message, userInput, supabase);
      
      case 'confirmation':
        return await this.handleFinalConfirmation(phoneNumber, message, userInput, supabase);
      
      default:
        // Estado inicial - resposta contextual
        if (state.conversationStarted) {
          console.log('💭 Conversa já iniciada, fornecendo orientação contextual');
          return this.getContextualHelp(message);
        } else {
          console.log('👋 Primeira interação, iniciando conversa');
          await ConversationStateManager.updateState(phoneNumber, { 
            conversationStarted: true
          }, supabase);
          return this.getGreetingResponse();
        }
    }
  }

  private static async handleServiceSelection(
    phoneNumber: string, 
    message: string, 
    userInput: any, 
    supabase: any
  ): Promise<string> {
    console.log('⏳ Aguardando seleção de especialidade');
    
    if (userInput.isSpecialtySelection && userInput.extractedSpecialty) {
      await ConversationStateManager.updateState(phoneNumber, { 
        currentState: 'time_selection',
        selectedService: userInput.extractedSpecialty
      }, supabase);
      return this.getTimeSelectionResponse(userInput.extractedSpecialty, userInput.extractedDate);
    }
    
    const specialty = this.detectSpecialtyFromMessage(message.toLowerCase());
    if (specialty) {
      await ConversationStateManager.updateState(phoneNumber, { 
        currentState: 'time_selection',
        selectedService: specialty
      }, supabase);
      return this.getTimeSelectionResponse(specialty);
    }
    
    return this.getSpecialtyHelpResponse();
  }

  private static async handleTimeSelection(
    phoneNumber: string, 
    message: string, 
    userInput: any, 
    supabase: any
  ): Promise<string> {
    console.log('⏰ Estado de seleção de horário');
    const state = await ConversationStateManager.getState(phoneNumber, supabase);
    
    let selectedDate = userInput.extractedDate;
    let selectedTime = userInput.extractedTime;
    
    // Se não tem data, verificar se mencionou "amanhã" ou usar próximo dia útil
    if (!selectedDate) {
      if (message.toLowerCase().includes('amanha') || message.toLowerCase().includes('amanhã')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        selectedDate = tomorrow.toLocaleDateString('pt-BR');
      } else if (state.selectedDate) {
        selectedDate = state.selectedDate; // Usar data já selecionada anteriormente
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        selectedDate = tomorrow.toLocaleDateString('pt-BR');
      }
    }
    
    // Se não tem horário, tentar extrair do contexto
    if (!selectedTime) {
      selectedTime = this.extractTimeFromMessage(message);
    }
    
    // Se tem horário mas não data, usar amanhã
    if (selectedTime && !userInput.extractedDate && !state.selectedDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      selectedDate = tomorrow.toLocaleDateString('pt-BR');
    }
    
    if (selectedTime) {
      console.log(`✅ Horário e data selecionados: ${selectedDate} às ${selectedTime}`);
      await ConversationStateManager.updateState(phoneNumber, { 
        currentState: 'contact_info',
        selectedTime,
        selectedDate
      }, supabase);

      return `Perfeito! 😊

📋 **Resumo do agendamento:**
👨‍⚕️ **${state.selectedService}**
📅 **${selectedDate}** às **${selectedTime.replace(':00', 'h')}**

Para finalizar, preciso do seu nome completo e email.

Pode me enviar assim:
**Nome:** Seu Nome Completo
**Email:** seuemail@exemplo.com 💙`;
    }

    // Não conseguiu extrair horário
    return `Qual horário funciona melhor para você? 😊

📅 **Horários disponíveis:**
**Manhã:** 8h, 9h, 10h, 11h
**Tarde:** 14h, 15h, 16h, 17h

Pode dizer "10h", "às 14h", "amanhã às 10h" 💙`;
  }

  private static async handleContactInfo(
    phoneNumber: string, 
    message: string, 
    userInput: any, 
    supabase: any
  ): Promise<string> {
    const state = await ConversationStateManager.getState(phoneNumber, supabase);
    
    let customerName = userInput.extractedName;
    let customerEmail = userInput.extractedEmail;
    
    // Tentar extrair de formatos alternativos
    if (!customerName || !customerEmail) {
      const lines = message.split('\n');
      for (const line of lines) {
        if (!customerName && line.toLowerCase().includes('nome')) {
          customerName = line.replace(/nome:?/gi, '').trim();
        }
        if (!customerEmail && line.includes('@')) {
          const emailMatch = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          if (emailMatch) customerEmail = emailMatch[1];
        }
      }
      
      // Se ainda não encontrou nome e não tem email, assumir que é o nome
      if (!customerName && !message.includes('@')) {
        const words = message.split(' ');
        if (words.length >= 2 && words.every(word => /^[A-Za-zÀ-ÿ]+$/.test(word))) {
          customerName = message.trim();
        }
      }
    }

    if (customerName && customerEmail) {
      await ConversationStateManager.updateState(phoneNumber, { 
        currentState: 'confirmation',
        customerName,
        customerEmail
      }, supabase);

      const timeFormatted = state.selectedTime?.replace(':00', 'h');

      return `Quase pronto! 😊

📋 **Confirme seus dados:**
👤 **${customerName}**
📧 **${customerEmail}**
👨‍⚕️ **${state.selectedService}**
📅 **${state.selectedDate}** às **${timeFormatted}**

Está tudo certo? Digite **SIM** para confirmar! 💙`;
    }

    return `Preciso do seu nome e email para finalizar! 😊

Por favor, me envie assim:
**Nome:** Seu Nome Completo  
**Email:** seuemail@exemplo.com

Ou pode enviar em linhas separadas! 💙`;
  }

  private static async handleFinalConfirmation(
    phoneNumber: string, 
    message: string, 
    userInput: any, 
    supabase: any
  ): Promise<string> {
    const lowerMessage = message.toLowerCase();
    
    if (!userInput.isConfirmation && !lowerMessage.includes('sim')) {
      return `Para confirmar seu agendamento, digite **SIM** 😊
Ou me diga se quer alterar alguma informação! 💙`;
    }

    const state = await ConversationStateManager.getState(phoneNumber, supabase);
    
    try {
      // Criar agendamento real usando MCP
      const result = await MCPToolsProcessor.scheduleAppointment({
        specialty: state.selectedService,
        date: state.selectedDate,
        time: state.selectedTime,
        customerName: state.customerName,
        customerEmail: state.customerEmail
      }, supabase);

      // Limpar estado após sucesso
      ConversationStateManager.clearState(phoneNumber);

      const timeFormatted = state.selectedTime?.replace(':00', 'h');

      return `✅ **Agendamento confirmado com sucesso!**

👤 **${state.customerName}**
📧 **${state.customerEmail}**
👨‍⚕️ **${state.selectedService}**
📅 **${state.selectedDate}** às **${timeFormatted}**
📍 **Clínica**

Você receberá uma confirmação por email! 
Se precisar reagendar, é só me avisar! 😊💙`;

    } catch (error) {
      console.error('❌ Erro ao criar agendamento:', error);
      
      return `Anotei seu agendamento! 😊

📋 **${state.selectedService}** - **${state.selectedDate}** às **${state.selectedTime}**

Nossa equipe vai entrar em contato para confirmar todos os detalhes em breve! 💙`;
    }
  }

  private static isGreeting(message: string): boolean {
    const greetings = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'hello'];
    return greetings.some(greeting => message.includes(greeting));
  }

  private static isAppointmentRequest(message: string): boolean {
    const keywords = ['agendar', 'agendamento', 'consulta', 'marcar', 'horário', 'médico', 'doutor', 'hora'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private static detectSpecialtyFromMessage(message: string): string | null {
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
      'geral': 'Clínica Geral',
      'clínica geral': 'Clínica Geral',
      'clinica geral': 'Clínica Geral'
    };
    
    for (const [key, value] of Object.entries(specialties)) {
      if (message.includes(key)) {
        return value;
      }
    }
    return null;
  }

  private static extractTimeFromMessage(message: string): string | null {
    const timePatterns = [
      /(\d{1,2}):?(\d{2})/,
      /(\d{1,2})\s*h/,
      /às?\s*(\d{1,2})/i,
      /(\d{1,2})\s*da\s*(manhã|tarde)/i
    ];
    
    for (const pattern of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        const hour = parseInt(match[1]);
        if (hour >= 8 && hour <= 18) {
          return `${hour.toString().padStart(2, '0')}:00`;
        }
      }
    }
    return null;
  }

  private static getGreetingResponse(): string {
    return `Oi! 😊 Sou a Lia, assistente aqui da clínica!
Como posso te ajudar hoje? 💙`;
  }

  private static getServiceSelectionResponse(): string {
    return `Perfeito! Para qual especialidade você gostaria de agendar? 😊

🩺 **Clínica Geral**
❤️ **Cardiologia** 
🧠 **Psicologia**
🌟 **Dermatologia**
👩‍⚕️ **Ginecologia**
🦴 **Ortopedia**
👶 **Pediatria**

É só me dizer qual você precisa! 💙`;
  }

  private static getTimeSelectionResponse(specialty: string, date?: string): string {
    const dateText = date ? ` para ${date}` : ' nos próximos dias';
    
    return `Excelente! ${specialty} anotada! 😊

Que dia e horário seria melhor para você${dateText}?

📅 **Horários disponíveis:**
**Manhã:** 8h, 9h, 10h, 11h
**Tarde:** 14h, 15h, 16h, 17h

Pode me dizer algo como "amanhã às 10h" ou "26/06 às 14h"! 💙`;
  }

  private static getSpecialtyHelpResponse(): string {
    return `Me ajuda a entender! Qual dessas especialidades você precisa? 😊

🩺 Clínica Geral
❤️ Cardiologia
🧠 Psicologia
🌟 Dermatologia
👩‍⚕️ Ginecologia
🦴 Ortopedia
👶 Pediatria

É só falar o nome da especialidade! 💙`;
  }

  private static getContextualHelp(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('ajuda') || lowerMessage.includes('help')) {
      return `Claro! Posso te ajudar com agendamentos de consulta! 😊

É só me dizer:
📅 **A especialidade** que você precisa
⏰ **A data e horário** de sua preferência

Exemplo: "Quero agendar cardiologia para amanhã às 10h"

O que você gostaria de agendar? 💙`;
    }
    
    return `Entendi! Posso te ajudar com agendamentos de consulta! 😊

Me diga qual especialidade você precisa e para quando? 💙`;
  }
}
