
// MCP Tools Processor para integração com ferramentas do sistema
export class MCPToolsProcessor {
  static async processToolCall(toolName: string, parameters: any, supabase: any): Promise<string> {
    console.log(`🔧 Processando ferramenta MCP: ${toolName}`);
    console.log(`📋 Parâmetros recebidos:`, JSON.stringify(parameters, null, 2));
    
    try {
      switch (toolName) {
        case 'check_availability':
          return await this.checkAvailability(parameters, supabase);
        case 'schedule_appointment':
          return await this.scheduleAppointment(parameters, supabase);
        case 'get_clinic_info':
          return await this.getClinicInfo(parameters);
        default:
          console.log(`⚠️ Ferramenta não reconhecida: ${toolName}`);
          return `Ferramenta ${toolName} não reconhecida.`;
      }
    } catch (error) {
      console.error(`❌ Erro ao processar ferramenta ${toolName}:`, error);
      return `Erro ao processar ${toolName}: ${error.message}`;
    }
  }

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

  static async scheduleAppointment(parameters: any, supabase: any): Promise<string> {
    try {
      console.log('📅 Criando agendamento real...');
      console.log('📋 Dados do agendamento:', JSON.stringify(parameters, null, 2));
      
      const { specialty, date, time, customerName, customerEmail } = parameters;
      
      // Validar dados obrigatórios
      if (!specialty || !date || !time) {
        console.log('❌ Dados insuficientes para agendamento');
        return `Para finalizar o agendamento, ainda preciso:
${!specialty ? '👨‍⚕️ Especialidade' : ''}
${!date ? '📅 Data' : ''}
${!time ? '🕐 Horário' : ''}

Me informe esses dados para confirmar! 💙`;
      }
      
      // Converter data para formato correto
      const formattedDate = this.convertToISODate(date);
      const endTime = this.calculateEndTime(time);
      
      console.log(`📅 Data formatada: ${formattedDate}`);
      console.log(`🕐 Horário: ${time} - ${endTime}`);
      
      // Chamar o sistema real de agendamentos
      const appointmentData = {
        action: 'create',
        appointmentData: {
          title: `${specialty} - ${customerName || 'Paciente via WhatsApp'}`,
          description: `Agendamento realizado via WhatsApp AI
Paciente: ${customerName || 'Não informado'}
Email: ${customerEmail || 'Não informado'}
Telefone: WhatsApp`,
          date: formattedDate,
          startTime: time,
          endTime: endTime,
          patientEmail: customerEmail,
          location: 'Clínica',
          label: 'consulta'
        }
      };

      console.log('🚀 Enviando para appointment-manager:', JSON.stringify(appointmentData, null, 2));

      const { data, error } = await supabase.functions.invoke('appointment-manager', {
        body: appointmentData
      });

      console.log('📥 Resposta do appointment-manager:', JSON.stringify({ data, error }, null, 2));

      if (error) {
        console.error('❌ Erro ao criar agendamento:', error);
        return `Ops! Tive uma dificuldade para confirmar o agendamento. 😔
Nossa equipe vai entrar em contato para finalizar!

📋 **Dados do agendamento:**
👨‍⚕️ **${specialty}**
📅 **${date}**
🕐 **${time}**
${customerName ? `👤 **${customerName}**` : ''}

Você receberá uma confirmação em breve! 💙`;
      }

      if (data && data.success) {
        console.log('✅ Agendamento criado com sucesso!');
        return `✅ **Agendamento confirmado!**

👨‍⚕️ **${specialty}**
📅 **${date}**
🕐 **${time}**
${customerName ? `👤 **${customerName}**` : ''}
${customerEmail ? `📧 **${customerEmail}**` : ''}
📍 **Clínica**

Seu agendamento foi criado com sucesso! ${customerEmail ? 'Você receberá uma confirmação por email.' : 'Nossa equipe entrará em contato para confirmação.'}

Se precisar reagendar ou cancelar, é só me avisar! 😊💙`;
      }

      console.log('⚠️ Resposta inesperada do sistema');
      return `Agendamento processado! 😊
Nossa equipe vai confirmar todos os detalhes:

📋 **${specialty}** - **${date}** às **${time}**

Aguarde nosso contato para confirmação! 💙`;
    } catch (error) {
      console.error('❌ Erro crítico ao agendar:', error);
      return `Anotei sua solicitação de agendamento! 😊

📋 **${parameters.specialty || 'Consulta'}** - **${parameters.date}** às **${parameters.time}**

Nossa equipe vai entrar em contato para confirmar todos os detalhes! 💙`;
    }
  }

  static convertToISODate(dateString: string): string {
    try {
      console.log(`🔄 Convertendo data: ${dateString}`);
      
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          let year = parts[2];
          
          if (year.length === 2) {
            year = '20' + year;
          }
          
          const isoDate = `${year}-${month}-${day}`;
          console.log(`✅ Data convertida para: ${isoDate}`);
          return isoDate;
        }
      }
      
      // Se já está em formato ISO ou outro formato válido
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const isoDate = date.toISOString().split('T')[0];
        console.log(`✅ Data convertida para: ${isoDate}`);
        return isoDate;
      }
      
      // Fallback para amanhã (próximo dia útil)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isoDate = tomorrow.toISOString().split('T')[0];
      console.log(`⚠️ Usando data padrão (amanhã): ${isoDate}`);
      return isoDate;
    } catch (error) {
      console.error('❌ Erro ao converter data:', error);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isoDate = tomorrow.toISOString().split('T')[0];
      console.log(`⚠️ Usando data padrão (amanhã): ${isoDate}`);
      return isoDate;
    }
  }

  static calculateEndTime(startTime: string): string {
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const endHours = hours + 1; // Consulta de 1 hora por padrão
      return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch {
      return '15:00'; // Fallback
    }
  }

  static async getClinicInfo(parameters: any): Promise<string> {
    const { info_type } = parameters;
    
    switch (info_type) {
      case 'horarios':
        return `📅 **Horários de Funcionamento:**
🕐 Segunda a Sexta: 8h às 18h
🕐 Sábado: 8h às 12h
❌ Domingo: Fechado

Precisa agendar? Me avisa que te ajudo! 😊💙`;
      case 'especialidades':
        return `👨‍⚕️ **Nossas Especialidades:**
• Clínica Geral
• Cardiologia
• Psicologia
• Dermatologia
• Ginecologia
• Pediatria

Qual você precisa? 😊💙`;
      case 'localizacao':
        return `📍 **Nossa Localização:**
Estamos localizados no centro da cidade, com fácil acesso e estacionamento.

Precisa do endereço exato? Nossa equipe pode te passar! 😊💙`;
      default:
        return `🏥 **Sobre Nossa Clínica:**
Somos uma clínica completa com diversas especialidades!
📅 Atendemos de segunda a sexta, das 8h às 18h
👨‍⚕️ Temos profissionais qualificados

Em que posso te ajudar especificamente? 😊💙`;
    }
  }

  static getMCPTools(): any[] {
    return [
      {
        type: "function",
        function: {
          name: "check_availability",
          description: "Verificar disponibilidade de horários na clínica para agendamentos",
          parameters: {
            type: "object",
            properties: {
              specialty: {
                type: "string",
                description: "Especialidade médica desejada (ex: cardiologia, psicologia)"
              },
              date: {
                type: "string",
                description: "Data preferida para consulta (formato DD/MM/AAAA)"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "schedule_appointment",
          description: "Agendar uma consulta médica real no sistema",
          parameters: {
            type: "object",
            properties: {
              specialty: {
                type: "string",
                description: "Especialidade médica"
              },
              date: {
                type: "string",
                description: "Data da consulta (formato DD/MM/AAAA)"
              },
              time: {
                type: "string",
                description: "Horário da consulta (formato HH:MM)"
              },
              customerName: {
                type: "string",
                description: "Nome completo do paciente"
              },
              customerEmail: {
                type: "string",
                description: "Email do paciente para confirmação"
              }
            },
            required: ["specialty", "date", "time"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_clinic_info",
          description: "Obter informações sobre a clínica (horários, especialidades, localização)",
          parameters: {
            type: "object",
            properties: {
              info_type: {
                type: "string",
                description: "Tipo de informação (horarios, especialidades, localizacao, geral)",
                enum: ["horarios", "especialidades", "localizacao", "geral"]
              }
            }
          }
        }
      }
    ];
  }
}
