
import { format, addDays, parseISO, isAfter, isBefore, startOfDay } from 'https://esm.sh/date-fns@3.6.0';
import { ptBR } from 'https://esm.sh/date-fns@3.6.0/locale';

interface AvailabilitySlot {
  date: string;
  time: string;
  displayTime: string;
  available: boolean;
}

interface DayAvailability {
  date: string;
  displayDate: string;
  available: boolean;
  slots: AvailabilitySlot[];
}

export class AvailabilityManager {
  constructor(private supabase: any) {}

  async getAvailableDates(daysAhead: number = 30): Promise<DayAvailability[]> {
    try {
      const today = new Date();
      const availableDates: DayAvailability[] = [];

      // Buscar configurações de disponibilidade
      const { data: clinicHours } = await this.supabase
        .from('clinic_availability')
        .select('*')
        .eq('is_active', true);

      // Buscar exceções (feriados, etc)
      const { data: exceptions } = await this.supabase
        .from('clinic_availability_exceptions')
        .select('*');

      // Buscar agendamentos existentes
      const startDate = format(today, 'yyyy-MM-dd');
      const endDate = format(addDays(today, daysAhead), 'yyyy-MM-dd');
      
      const { data: existingAppointments } = await this.supabase
        .from('calendar_events')
        .select('start_time, end_time')
        .gte('start_time', startDate)
        .lte('start_time', endDate + 'T23:59:59');

      // Gerar dias disponíveis
      for (let i = 0; i < daysAhead; i++) {
        const currentDate = addDays(today, i);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const dayOfWeek = currentDate.getDay();
        
        // Verificar se há configuração para este dia da semana
        const dayConfig = clinicHours?.find(config => config.day_of_week === dayOfWeek);
        if (!dayConfig) {
          continue; // Clínica fechada neste dia
        }

        // Verificar exceções
        const exception = exceptions?.find(exc => exc.exception_date === dateStr);
        if (exception?.is_closed) {
          continue; // Clínica fechada por exceção
        }

        // Gerar slots para o dia
        const slots = await this.generateDaySlots(
          currentDate,
          dayConfig,
          exception,
          existingAppointments || []
        );

        availableDates.push({
          date: dateStr,
          displayDate: format(currentDate, "dd 'de' MMMM", { locale: ptBR }),
          available: slots.some(slot => slot.available),
          slots
        });
      }

      return availableDates.filter(day => day.available);
    } catch (error) {
      console.error('❌ Erro ao buscar datas disponíveis:', error);
      return [];
    }
  }

  private async generateDaySlots(
    date: Date,
    dayConfig: any,
    exception: any,
    existingAppointments: any[]
  ): Promise<AvailabilitySlot[]> {
    const slots: AvailabilitySlot[] = [];
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Usar horários da exceção se existir, senão usar configuração padrão
    const startTime = exception?.custom_start_time || dayConfig.start_time;
    const endTime = exception?.custom_end_time || dayConfig.end_time;
    const slotDuration = dayConfig.slot_duration_minutes;
    
    // Converter horários para minutos
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    const breakStart = dayConfig.break_start_time ? this.timeToMinutes(dayConfig.break_start_time) : null;
    const breakEnd = dayConfig.break_end_time ? this.timeToMinutes(dayConfig.break_end_time) : null;

    // Gerar slots
    for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
      // Pular horário de pausa
      if (breakStart && breakEnd && minutes >= breakStart && minutes < breakEnd) {
        continue;
      }

      const time = this.minutesToTime(minutes);
      const slotDateTime = `${dateStr}T${time}:00`;
      
      // Verificar se é no passado
      const now = new Date();
      const slotDate = parseISO(slotDateTime);
      if (!isAfter(slotDate, now)) {
        continue;
      }

      // Verificar conflitos com agendamentos existentes
      const hasConflict = existingAppointments.some(apt => {
        const aptStart = parseISO(apt.start_time);
        const aptEnd = parseISO(apt.end_time);
        return !isBefore(slotDate, aptStart) && isBefore(slotDate, aptEnd);
      });

      slots.push({
        date: dateStr,
        time,
        displayTime: format(slotDate, 'HH:mm'),
        available: !hasConflict
      });
    }

    return slots;
  }

  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  async getAvailableTimesForDate(date: string): Promise<AvailabilitySlot[]> {
    try {
      const selectedDate = parseISO(date);
      const dayOfWeek = selectedDate.getDay();

      // Buscar configuração do dia
      const { data: dayConfig } = await this.supabase
        .from('clinic_availability')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .single();

      if (!dayConfig) {
        return [];
      }

      // Buscar exceção para o dia
      const { data: exception } = await this.supabase
        .from('clinic_availability_exceptions')
        .select('*')
        .eq('exception_date', date)
        .single();

      // Buscar agendamentos existentes
      const { data: existingAppointments } = await this.supabase
        .from('calendar_events')
        .select('start_time, end_time')
        .gte('start_time', `${date}T00:00:00`)
        .lte('start_time', `${date}T23:59:59`);

      return await this.generateDaySlots(
        selectedDate,
        dayConfig,
        exception,
        existingAppointments || []
      );
    } catch (error) {
      console.error('❌ Erro ao buscar horários disponíveis:', error);
      return [];
    }
  }
}
