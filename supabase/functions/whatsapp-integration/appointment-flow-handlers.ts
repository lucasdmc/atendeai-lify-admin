
import { FlowHandlerParams } from './conversation-flow-types.ts';
import { ConversationStateManager } from './conversation-state-manager.ts';
import { SpecialtyDetector } from './specialty-detection.ts';
import { TimeExtractor } from './time-extraction.ts';
import { MCPToolsProcessor } from './mcp-tools.ts';

export class AppointmentFlowHandlers {
  static async handleServiceSelection(params: FlowHandlerParams): Promise<string> {
    const { phoneNumber, message, userInput, supabase } = params;
    console.log('⏳ Aguardando seleção de especialidade');
    
    if (userInput.isSpecialtySelection && userInput.extractedSpecialty) {
      await ConversationStateManager.updateState(phoneNumber, { 
        currentState: 'time_selection',
        selectedService: userInput.extractedSpecialty
      }, supabase);
      return TimeExtractor.getTimeSelectionResponse(userInput.extractedSpecialty, userInput.extractedDate);
    }
    
    const specialtyResult = SpecialtyDetector.detectFromMessage(message.toLowerCase());
    if (specialtyResult.specialty) {
      await ConversationStateManager.updateState(phoneNumber, { 
        currentState: 'time_selection',
        selectedService: specialtyResult.specialty
      }, supabase);
      return TimeExtractor.getTimeSelectionResponse(specialtyResult.specialty);
    }
    
    return SpecialtyDetector.getSpecialtyHelpResponse();
  }

  static async handleTimeSelection(params: FlowHandlerParams): Promise<string> {
    const { phoneNumber, message, userInput, supabase } = params;
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
        selectedDate = state.selectedDate;
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        selectedDate = tomorrow.toLocaleDateString('pt-BR');
      }
    }
    
    // Se não tem horário, tentar extrair do contexto
    if (!selectedTime) {
      const timeResult = TimeExtractor.extractFromMessage(message);
      selectedTime = timeResult.time;
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

    return TimeExtractor.getTimeHelpResponse();
  }

  static async handleContactInfo(params: FlowHandlerParams): Promise<string> {
    const { phoneNumber, message, userInput, supabase } = params;
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

  static async handleFinalConfirmation(params: FlowHandlerParams): Promise<string> {
    const { phoneNumber, message, userInput, supabase } = params;
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
}
