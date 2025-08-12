export default class ToolsRouter {
  constructor({ appointmentFlowManager }) {
    this.appointmentFlowManager = appointmentFlowManager;
  }

  async route({ phoneNumber, message, intent, clinicContext, memory }) {
    const name = intent?.name || intent;
    switch (name) {
      case 'APPOINTMENT_CREATE':
      case 'APPOINTMENT_SCHEDULE':
      case 'APPOINTMENT_RESCHEDULE':
      case 'APPOINTMENT_CANCEL':
      case 'APPOINTMENT_LIST':
      case 'APPOINTMENT_CHECK':
      case 'APPOINTMENT_CONTINUE':
        return this.appointmentFlowManager.handleAppointmentIntent(phoneNumber, message, intent, clinicContext, memory);
      default:
        return null;
    }
  }
}
