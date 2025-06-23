
import { addMonths, subMonths, addDays, isSameDay } from 'date-fns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarViewType } from '@/components/calendar/CalendarViewSwitcher';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import { startOfWeek, endOfWeek } from 'date-fns';

export const navigateDate = (currentDate: Date, viewType: CalendarViewType, direction: 'prev' | 'next') => {
  const multiplier = direction === 'next' ? 1 : -1;
  
  switch (viewType) {
    case 'day':
      return addDays(currentDate, multiplier);
    case 'week':
      return addDays(currentDate, 7 * multiplier);
    case 'month':
      return direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    case 'year':
      return new Date(currentDate.getFullYear() + multiplier, currentDate.getMonth(), currentDate.getDate());
    default:
      return currentDate;
  }
};

export const getViewTitle = (currentDate: Date, viewType: CalendarViewType): string => {
  switch (viewType) {
    case 'day':
      return format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    case 'week':
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return `${format(weekStart, 'd MMM', { locale: ptBR })} - ${format(weekEnd, 'd MMM yyyy', { locale: ptBR })}`;
    case 'month':
      return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    case 'year':
      return format(currentDate, 'yyyy', { locale: ptBR });
    default:
      return '';
  }
};

export const getEventsForDay = (events: GoogleCalendarEvent[], day: Date): GoogleCalendarEvent[] => {
  return events.filter(event => {
    if (!event.start?.dateTime) return false;
    const eventDate = new Date(event.start.dateTime);
    return isSameDay(eventDate, day);
  });
};
