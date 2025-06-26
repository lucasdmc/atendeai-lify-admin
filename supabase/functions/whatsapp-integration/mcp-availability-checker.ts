
// Availability checking utilities for MCP tools
export class MCPAvailabilityChecker {
  static async checkAvailability(parameters: any, supabase: any): Promise<string> {
    try {
      console.log('🔍 Verificando disponibilidade real na agenda...');
      
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Verificar disponibilidade usando o sistema real de agendamentos
      const { data: events, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', today.toISOString())
        .lte('start_time', nextWeek.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('❌ Erro ao consultar agenda:', error);
        return 'Vou verificar nossa agenda e te retorno rapidinho! 💙';
      }

      const { specialty, date } = parameters;
      console.log(`📅 Buscando disponibilidade para: ${specialty} em ${date}`);
      
      // Gerar horários disponíveis baseado na agenda real
      const availableSlots = this.generateAvailableSlots(events, date);
      
      if (availableSlots.length > 0) {
        const slotsText = availableSlots.slice(0, 3).join(', ');
        return `Ótimo! Encontrei horários disponíveis${specialty ? ` para ${specialty}` : ''} ${date ? `no dia ${date}` : 'nos próximos dias'}! 😊

📅 **Horários disponíveis:** ${slotsText}

Qual horário funciona melhor para você? 💙`;
      }

      return `No momento nossa agenda está bem cheia${specialty ? ` para ${specialty}` : ''}${date ? ` no dia ${date}` : ''}.
Posso verificar outras datas ou te colocar em nossa lista de espera.
Qual você prefere? 💙`;
    } catch (error) {
      console.error('❌ Erro ao verificar disponibilidade:', error);
      return 'Vou consultar nossa agenda e te retorno rapidinho! 💙';
    }
  }

  static generateAvailableSlots(existingEvents: any[], requestedDate?: string): string[] {
    // Horários padrão da clínica (8h às 18h)
    const workingHours = [
      '08:00', '09:00', '10:00', '11:00', 
      '14:00', '15:00', '16:00', '17:00'
    ];
    
    if (!requestedDate) {
      // Se não tem data específica, retornar horários genéricos
      return workingHours.slice(0, 3);
    }
    
    // Filtrar horários ocupados para a data específica
    const occupiedSlots = existingEvents
      .filter(event => {
        const eventDate = new Date(event.start_time).toLocaleDateString('pt-BR');
        const targetDate = this.parseDate(requestedDate);
        return eventDate === targetDate;
      })
      .map(event => {
        const time = new Date(event.start_time);
        return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
      });
    
    // Retornar horários disponíveis
    return workingHours.filter(slot => !occupiedSlots.includes(slot));
  }

  static parseDate(dateString: string): string {
    try {
      // Tentar diferentes formatos de data
      let date;
      
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          // DD/MM/YYYY ou DD/MM/YY
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          let year = parts[2];
          if (year.length === 2) {
            year = '20' + year;
          }
          date = new Date(`${year}-${month}-${day}`);
        }
      } else if (dateString.includes('-')) {
        // YYYY-MM-DD
        date = new Date(dateString);
      } else {
        // Tentar parsing direto
        date = new Date(dateString);
      }
      
      return date.toLocaleDateString('pt-BR');
    } catch {
      return new Date().toLocaleDateString('pt-BR');
    }
  }
}
