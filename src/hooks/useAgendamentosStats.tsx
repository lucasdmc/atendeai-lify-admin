
import { useMemo } from 'react';
import { CalendarDays, Clock, Users, TrendingUp } from 'lucide-react';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import { getLabelFromString, AppointmentLabel, appointmentLabels } from '@/utils/appointmentLabels';

export const useAgendamentosStats = (events: GoogleCalendarEvent[]) => {
  const today = new Date();
  
  const todayEvents = useMemo(() => events.filter(event => {
    if (!event.start?.dateTime) return false;
    const eventDate = new Date(event.start.dateTime);
    return (
      eventDate.getDate() === today.getDate() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  }), [events, today]);

  const thisWeekEvents = useMemo(() => events.filter(event => {
    if (!event.start?.dateTime) return false;
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const eventDate = new Date(event.start.dateTime);
    return eventDate >= today && eventDate <= weekFromNow;
  }), [events, today]);

  const thisMonthEvents = useMemo(() => events.filter(event => {
    if (!event.start?.dateTime) return false;
    const eventDate = new Date(event.start.dateTime);
    return (
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  }), [events, today]);

  const getEventLabel = (event: GoogleCalendarEvent): AppointmentLabel => {
    if (event.description) {
      const labelMatch = event.description.match(/\[LABEL:(\w+)\]/);
      if (labelMatch) {
        return getLabelFromString(labelMatch[1]);
      }
    }
    return 'consulta';
  };

  const labelCounts = useMemo(() => {
    return Object.keys(appointmentLabels).reduce((acc, label) => {
      acc[label as AppointmentLabel] = events.filter(event => 
        getEventLabel(event) === label
      ).length;
      return acc;
    }, {} as Record<AppointmentLabel, number>);
  }, [events]);

  const pieChartData = useMemo(() => {
    const lifyColors = ['#e91e63', '#9c27b0', '#673ab7', '#ff5722', '#ff9800'];
    
    return Object.entries(appointmentLabels)
      .map(([key, config], index) => ({
        name: config.name,
        value: labelCounts[key as AppointmentLabel],
        color: lifyColors[index % lifyColors.length]
      }))
      .filter(item => item.value > 0);
  }, [labelCounts]);

  const statsCards = useMemo(() => [
    {
      title: 'Hoje',
      value: todayEvents.length,
      icon: CalendarDays,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-lify-pink via-lify-purple to-lify-deep-purple',
      borderColor: 'border-lify-pink/40',
      shadowColor: 'shadow-lify-pink/20'
    },
    {
      title: 'Esta Semana',
      value: thisWeekEvents.length,
      icon: Clock,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-lify-orange via-lify-amber to-lify-orange',
      borderColor: 'border-lify-orange/40',
      shadowColor: 'shadow-lify-orange/20'
    },
    {
      title: 'Este Mês',
      value: thisMonthEvents.length,
      icon: Users,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-lify-purple via-lify-deep-purple to-lify-purple',
      borderColor: 'border-lify-purple/40',
      shadowColor: 'shadow-lify-purple/20'
    },
    {
      title: 'Total de Eventos',
      value: events.length,
      icon: TrendingUp,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-lify-pink via-lify-orange to-lify-amber',
      borderColor: 'border-lify-pink/40',
      shadowColor: 'shadow-lify-pink/20'
    }
  ], [todayEvents.length, thisWeekEvents.length, thisMonthEvents.length, events.length]);

  return {
    statsCards,
    pieChartData
  };
};
