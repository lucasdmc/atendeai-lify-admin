
// MCP Tools Processor para integração com ferramentas do sistema
export class MCPToolsProcessor {
  static async processToolCall(toolName: string, parameters: any, supabase: any): Promise<string> {
    console.log(`🔧 Processando ferramenta MCP: ${toolName}`);
    
    try {
      switch (toolName) {
        case 'check_availability':
          return await this.checkAvailability(parameters, supabase);
        case 'schedule_appointment':
          return await this.scheduleAppointment(parameters, supabase);
        case 'get_clinic_info':
          return await this.getClinicInfo(parameters);
        default:
          return `Ferramenta ${toolName} não reconhecida.`;
      }
    } catch (error) {
      console.error(`❌ Erro ao processar ferramenta ${toolName}:`, error);
      return `Erro ao processar ${toolName}.`;
    }
  }

  static async checkAvailability(parameters: any, supabase: any): Promise<string> {
    try {
      console.log('🔍 Verificando disponibilidade real na agenda...');
      
      // Verificar disponibilidade usando o sistema real de agendamentos
      const { data: events, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Erro ao consultar agenda:', error);
        return 'Vou verificar nossa agenda e te retorno em instantes! 💙';
      }

      const { specialty, date } = parameters;
      
      if (events && events.length > 0) {
        // Filtrar por especialidade se fornecida
        const filteredEvents = specialty 
          ? events.filter(event => 
              event.title.toLowerCase().includes(specialty.toLowerCase()) ||
              event.description?.toLowerCase().includes(specialty.toLowerCase())
            )
          : events;

        if (filteredEvents.length > 0) {
          return `Perfeito! Encontrei horários disponíveis${specialty ? ` para ${specialty}` : ''}! 😊\nVou te mostrar as opções. Qual data você prefere? 💙`;
        }
      }

      return `No momento nossa agenda está bem cheia${specialty ? ` para ${specialty}` : ''}.\nMas posso te colocar em nossa lista de espera ou verificar outras datas.\nQual você prefere? 💙`;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return 'Vou consultar nossa agenda e te retorno rapidinho! 💙';
    }
  }

  static async scheduleAppointment(parameters: any, supabase: any): Promise<string> {
    try {
      console.log('📅 Criando agendamento real...');
      const { specialty, date, time, customerName, customerEmail } = parameters;
      
      // Usar o sistema real de agendamentos via edge function
      const appointmentData = {
        action: 'create',
        appointmentData: {
          title: `${specialty || 'Consulta'} - ${customerName || 'Paciente via WhatsApp'}`,
          description: `Agendamento realizado via WhatsApp\nPaciente: ${customerName || 'Não informado'}\nEmail: ${customerEmail || 'Não informado'}`,
          date: date,
          startTime: time,
          endTime: this.calculateEndTime(time),
          patientEmail: customerEmail,
          location: 'Clínica'
        }
      };

      // Chamar a função de agendamento real
      const { data, error } = await supabase.functions.invoke('appointment-manager', {
        body: appointmentData
      });

      if (error) {
        console.error('Erro ao criar agendamento:', error);
        return `Tive uma dificuldade para confirmar o agendamento. 😔\nMas nossa equipe vai entrar em contato para finalizar!\nAnote: ${specialty} - ${date} às ${time} 💙`;
      }

      if (data && data.success) {
        return `✅ Agendamento confirmado com sucesso!\n\n📅 **${specialty || 'Consulta'}**\n🗓️ Data: ${date}\n🕐 Horário: ${time}\n${customerName ? `👤 Paciente: ${customerName}` : ''}\n📍 Local: Clínica\n\n${customerEmail ? 'Você receberá uma confirmação por email!' : 'Nossa equipe entrará em contato para confirmação!'} 😊💙`;
      }

      return `Agendamento processado! 😊\nNossa equipe vai confirmar todos os detalhes:\n📅 ${specialty} - ${date} às ${time}\nAguarde nosso contato! 💙`;
    } catch (error) {
      console.error('Erro ao agendar:', error);
      return `Anotei sua solicitação de agendamento! 😊\n📅 ${parameters.specialty} - ${parameters.date} às ${parameters.time}\nNossa equipe vai entrar em contato para confirmar! 💙`;
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
        return `📅 **Horários de Funcionamento:**\n🕐 Segunda a Sexta: 8h às 18h\n🕐 Sábado: 8h às 12h\n❌ Domingo: Fechado\n\nPrecisa agendar? Me avisa que te ajudo! 😊💙`;
      case 'especialidades':
        return `👨‍⚕️ **Nossas Especialidades:**\n• Clínica Geral\n• Cardiologia\n• Psicologia\n• Dermatologia\n• Ginecologia\n• Pediatria\n\nQual você precisa? 😊💙`;
      case 'localizacao':
        return `📍 **Nossa Localização:**\nEstamos localizados no centro da cidade, com fácil acesso e estacionamento.\n\nPrecisa do endereço exato? Nossa equipe pode te passar! 😊💙`;
      default:
        return `🏥 **Sobre Nossa Clínica:**\nSomos uma clínica completa com diversas especialidades!\n📅 Atendemos de segunda a sexta, das 8h às 18h\n👨‍⚕️ Temos profissionais qualificados\n\nEm que posso te ajudar especificamente? 😊💙`;
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
