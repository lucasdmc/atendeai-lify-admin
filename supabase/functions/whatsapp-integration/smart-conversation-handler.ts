
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
    
    console.log(`📊 Current state: ${state.currentState}`);
    console.log(`🔍 User input analysis:`, userInput);

    const lowerMessage = message.toLowerCase().trim();

    // Estado inicial - primeira interação ou saudação
    if (state.currentState === 'initial' || this.isGreeting(lowerMessage)) {
      return this.handleInitialContact(phoneNumber, message);
    }

    // Detectar pedido de agendamento
    if (this.isAppointmentRequest(lowerMessage) && !state.selectedService) {
      return this.handleServiceRequest(phoneNumber, message);
    }

    // Estado de seleção de especialidade
    if (state.currentState === 'service_selection' || (!state.selectedService && this.hasSpecialtyMention(lowerMessage))) {
      return this.handleServiceSelection(phoneNumber, message);
    }

    // Estado de seleção de horário
    if (state.currentState === 'time_selection' || (state.selectedService && userInput.isTimeSelection)) {
      return await this.handleTimeSelection(phoneNumber, message, userInput, supabase);
    }

    // Estado de coleta de informações de contato
    if (state.currentState === 'contact_info') {
      return this.handleContactInfo(phoneNumber, message, userInput);
    }

    // Estado de confirmação final
    if (state.currentState === 'confirmation') {
      return await this.handleFinalConfirmation(phoneNumber, message, userInput, supabase);
    }

    // Fallback para mensagens não compreendidas
    return this.handleUnknownInput(phoneNumber, message);
  }

  private static isGreeting(message: string): boolean {
    const greetings = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'hello'];
    return greetings.some(greeting => message.includes(greeting));
  }

  private static isAppointmentRequest(message: string): boolean {
    const keywords = ['agendar', 'agendamento', 'consulta', 'marcar', 'horário', 'médico', 'doutor'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private static hasSpecialtyMention(message: string): boolean {
    const specialties = ['cardiologia', 'cardio', 'psicologia', 'psico', 'dermatologia', 'derma', 'ginecologia', 'gineco'];
    return specialties.some(specialty => message.includes(specialty));
  }

  private static handleInitialContact(phoneNumber: string, message: string): string {
    ConversationStateManager.updateState(phoneNumber, { 
      currentState: 'initial',
      attempts: 0 
    });

    if (this.isAppointmentRequest(message.toLowerCase())) {
      return this.handleServiceRequest(phoneNumber, message);
    }

    const greetings = [
      "Oi! 😊 Sou a Lia, assistente aqui da clínica!\nComo posso te ajudar hoje? 💙",
      "Olá! Que bom falar com você! 😊\nSou a Lia da clínica. Em que posso ajudar? 💙",
      "Oi! Seja bem-vindo(a)! 😊\nEu sou a Lia. Como posso te ajudar? 💙"
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private static handleServiceRequest(phoneNumber: string, message: string): string {
    const lowerMessage = message.toLowerCase();
    let selectedService = '';

    // Detectar especialidade na mensagem
    if (lowerMessage.includes('cardio')) selectedService = 'Cardiologia';
    else if (lowerMessage.includes('psico')) selectedService = 'Psicologia';
    else if (lowerMessage.includes('derma')) selectedService = 'Dermatologia';
    else if (lowerMessage.includes('gineco')) selectedService = 'Ginecologia';
    else if (lowerMessage.includes('ortop')) selectedService = 'Ortopedia';
    else if (lowerMessage.includes('pediatr')) selectedService = 'Pediatria';
    else if (lowerMessage.includes('geral') || lowerMessage.includes('clínic')) selectedService = 'Clínica Geral';

    if (selectedService) {
      ConversationStateManager.updateState(phoneNumber, { 
        currentState: 'time_selection',
        selectedService,
        attempts: 0
      });

      return `Perfeito! ${selectedService} é uma ótima escolha! 😊

Para quando você gostaria de agendar?
📅 Tenho disponibilidade nos próximos dias nos horários:

**Manhã:** 08h, 09h, 10h, 11h
**Tarde:** 14h, 15h, 16h, 17h

Qual horário funciona melhor para você? 💙`;
    }

    ConversationStateManager.updateState(phoneNumber, { 
      currentState: 'service_selection',
      attempts: 0 
    });

    return `Entendi que você precisa agendar uma consulta! 😊

Para qual especialidade você gostaria de agendar?

🩺 **Clínica Geral**
❤️ **Cardiologia** 
🧠 **Psicologia**
🌟 **Dermatologia**
👩‍⚕️ **Ginecologia**
🦴 **Ortopedia**
👶 **Pediatria**

É só me dizer qual você precisa! 💙`;
  }

  private static handleServiceSelection(phoneNumber: string, message: string): string {
    const lowerMessage = message.toLowerCase();
    let selectedService = '';

    if (lowerMessage.includes('cardio') || lowerMessage.includes('coração')) selectedService = 'Cardiologia';
    else if (lowerMessage.includes('psico') || lowerMessage.includes('mental')) selectedService = 'Psicologia';
    else if (lowerMessage.includes('derma') || lowerMessage.includes('pele')) selectedService = 'Dermatologia';
    else if (lowerMessage.includes('gineco') || lowerMessage.includes('mulher')) selectedService = 'Ginecologia';
    else if (lowerMessage.includes('ortop') || lowerMessage.includes('osso')) selectedService = 'Ortopedia';
    else if (lowerMessage.includes('pediatr') || lowerMessage.includes('criança')) selectedService = 'Pediatria';
    else if (lowerMessage.includes('geral') || lowerMessage.includes('clínic')) selectedService = 'Clínica Geral';

    if (!selectedService) {
      const state = ConversationStateManager.getState(phoneNumber);
      ConversationStateManager.updateState(phoneNumber, { attempts: state.attempts + 1 });
      
      if (state.attempts >= 2) {
        return `Vou te ajudar! 😊 Me diga por exemplo:
"Preciso de cardiologia" ou "Quero psicologia"

Qual dessas especialidades você precisa? 💙`;
      }
      
      return `Me ajuda a entender melhor! Qual especialidade você está procurando?
Por exemplo: cardiologia, psicologia, dermatologia... 😊💙`;
    }

    ConversationStateManager.updateState(phoneNumber, { 
      currentState: 'time_selection',
      selectedService,
      attempts: 0
    });

    return `Excelente! ${selectedService} anotada! 😊

Agora me diga: que dia e horário seria melhor para você?

📅 **Horários disponíveis:**
**Manhã:** 8h, 9h, 10h, 11h
**Tarde:** 14h, 15h, 16h, 17h

Pode me dizer algo como "amanhã às 10h" ou "sexta 14h"! 💙`;
  }

  private static async handleTimeSelection(
    phoneNumber: string, 
    message: string, 
    userInput: any, 
    supabase: any
  ): Promise<string> {
    const state = ConversationStateManager.getState(phoneNumber);
    
    if (userInput.extractedTime) {
      // Calcular data (próximo dia útil se não especificado)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const selectedDate = tomorrow.toISOString().split('T')[0];
      
      ConversationStateManager.updateState(phoneNumber, { 
        currentState: 'contact_info',
        selectedTime: userInput.extractedTime,
        selectedDate,
        attempts: 0
      });

      const timeFormatted = userInput.extractedTime.replace(':00', 'h');
      const dateFormatted = tomorrow.toLocaleDateString('pt-BR');

      return `Perfeito! 😊

📋 **Resumo do agendamento:**
👨‍⚕️ **${state.selectedService}**
📅 **${dateFormatted}** às **${timeFormatted}**

Para finalizar, preciso do seu nome completo e email para confirmação.

Pode me enviar assim:
**Nome:** Seu Nome Completo
**Email:** seuemail@exemplo.com 💙`;
    }

    const stateUpdate = ConversationStateManager.updateState(phoneNumber, { 
      attempts: state.attempts + 1 
    });
    
    if (stateUpdate.attempts >= 3) {
      return `Deixa eu te ajudar! 😊
Me diga um horário assim: "10h" ou "às 14h"

Nossos horários são:
🌅 **8h, 9h, 10h, 11h**
🌅 **14h, 15h, 16h, 17h**

Qual você prefere? 💙`;
    }

    return `Qual horário funciona melhor para você? 😊
Pode me dizer algo como "às 10h" ou "14h"

Tenho disponibilidade em:
**Manhã:** 8h, 9h, 10h, 11h
**Tarde:** 14h, 15h, 16h, 17h 💙`;
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
        customerEmail,
        attempts: 0
      });

      const timeFormatted = state.selectedTime?.replace(':00', 'h');
      const date = new Date(state.selectedDate!);
      const dateFormatted = date.toLocaleDateString('pt-BR');

      return `Quase pronto! 😊

📋 **Confirme seus dados:**
👤 **${customerName}**
📧 **${customerEmail}**
👨‍⚕️ **${state.selectedService}**
📅 **${dateFormatted}** às **${timeFormatted}**

Está tudo certo? Digite **SIM** para confirmar! 💙`;
    }

    ConversationStateManager.updateState(phoneNumber, { 
      attempts: state.attempts + 1 
    });

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
      const date = new Date(state.selectedDate!);
      const dateFormatted = date.toLocaleDateString('pt-BR');

      return `✅ **Agendamento confirmado com sucesso!**

👤 **${state.customerName}**
📧 **${state.customerEmail}**
👨‍⚕️ **${state.selectedService}**
📅 **${dateFormatted}** às **${timeFormatted}**
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

  private static handleUnknownInput(phoneNumber: string, message: string): string {
    const state = ConversationStateManager.getState(phoneNumber);
    
    const responses = [
      "Não entendi muito bem! 😅\nPode me explicar de outro jeito? 💙",
      "Me ajuda a entender melhor o que você precisa? 😊💙",
      "Hmm, não consegui captar! Me dá mais detalhes? 😊💙"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
}
