
import { TimeSlot } from './availability-types.ts';

export class AvailabilityFormatter {
  static formatSlotForDisplay(slot: TimeSlot, index: number): string {
    const date = new Date(slot.date);
    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dateStr = date.toLocaleDateString('pt-BR');
    
    return `${index + 1}. *${dayName.charAt(0).toUpperCase() + dayName.slice(1)}* (${dateStr}) às ${slot.time}`;
  }

  static async markSlotAsBooked(supabase: any, date: string, time: string): Promise<void> {
    console.log(`🔒 Marcando slot como ocupado: ${date} ${time}`);
    // Esta função será chamada quando um agendamento for confirmado
    // Para evitar que o mesmo horário seja sugerido novamente
  }
}
