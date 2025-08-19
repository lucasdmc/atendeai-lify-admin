export default class ToolsRouter {
  constructor({ appointmentFlowManager }) {
    this.appointmentFlowManager = appointmentFlowManager;
    console.log('🔧 [ToolsRouter] Inicializado com:', {
      hasAppointmentFlowManager: !!appointmentFlowManager,
      appointmentFlowManagerType: appointmentFlowManager ? appointmentFlowManager.constructor.name : 'null'
    });
  }

  async route({ phoneNumber, message, intent, clinicContext, memory }) {
    try {
      const name = intent?.name || intent;
      console.log('🔧 [ToolsRouter] Roteando mensagem:', {
        phoneNumber,
        intent: name,
        hasClinicContext: !!clinicContext,
        clinicName: clinicContext?.name
      });

      // 🔧 CORREÇÃO: Validar se AppointmentFlowManager está disponível
      if (!this.appointmentFlowManager) {
        console.error('❌ [ToolsRouter] AppointmentFlowManager não está disponível!');
        return {
          response: 'Desculpe, o sistema de agendamento não está disponível no momento. Por favor, entre em contato conosco pelo telefone para agendar sua consulta.',
          intent: { name: 'APPOINTMENT_ERROR', confidence: 1.0 },
          toolsUsed: ['tools_router'],
          metadata: { error: 'appointment_flow_manager_unavailable' }
        };
      }

      // 🔧 CORREÇÃO: Validar se AppointmentFlowManager está inicializado
      if (!this.appointmentFlowManager.initialized) {
        console.error('❌ [ToolsRouter] AppointmentFlowManager não está inicializado!');
        return {
          response: 'Desculpe, o sistema de agendamento está sendo configurado. Por favor, tente novamente em alguns instantes ou entre em contato pelo telefone.',
          intent: { name: 'APPOINTMENT_ERROR', confidence: 1.0 },
          toolsUsed: ['tools_router'],
          metadata: { error: 'appointment_flow_manager_not_initialized' }
        };
      }

      console.log('✅ [ToolsRouter] AppointmentFlowManager validado, roteando para agendamento...');

      switch (name) {
        case 'APPOINTMENT_CREATE':
        case 'APPOINTMENT_SCHEDULE':
        case 'APPOINTMENT_RESCHEDULE':
        case 'APPOINTMENT_CANCEL':
        case 'APPOINTMENT_LIST':
        case 'APPOINTMENT_CHECK':
        case 'APPOINTMENT_CONTINUE':
          console.log('📅 [ToolsRouter] Roteando para AppointmentFlowManager...');
          const result = await this.appointmentFlowManager.handleAppointmentIntent(phoneNumber, message, intent, clinicContext, memory);
          console.log('✅ [ToolsRouter] AppointmentFlowManager retornou resultado:', {
            hasResponse: !!result?.response,
            hasError: !!result?.error,
            flowStep: result?.metadata?.flowStep
          });
          return result;
        default:
          console.log('⚠️ [ToolsRouter] Intenção não reconhecida:', name);
          return null;
      }
    } catch (error) {
      console.error('❌ [ToolsRouter] Erro no roteamento:', error);
      return {
        response: 'Desculpe, ocorreu um erro técnico no sistema de agendamento. Por favor, entre em contato conosco pelo telefone para agendar sua consulta.',
        intent: { name: 'APPOINTMENT_ERROR', confidence: 1.0 },
        toolsUsed: ['tools_router'],
        metadata: { error: 'routing_error', errorMessage: error.message }
      };
    }
  }
}
