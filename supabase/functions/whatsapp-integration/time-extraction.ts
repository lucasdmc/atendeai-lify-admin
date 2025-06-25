
import { TimeExtractionResult } from './conversation-flow-types.ts';

export class TimeExtractor {
  private static readonly TIME_PATTERNS = [
    /(\d{1,2}):?(\d{2})/,
    /(\d{1,2})\s*h/,
    /às?\s*(\d{1,2})/i,
    /(\d{1,2})\s*da\s*(manhã|tarde)/i
  ];

  static extractFromMessage(message: string): TimeExtractionResult {
    for (const pattern of this.TIME_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        const hour = parseInt(match[1]);
        if (hour >= 8 && hour <= 18) {
          return {
            time: `${hour.toString().padStart(2, '0')}:00`,
            confidence: 0.9
          };
        }
      }
    }
    return { confidence: 0 };
  }

  static getTimeSelectionResponse(specialty: string, date?: string): string {
    const dateText = date ? ` para ${date}` : ' nos próximos dias';
    
    return `Excelente! ${specialty} anotada! 😊

Que dia e horário seria melhor para você${dateText}?

📅 **Horários disponíveis:**
**Manhã:** 8h, 9h, 10h, 11h
**Tarde:** 14h, 15h, 16h, 17h

Pode me dizer algo como "amanhã às 10h" ou "26/06 às 14h"! 💙`;
  }

  static getTimeHelpResponse(): string {
    return `Qual horário funciona melhor para você? 😊

📅 **Horários disponíveis:**
**Manhã:** 8h, 9h, 10h, 11h
**Tarde:** 14h, 15h, 16h, 17h

Pode dizer "10h", "às 14h", "amanhã às 10h" 💙`;
  }
}
