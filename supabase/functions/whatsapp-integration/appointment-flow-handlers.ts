import { FlowHandlerParams } from './conversation-flow-types.ts';
import { ConversationStateManager } from './conversation-state-manager.ts';
import { SpecialtyDetector } from './specialty-detection.ts';
import { TimeExtractor } from './time-extraction.ts';
import { MCPToolsProcessor } from './mcp-tools.ts';
import { SmartInputProcessor } from './smart-input-processor.ts';

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
    const { phoneNumber, message, supabase } = params;
    console.log('👤 Processando informações de contato com sistema inteligente...');
    
    // Usar o novo sistema inteligente de processamento
    const processingResult = SmartInputProcessor.processContactInfo(phoneNumber, message);
    
    console.log('🔍 Resultado do processamento:', processingResult);
    
    // Se precisa de confirmação ou tem problemas, retornar mensagem de confirmação
    if (processingResult.needsConfirmation || !processingResult.success) {
      return processingResult.responseMessage;
    }
    
    // Se coletou dados com sucesso, verificar se temos tudo
    if (processingResult.data?.name && processingResult.data?.email) {
      console.log('🎉 Dados coletados com sucesso pelo sistema inteligente!');
      
      const state = await ConversationStateManager.getState(phoneNumber, supabase);
      
      await ConversationStateManager.updateState(phoneNumber, { 
        currentState: 'confirmation',
        customerName: processingResult.data.name,
        customerEmail: processingResult.data.email
      }, supabase);

      const timeFormatted = state.selectedTime?.replace(':00', 'h');

      return `Quase pronto! 😊

📋 **Confirme seus dados:**
👤 **${processingResult.data.name}**
📧 **${processingResult.data.email}**
👨‍⚕️ **${state.selectedService}**
📅 **${state.selectedDate}** às **${timeFormatted}**

Está tudo certo? Digite **SIM** para confirmar! 💙`;
    }
    
    // Fallback para mensagem padrão se algo deu errado
    return processingResult.responseMessage || `Por favor, me informe seu nome completo e email:

**Nome:** Seu Nome Completo  
**Email:** seuemail@exemplo.com 💙`;
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
      console.log('🎯 Criando agendamento com MCP Tools...');
      
      // Criar agendamento real usando MCP
      const result = await MCPToolsProcessor.scheduleAppointment({
        specialty: state.selectedService,
        date: state.selectedDate,
        time: state.selectedTime,
        customerName: state.customerName,
        customerEmail: state.customerEmail
      }, supabase);

      console.log('✅ Resultado do agendamento:', result);

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
