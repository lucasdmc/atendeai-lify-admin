import { ConversationStateManager } from './conversation-state-manager.ts';
import { MCPToolsProcessor } from './mcp-tools.ts';

export class SmartConversationHandler {
  static async processMessage(
    phoneNumber: string, 
    message: string, 
    supabase: any
  ): Promise<string> {
    console.log(`🧠 Smart Conversation Handler - Processing: ${message}`);
    
    const state = ConversationStateManager.getState(phoneNumber);
    const userInput = ConversationStateManager.analyzeUserInput(message);
    
    console.log(`📊 Current state: ${state.currentState}, Started: ${state.conversationStarted}`);
    console.log(`🔍 User input analysis:`, userInput);

    const lowerMessage = message.toLowerCase().trim();

    // Primeira saudação - estabelecer conversa
    if (!state.conversationStarted && this.isGreeting(lowerMessage)) {
      console.log('👋 Primeira saudação detectada');
      ConversationStateManager.updateState(phoneNumber, { 
        conversationStarted: true,
        currentState: 'initial'
      });
      return this.getGreetingResponse();
    }

    // Se já cumprimentou e usuário quer agendar
    if (state.conversationStarted && this.isAppointmentRequest(lowerMessage)) {
      console.log('📅 Solicitação de agendamento detectada');
      ConversationStateManager.updateState(phoneNumber, { 
        currentState: 'service_selection'
      });
      return this.getServiceSelectionResponse();
    }

    // Seleção de especialidade
    if (userInput.isSpecialtySelection && userInput.extractedSpecialty) {
      console.log(`👨‍⚕️ Especialidade selecionada: ${userInput.extractedSpecialty}`);
      ConversationStateManager.updateState(phoneNumber, { 
        currentState: 'time_selection',
        selectedService: userInput.extractedSpecialty
      });
      return this.getTimeSelectionResponse(userInput.extractedSpecialty, userInput.extractedDate);
    }

    // Estado de seleção de especialidade - aguardando resposta
    if (state.currentState === 'service_selection') {
      console.log('⏳ Aguardando seleção de especialidade');
      const specialty = this.detectSpecialtyFromMessage(lowerMessage);
      if (specialty) {
        ConversationStateManager.updateState(phoneNumber, { 
          currentState: 'time_selection',
          selectedService: specialty
        });
        return this.getTimeSelectionResponse(specialty);
      }
      return this.getSpecialtyHelpResponse();
    }

    // Estado de seleção de horário
    if (state.currentState === 'time_selection') {
      console.log('⏰ Estado de seleção de horário');
      return await this.handleTimeSelection(phoneNumber, message, userInput, supabase);
    }

    // Estado de coleta de informações de contato
    if (state.currentState === 'contact_info') {
      console.log('📝 Estado de coleta de dados');
      return this.handleContactInfo(phoneNumber, message, userInput);
    }

    // Estado de confirmação final
    if (state.currentState === 'confirmation') {
      console.log('✅ Estado de confirmação');
      return await this.handleFinalConfirmation(phoneNumber, message, userInput, supabase);
    }

    // Fallback - não entendeu
    console.log('❓ Mensagem não compreendida');
    return this.getHelpResponse(state);
  }

  private static isGreeting(message: string): boolean {
    const greetings = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'hello'];
    return greetings.some(greeting => message.includes(greeting));
  }

  private static isAppointmentRequest(message: string): boolean {
    const keywords = ['agendar', 'agendamento', 'consulta', 'marcar', 'horário', 'médico', 'doutor'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private static detectSpecialtyFromMessage(message: string): string | null {
    const specialties = {
      'ortopedia': 'Ortopedia',
      'ortop': 'Ortopedia',
      'cardiologia': 'Cardiologia', 
      'cardio': 'Cardiologia',
      'psicologia': 'Psicologia',
      'psico': 'Psicologia',
      'dermatologia': 'Dermatologia',
      'derma': 'Dermatologia',
      'ginecologia': 'Ginecologia',
      'gineco': 'Ginecologia',
      'pediatria': 'Pediatria',
      'geral': 'Clínica Geral'
    };
    
    for (const [key, value] of Object.entries(specialties)) {
      if (message.includes(key)) {
        return value;
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

  private static async handleTimeSelection(
    phoneNumber: string, 
    message: string, 
    userInput: any, 
    supabase: any
  ): Promise<string> {
    const state = ConversationStateManager.getState(phoneNumber);
    
    // Se detectou horário e/ou data
    if (userInput.extractedTime || userInput.extractedDate) {
      let selectedDate = userInput.extractedDate;
      let selectedTime = userInput.extractedTime;
      
      // Se não tem data, usar próximo dia útil
      if (!selectedDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        selectedDate = tomorrow.toLocaleDateString('pt-BR');
      }
      
      // Se não tem horário, tentar extrair do contexto ou pedir
      if (!selectedTime) {
        const timeFromMessage = this.extractTimeFromMessage(message);
        if (timeFromMessage) {
          selectedTime = timeFromMessage;
        } else {
          return `Entendi a data! Qual horário você prefere? 😊

📅 **Horários disponíveis:**
**Manhã:** 8h, 9h, 10h, 11h  
**Tarde:** 14h, 15h, 16h, 17h

Me diga o horário desejado! 💙`;
        }
      }
      
      ConversationStateManager.updateState(phoneNumber, { 
        currentState: 'contact_info',
        selectedTime,
        selectedDate
      });

      return `Perfeito! 😊

📋 **Resumo do agendamento:**
👨‍⚕️ **${state.selectedService}**
📅 **${selectedDate}** às **${selectedTime.replace(':00', 'h')}**

Para finalizar, preciso do seu nome completo e email.

Pode me enviar assim:
**Nome:** Seu Nome Completo
**Email:** seuemail@exemplo.com 💙`;
    }

    // Não conseguiu extrair horário/data
    return `Qual horário funciona melhor para você? 😊

📅 **Horários disponíveis:**
**Manhã:** 8h, 9h, 10h, 11h
**Tarde:** 14h, 15h, 16h, 17h

Pode dizer "10h" ou "às 14h" 💙`;
  }

  private static extractTimeFromMessage(message: string): string | null {
    // Extrair horários de formatos diversos
    const timePatterns = [
      /(\d{1,2}):?(\d{2})/,
      /(\d{1,2})\s*h/,
      /às?\s*(\d{1,2})/i
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

  private static handleContactInfo(phoneNumber: string, message: string, userInput: any): string {
    const state = ConversationStateManager.getState(phoneNumber);
    
    // Extrair nome e email da mensagem
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
      
      // Se ainda não encontrou, tentar extrair do texto completo
      if (!customerName && !message.includes('@')) {
        const words = message.split(' ');
        if (words.length >= 2) {
          customerName = words.join(' ').trim();
        }
      }
    }

    if (customerName && customerEmail) {
      ConversationStateManager.updateState(phoneNumber, { 
        currentState: 'confirmation',
        customerName,
        customerEmail
      });

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

    const state = ConversationStateManager.getState(phoneNumber);
    
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

  private static getHelpResponse(state: any): string {
    if (!state.conversationStarted) {
      return `Oi! 😊 Sou a Lia!
Como posso te ajudar hoje? 💙

Posso te ajudar com agendamentos de consultas!`;
    }
    
    return `Não entendi muito bem! 😅
Posso te ajudar com agendamentos de consultas.
Me diga a especialidade que você precisa! 💙`;
  }
}
