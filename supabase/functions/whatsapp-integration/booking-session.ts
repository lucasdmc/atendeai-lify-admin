
export interface BookingSession {
  phoneNumber: string;
  currentStep: 'service' | 'slots' | 'confirmation' | 'contact_info' | 'completed';
  selectedService?: string;
  selectedSlot?: { date: string; time: string };
  customerName?: string;
  customerEmail?: string;
  appointmentType?: 'new' | 'reschedule' | 'cancel';
  originalAppointmentId?: string;
}

export class BookingSessionManager {
  private static sessions = new Map<string, BookingSession>();

  static getSession(phoneNumber: string): BookingSession {
    if (!this.sessions.has(phoneNumber)) {
      this.sessions.set(phoneNumber, {
        phoneNumber,
        currentStep: 'service'
      });
    }
    return this.sessions.get(phoneNumber)!;
  }

  static updateSession(phoneNumber: string, updates: Partial<BookingSession>): void {
    const session = this.getSession(phoneNumber);
    Object.assign(session, updates);
    this.sessions.set(phoneNumber, session);
  }

  static clearSession(phoneNumber: string): void {
    this.sessions.delete(phoneNumber);
  }
}
