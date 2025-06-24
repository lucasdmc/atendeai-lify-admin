
import { AvailabilityData, AvailabilityException, ExistingAppointment, AvailabilityRequest } from './availability-types.ts';

export class AvailabilityChecker {
  static async fetchAvailabilityData(supabase: any) {
    const { data: availability, error: availError } = await supabase
      .from('clinic_availability')
      .select('*')
      .eq('is_active', true)
      .order('day_of_week');

    if (availError) {
      console.error('❌ Erro ao buscar disponibilidade:', availError);
      return { availability: [], exceptions: [], appointments: [] };
    }

    const { data: exceptions, error: exceptError } = await supabase
      .from('clinic_availability_exceptions')
      .select('*')
      .gte('exception_date', new Date().toISOString().split('T')[0]);

    const { data: existingAppointments, error: apptError } = await supabase
      .from('calendar_events')
      .select('start_time, end_time')
      .gte('start_time', new Date().toISOString())
      .lte('start_time', this.getFutureDate(14));

    return {
      availability: availability || [],
      exceptions: exceptions || [],
      appointments: existingAppointments || []
    };
  }

  static hasAvailabilityForDay(
    dayOfWeek: number, 
    dateStr: string, 
    availability: AvailabilityData[], 
    exceptions: AvailabilityException[]
  ): { hasAvailability: boolean; dayAvailability?: AvailabilityData; exception?: AvailabilityException } {
    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek);
    if (!dayAvailability) {
      return { hasAvailability: false };
    }

    const hasException = exceptions.find(e => e.exception_date === dateStr);
    if (hasException?.is_closed) {
      return { hasAvailability: false };
    }

    return { 
      hasAvailability: true, 
      dayAvailability, 
      exception: hasException 
    };
  }

  static hasConflictWithAppointments(
    slotDateTime: string,
    duration: number,
    appointments: ExistingAppointment[]
  ): boolean {
    return appointments.some(apt => {
      const aptStart = new Date(apt.start_time).getTime();
      const aptEnd = new Date(apt.end_time).getTime();
      const slotStart = new Date(slotDateTime).getTime();
      const slotEnd = slotStart + (duration * 60 * 1000);
      
      return (slotStart < aptEnd && slotEnd > aptStart);
    });
  }

  private static getFutureDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }
}
