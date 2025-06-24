
export interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
  reason?: string;
}

export interface AvailabilityRequest {
  date?: string;
  serviceType?: string;
  duration?: number;
}

export class AvailabilityManager {
  static async getAvailableSlots(
    supabase: any,
    request: AvailabilityRequest = {},
    limit: number = 5
  ): Promise<TimeSlot[]> {
    console.log('🗓️ Buscando horários disponíveis:', request);
    
    try {
      // Buscar configurações de disponibilidade da clínica
      const { data: availability, error: availError } = await supabase
        .from('clinic_availability')
        .select('*')
        .eq('is_active', true)
        .order('day_of_week');

      if (availError) {
        console.error('❌ Erro ao buscar disponibilidade:', availError);
        return this.getDefaultSlots();
      }

      // Buscar exceções (feriados, bloqueios)
      const { data: exceptions, error: exceptError } = await supabase
        .from('clinic_availability_exceptions')
        .select('*')
        .gte('exception_date', new Date().toISOString().split('T')[0]);

      // Buscar agendamentos já marcados
      const { data: existingAppointments, error: apptError } = await supabase
        .from('calendar_events')
        .select('start_time, end_time')
        .gte('start_time', new Date().toISOString())
        .lte('start_time', this.getFutureDate(14)); // próximas 2 semanas

      const slots = this.generateAvailableSlots(
        availability || [],
        exceptions || [],
        existingAppointments || [],
        request,
        limit
      );

      console.log(`✅ ${slots.length} horários disponíveis encontrados`);
      return slots;
    } catch (error) {
      console.error('❌ Erro ao processar disponibilidade:', error);
      return this.getDefaultSlots();
    }
  }

  private static generateAvailableSlots(
    availability: any[],
    exceptions: any[],
    appointments: any[],
    request: AvailabilityRequest,
    limit: number
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const today = new Date();
    const duration = request.duration || 60; // 1 hora padrão
    
    // Gerar slots para os próximos 14 dias
    for (let i = 1; i <= 14 && slots.length < limit; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      
      const dayOfWeek = checkDate.getDay();
      const dateStr = checkDate.toISOString().split('T')[0];
      
      // Verificar se há disponibilidade para este dia da semana
      const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek);
      if (!dayAvailability) continue;
      
      // Verificar exceções
      const hasException = exceptions.find(e => e.exception_date === dateStr);
      if (hasException?.is_closed) continue;
      
      // Gerar horários do dia
      const daySlots = this.generateDaySlots(
        dateStr,
        dayAvailability,
        hasException,
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
    availability: any,
    exception: any,
    appointments: any[],
    duration: number
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    
    const startTime = exception?.custom_start_time || availability.start_time;
    const endTime = exception?.custom_end_time || availability.end_time;
    const breakStart = availability.break_start_time;
    const breakEnd = availability.break_end_time;
    
    const slotDuration = availability.slot_duration_minutes || 30;
    
    // Converter horários para minutos
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    const breakStartMinutes = breakStart ? this.timeToMinutes(breakStart) : null;
    const breakEndMinutes = breakEnd ? this.timeToMinutes(breakEnd) : null;
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
      // Pular horário de almoço
      if (breakStartMinutes && breakEndMinutes && 
          minutes >= breakStartMinutes && minutes < breakEndMinutes) {
        continue;
      }
      
      const timeStr = this.minutesToTime(minutes);
      const slotDateTime = `${date}T${timeStr}:00`;
      
      // Verificar se não conflita com agendamentos existentes
      const hasConflict = appointments.some(apt => {
        const aptStart = new Date(apt.start_time).getTime();
        const aptEnd = new Date(apt.end_time).getTime();
        const slotStart = new Date(slotDateTime).getTime();
        const slotEnd = slotStart + (duration * 60 * 1000);
        
        return (slotStart < aptEnd && slotEnd > aptStart);
      });
      
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

  private static timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private static getFutureDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  private static getDefaultSlots(): TimeSlot[] {
    // Horários padrão caso não haja configuração
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
