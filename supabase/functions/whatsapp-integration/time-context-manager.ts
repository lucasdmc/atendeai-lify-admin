
import { ResponseContext } from './response-context-builder.ts';

export class TimeContextManager {
  static getCurrentTimeContext(): ResponseContext['timeContext'] {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.toLocaleDateString('pt-BR', { weekday: 'long' });
    
    let timeOfDay: ResponseContext['timeContext']['timeOfDay'];
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';
    
    // Horário comercial: 8h às 18h, segunda a sexta
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    const isBusinessHours = isWeekday && hour >= 8 && hour < 18;
    
    return {
      timeOfDay,
      dayOfWeek,
      isBusinessHours
    };
  }

  static getTimeContextDescription(timeContext: ResponseContext['timeContext']): string {
    let context = `Agora é ${timeContext.timeOfDay === 'morning' ? 'manhã' : 
                            timeContext.timeOfDay === 'afternoon' ? 'tarde' : 
                            timeContext.timeOfDay === 'evening' ? 'início da noite' : 'noite'} de ${timeContext.dayOfWeek}.`;
    
    if (!timeContext.isBusinessHours) {
      context += ' A clínica está fechada, mas você pode dar informações e agendar para os próximos dias úteis.';
    }
    
    return context;
  }
}
