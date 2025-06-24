
import { TimeSlot, AvailabilityData, AvailabilityException, ExistingAppointment, AvailabilityRequest } from './availability-types.ts';
import { AvailabilityChecker } from './availability-checker.ts';

export class AvailabilityGenerator {
  static generateAvailableSlots(
    availability: AvailabilityData[],
    exceptions: AvailabilityException[],
    appointments: ExistingAppointment[],
    request: AvailabilityRequest,
    limit: number
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const today = new Date();
    const duration = request.duration || 60;
    
    for (let i = 1; i <= 14 && slots.length < limit; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      
      const dayOfWeek = checkDate.getDay();
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const { hasAvailability, dayAvailability, exception } = AvailabilityChecker.hasAvailabilityForDay(
        dayOfWeek, 
        dateStr, 
        availability, 
        exceptions
      );
      
      if (!hasAvailability || !dayAvailability) continue;
      
      const daySlots = this.generateDaySlots(
        dateStr,
        dayAvailability,
        exception,
        appointments,
        duration
      );
      
      slots.push(...daySlots);
      
      if (slots.length >= limit) break;
    }
    
    return slots.slice(0, limit);
  }

  private static generateDaySlots(
    date: string,
    availability: AvailabilityData,
    exception: AvailabilityException | undefined,
    appointments: ExistingAppointment[],
    duration: number
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    
    const startTime = exception?.custom_start_time || availability.start_time;
    const endTime = exception?.custom_end_time || availability.end_time;
    const breakStart = availability.break_start_time;
    const breakEnd = availability.break_end_time;
    
    const slotDuration = availability.slot_duration_minutes || 30;
    
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    const breakStartMinutes = breakStart ? this.timeToMinutes(breakStart) : null;
    const breakEndMinutes = breakEnd ? this.timeToMinutes(breakEnd) : null;
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
      if (breakStartMinutes && breakEndMinutes && 
          minutes >= breakStartMinutes && minutes < breakEndMinutes) {
        continue;
      }
      
      const timeStr = this.minutesToTime(minutes);
      const slotDateTime = `${date}T${timeStr}:00`;
      
      const hasConflict = AvailabilityChecker.hasConflictWithAppointments(
        slotDateTime,
        duration,
        appointments
      );
      
      if (!hasConflict) {
        slots.push({
          date,
          time: timeStr,
          available: true
        });
      }
    }
    
    return slots;
  }

  static getDefaultSlots(): TimeSlot[] {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    return [
      { date: dateStr, time: '09:00', available: true },
      { date: dateStr, time: '10:00', available: true },
      { date: dateStr, time: '14:00', available: true },
      { date: dateStr, time: '15:00', available: true },
      { date: dateStr, time: '16:00', available: true }
    ];
  }

  private static timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}
