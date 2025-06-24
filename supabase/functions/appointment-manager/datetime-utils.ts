
export function createDateTime(date: string, time: string): string {
  try {
    console.log(`🔧 Criando datetime com data: ${date}, hora: ${time}`);
    
    // Validar formato de data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new Error(`Formato de data inválido: ${date}`);
    }
    
    // Validar formato de hora (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(time)) {
      throw new Error(`Formato de hora inválido: ${time}`);
    }
    
    const [hour, minute] = time.split(':').map(Number);
    
    // Validar hora e minuto
    if (hour < 0 || hour > 23) {
      throw new Error(`Hora inválida: ${hour}`);
    }
    if (minute < 0 || minute > 59) {
      throw new Error(`Minuto inválido: ${minute}`);
    }
    
    // Criar datetime no formato ISO com timezone do Brasil
    const dateTime = new Date(`${date}T${time}:00-03:00`);
    
    if (isNaN(dateTime.getTime())) {
      throw new Error(`Data/hora inválida: ${date} ${time}`);
    }
    
    const isoString = dateTime.toISOString();
    console.log(`✅ DateTime criado: ${isoString}`);
    return isoString;
  } catch (error) {
    console.error('❌ Erro ao criar datetime:', error);
    throw error;
  }
}
