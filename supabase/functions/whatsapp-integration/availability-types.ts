
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

export interface AvailabilityData {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  break_start_time?: string;
  break_end_time?: string;
  is_active: boolean;
}

export interface AvailabilityException {
  exception_date: string;
  is_closed: boolean;
  custom_start_time?: string;
  custom_end_time?: string;
}

export interface ExistingAppointment {
  start_time: string;
  end_time: string;
}
