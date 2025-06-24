
import { TimeSlot, AvailabilityRequest } from './availability-types.ts';
import { AvailabilityChecker } from './availability-checker.ts';
import { AvailabilityGenerator } from './availability-generator.ts';
import { AvailabilityFormatter } from './availability-formatter.ts';

export class AvailabilityManager {
  static async getAvailableSlots(
    supabase: any,
    request: AvailabilityRequest = {},
    limit: number = 5
  ): Promise<TimeSlot[]> {
    console.log('🗓️ Buscando horários disponíveis:', request);
    
    try {
      const { availability, exceptions, appointments } = await AvailabilityChecker.fetchAvailabilityData(supabase);

      const slots = AvailabilityGenerator.generateAvailableSlots(
        availability,
        exceptions,
        appointments,
        request,
        limit
      );

      console.log(`✅ ${slots.length} horários disponíveis encontrados`);
      return slots;
    } catch (error) {
      console.error('❌ Erro ao processar disponibilidade:', error);
      return AvailabilityGenerator.getDefaultSlots();
    }
  }

  static formatSlotForDisplay(slot: TimeSlot, index: number): string {
    return AvailabilityFormatter.formatSlotForDisplay(slot, index);
  }

  static async markSlotAsBooked(supabase: any, date: string, time: string): Promise<void> {
    return AvailabilityFormatter.markSlotAsBooked(supabase, date, time);
  }
}

// Re-export types for backward compatibility
export type { TimeSlot, AvailabilityRequest } from './availability-types.ts';
