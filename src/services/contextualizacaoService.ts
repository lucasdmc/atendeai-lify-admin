import cardioprimeBlumenau from '../config/cardioprime-blumenau.json';
import contextualizacaoEsadi from '../data/contextualizacao-esadi.json';

export interface ClinicContext {
  id: string;
  name: string;
  specialty: string;
  doctors: any[];
  schedule: any;
  services: any[];
  location: any;
  contact: any;
  policies: any;
  assistant: any;
}

export class ContextualizacaoService {
  private static clinicData = {
    'cardioprime': cardioprimeBlumenau,
    'esadi': contextualizacaoEsadi
  };

  /**
   * Obtém contexto de uma clínica por ID
   */
  static async getClinicContext(clinicId: string): Promise<any> {
    try {
      // Em produção, isso viria do banco de dados
      const clinicData = this.clinicData[clinicId as keyof typeof this.clinicData];
      
      if (!clinicData) {
        console.log(`Clínica não encontrada: ${clinicId}`);
        return null;
      }

      return clinicData;
    } catch (error) {
      console.error('Erro ao obter contexto da clínica:', error);
      return null;
    }
  }

  /**
   * Obtém clínica por número do WhatsApp
   */
  static async getClinicByWhatsAppNumber(phoneNumber: string): Promise<ClinicContext | null> {
    try {
      // Em produção, isso seria uma consulta ao banco de dados
      // Por enquanto, retornamos uma clínica padrão
      const defaultClinic = {
        id: 'cardioprime',
        name: 'CardioPrime',
        specialty: 'Cardiologia',
              doctors: cardioprimeBlumenau.profissionais || [],
      schedule: cardioprimeBlumenau.clinica.horario_funcionamento,
      services: cardioprimeBlumenau.clinica.informacoes_basicas.especialidades_secundarias || [],
      location: cardioprimeBlumenau.clinica.localizacao,
      contact: cardioprimeBlumenau.clinica.contatos,
        policies: {
          cancellation: 'Cancelamentos devem ser feitos com 24h de antecedência',
          lateness: 'Tolerância de 15 minutos de atraso',
          payment: 'Aceitamos dinheiro, cartão e PIX',
          insurance: 'Convênios: Unimed, Bradesco Saúde, SulAmérica',
          parking: 'Estacionamento gratuito disponível'
        },
        assistant: {
          name: 'Dr. Carlos',
          personality: 'Acolhedor, profissional e empático',
          greeting: 'Olá! Sou o Dr. Carlos, assistente virtual da CardioPrime. Como posso ajudar você hoje?',
          capabilities: [
            'Informações sobre médicos e especialidades',
            'Horários de funcionamento',
            'Serviços oferecidos',
            'Orientações para agendamento',
            'Localização e contato'
          ],
          limitations: [
            'Não posso dar conselhos médicos',
            'Não posso agendar consultas diretamente',
            'Para emergências, procure atendimento médico imediato'
          ]
        }
      };

      return defaultClinic;
    } catch (error) {
      console.error('Erro ao obter clínica por WhatsApp:', error);
      return null;
    }
  }

  /**
   * Gera prompt do sistema baseado no contexto da clínica
   */
  static generateSystemPromptFromContext(context: ClinicContext): string {
    return `
Você é o ${context.assistant.name}, assistente virtual da ${context.name}.

${context.assistant.personality}

${context.assistant.greeting}

INFORMAÇÕES DA CLÍNICA:
- Nome: ${context.name}
- Especialidade: ${context.specialty}
- Endereço: ${context.location.endereco_principal.logradouro}, ${context.location.endereco_principal.numero}, ${context.location.endereco_principal.bairro}, ${context.location.endereco_principal.cidade}/${context.location.endereco_principal.estado}
- Telefone: ${context.contact.telefone_principal}
- WhatsApp: ${context.contact.whatsapp}

HORÁRIOS DE FUNCIONAMENTO:
${Object.entries(context.schedule).map(([day, hours]: [string, any]) => {
  if (hours && hours.abertura && hours.fechamento) {
    const dayNames: { [key: string]: string } = {
      segunda: 'Segunda-feira',
      terca: 'Terça-feira',
      quarta: 'Quarta-feira',
      quinta: 'Quinta-feira',
      sexta: 'Sexta-feira',
      sabado: 'Sábado',
      domingo: 'Domingo'
    };
    return `${dayNames[day] || day}: ${hours.abertura} às ${hours.fechamento}`;
  }
  return null;
}).filter(Boolean).join('\n')}

SERVIÇOS OFERECIDOS:
${context.services.join(', ')}

MÉDICOS DISPONÍVEIS:
${context.doctors.map((doctor: any) => 
  `${doctor.nome_exibicao} - ${doctor.especialidades.join(', ')}`
).join('\n')}

POLÍTICAS IMPORTANTES:
${Object.entries(context.policies).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

CAPACIDADES:
${context.assistant.capabilities.map(cap => `- ${cap}`).join('\n')}

LIMITAÇÕES:
${context.assistant.limitations.map(lim => `- ${lim}`).join('\n')}

INSTRUÇÕES:
1. Seja sempre cordial e profissional
2. Forneça informações precisas sobre a clínica
3. Se o paciente quiser agendar, oriente sobre o processo
4. Para emergências, oriente a procurar atendimento médico imediato
5. Não dê conselhos médicos específicos
6. Mantenha o tom acolhedor e empático
`;
  }

  /**
   * Obtém horários de funcionamento de uma clínica
   */
  static getWorkingHours(clinicId: string): any {
    const clinicData = this.clinicData[clinicId as keyof typeof this.clinicData];
    return clinicData?.clinica?.horario_funcionamento || null;
  }

  /**
   * Obtém profissionais de uma clínica
   */
  static getProfessionals(clinicId: string): any[] {
    const clinicData = this.clinicData[clinicId as keyof typeof this.clinicData];
    return clinicData?.profissionais || [];
  }

  /**
   * Obtém serviços de uma clínica
   */
  static getServices(clinicId: string): string[] {
    const clinicData = this.clinicData[clinicId as keyof typeof this.clinicData];
    return clinicData?.clinica?.informacoes_basicas?.especialidades_secundarias || [];
  }
} 