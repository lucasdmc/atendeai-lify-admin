import { supabase } from '@/integrations/supabase/client';

export interface RAGContext {
  query: string;
  intent: string;
  entities: Record<string, any>;
  topK?: number;
}

export interface RetrievedInfo {
  content: string;
  source: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}

export interface RAGResponse {
  retrievedInfo: RetrievedInfo[];
  augmentedPrompt: string;
  sources: string[];
}

export class RAGEngineService {
  private static knowledgeBase: Record<string, any> | null = null;
  
  /**
   * Inicializa ou atualiza a base de conhecimento do RAG
   */
  static async initializeKnowledgeBase(): Promise<void> {
    try {
      // Buscar dados de contextualização (fallback)
      const { data: contextData } = await supabase
        .from('clinics')
        .select('*')
        .single();

      if (contextData) {
        this.knowledgeBase = this.buildKnowledgeBaseFromContext([]);
      } else {
        throw new Error('No clinic data found');
      }

      console.log('✅ Knowledge base initialized');
    } catch (error) {
      console.error('❌ Error initializing knowledge base:', error);
      // Usar dados padrão se não conseguir carregar
      this.knowledgeBase = this.buildKnowledgeBaseFromContext([]);
    }
  }

  /**
   * Constrói base de conhecimento a partir de dados de contextualização
   */
  private static buildKnowledgeBaseFromContext(contextData: any[]): Record<string, any> {
    const kb: Record<string, any> = {
      clinica: {
        informacoes_basicas: {
          nome: this.findAnswer(contextData, 'nome da clínica') || 'Clínica Médica',
          especialidade_principal: this.findAnswer(contextData, 'especialidade principal') || 'Medicina Geral',
          missao: this.findAnswer(contextData, 'missão da clínica') || 'Cuidar da saúde dos pacientes',
          diferenciais: ['Atendimento personalizado', 'Profissionais qualificados'],
          valores: ['Ética', 'Compromisso', 'Qualidade']
        },
        localizacao: {
          endereco_principal: {
            logradouro: this.findAnswer(contextData, 'endereço') || 'Endereço não informado',
            cidade: this.findAnswer(contextData, 'cidade') || '',
            estado: this.findAnswer(contextData, 'estado') || ''
          }
        },
        contatos: {
          telefone_principal: this.findAnswer(contextData, 'telefone') || '',
          whatsapp: this.findAnswer(contextData, 'whatsapp') || '',
          email_principal: this.findAnswer(contextData, 'email') || ''
        },
        horario_funcionamento: {
          segunda: { abertura: '08:00', fechamento: '18:00' },
          terca: { abertura: '08:00', fechamento: '18:00' },
          quarta: { abertura: '08:00', fechamento: '18:00' },
          quinta: { abertura: '08:00', fechamento: '18:00' },
          sexta: { abertura: '08:00', fechamento: '18:00' }
        }
      },
      profissionais: this.parseDoctors(contextData),
      servicos: {
        consultas: this.parseServices(contextData),
        exames: [],
        procedimentos: [],
        cirurgias: []
      },
      convenios: this.parseInsurance(contextData),
      formas_pagamento: {
        dinheiro: true,
        cartao_credito: true,
        cartao_debito: true,
        pix: true
      },
      politicas: {
        agendamento: {
          cancelamento_antecedencia_horas: 24,
          reagendamento_antecedencia_horas: 24
        },
        atendimento: {
          tolerancia_atraso_minutos: 15
        }
      },
      regras_agendamento: {
        horario_inicio: '08:00',
        horario_fim: '18:00',
        duracao_padrao_minutos: 60
      },
      agente_ia: {
        configuracao: {
          nome: 'Assistente Virtual',
          personalidade: 'profissional e empática',
          tom_comunicacao: 'cordial',
          nivel_formalidade: 'formal',
          idiomas: ['pt-BR'],
          saudacao_inicial: 'Olá! Como posso ajudá-lo hoje?',
          mensagem_fora_horario: 'Estamos fora do horário de funcionamento. Deixe sua mensagem que retornaremos em breve.',
          mensagem_erro: 'Desculpe, estou com dificuldades técnicas. Tente novamente em alguns instantes.',
          mensagem_despedida: 'Obrigado por escolher nossa clínica. Tenha um ótimo dia!'
        },
        comportamento: {
          proativo: true,
          oferece_sugestoes: true,
          solicita_feedback: false,
          contexto_conversa: true
        },
        restricoes: {
          nao_pode_diagnosticar: true,
          nao_pode_prescrever: true,
          nao_pode_cancelar_sem_confirmacao: true,
          nao_pode_alterar_precos: true,
          topicos_proibidos: []
        }
      }
    };

    return kb;
  }

  /**
   * Executa a busca RAG baseada no contexto
   */
  static async retrieve(context: RAGContext): Promise<RAGResponse> {
    // Garantir que a base está inicializada
    if (!this.knowledgeBase) {
      await this.initializeKnowledgeBase();
    }

    const retrievedInfo: RetrievedInfo[] = [];
    const { query, intent, entities } = context;

    // Busca semântica baseada na intenção
    switch (intent) {
      case 'INFO_HOURS':
        retrievedInfo.push(this.retrieveHoursInfo());
        break;
      
      case 'INFO_LOCATION':
        retrievedInfo.push(this.retrieveLocationInfo());
        break;
      
      case 'INFO_SERVICES':
        retrievedInfo.push(...this.retrieveServicesInfo(entities.service));
        break;
      
      case 'INFO_DOCTORS':
        retrievedInfo.push(...this.retrieveDoctorsInfo(entities.specialty));
        break;
      
      case 'INFO_PRICES':
        retrievedInfo.push(...this.retrievePricesInfo(entities.service));
        break;
      
      case 'APPOINTMENT_CREATE':
        retrievedInfo.push(
          ...this.retrieveAppointmentInfo(),
          ...this.retrieveDoctorsInfo(entities.specialty)
        );
        break;
      
      default:
        // Busca geral por relevância
        retrievedInfo.push(...this.generalSearch(query));
    }

    // Ordenar por relevância
    retrievedInfo.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Limitar resultados
    const topResults = retrievedInfo.slice(0, context.topK || 3);

    // Construir prompt aumentado
    const augmentedPrompt = this.buildAugmentedPrompt(query, topResults);

    return {
      retrievedInfo: topResults,
      augmentedPrompt,
      sources: topResults.map(r => r.source)
    };
  }

  /**
   * Constrói o prompt aumentado com as informações recuperadas
   */
  private static buildAugmentedPrompt(query: string, retrievedInfo: RetrievedInfo[]): string {
    let prompt = `Responda a seguinte pergunta usando EXCLUSIVAMENTE as informações fornecidas abaixo.
Se a informação não estiver disponível, informe educadamente que não possui essa informação.

INFORMAÇÕES DA CLÍNICA:
`;

    retrievedInfo.forEach((info, index) => {
      prompt += `\n${index + 1}. [${info.source}]: ${info.content}`;
    });

    prompt += `\n\nPERGUNTA DO PACIENTE: ${query}`;
    prompt += `\n\nRESPOSTA (seja claro, objetivo e use as informações acima):`;

    return prompt;
  }

  // Métodos de busca específicos
  private static retrieveHoursInfo(): RetrievedInfo {
    const hours = this.knowledgeBase?.clinica?.horario_funcionamento;
    if (!hours) {
      return {
        content: 'Horários de funcionamento não informados.',
        source: 'horarios',
        relevanceScore: 0.5
      };
    }

    let content = 'Nossos horários de funcionamento:\n';
    Object.entries(hours).forEach(([day, schedule]: [string, any]) => {
      if (schedule && schedule.abertura && schedule.fechamento) {
        const dayNames: Record<string, string> = {
          segunda: 'Segunda-feira',
          terca: 'Terça-feira',
          quarta: 'Quarta-feira',
          quinta: 'Quinta-feira',
          sexta: 'Sexta-feira',
          sabado: 'Sábado',
          domingo: 'Domingo'
        };
        content += `- ${dayNames[day] || day}: ${schedule.abertura} às ${schedule.fechamento}\n`;
      }
    });

    return {
      content: content.trim(),
      source: 'horarios',
      relevanceScore: 1.0
    };
  }

  private static retrieveLocationInfo(): RetrievedInfo {
    const location = this.knowledgeBase?.clinica?.localizacao?.endereco_principal;
    if (!location) {
      return {
        content: 'Endereço não informado.',
        source: 'localizacao',
        relevanceScore: 0.5
      };
    }

    const content = `Nosso endereço: ${location.logradouro || ''}, ${location.numero || ''} - ${location.bairro || ''}, ${location.cidade || ''}/${location.estado || ''}`;

    return {
      content,
      source: 'localizacao',
      relevanceScore: 1.0
    };
  }

  private static retrieveServicesInfo(serviceQuery?: string): RetrievedInfo[] {
    const services = this.knowledgeBase?.servicos?.consultas || [];
    if (services.length === 0) {
      return [{
        content: 'Serviços não informados.',
        source: 'servicos',
        relevanceScore: 0.5
      }];
    }

    if (serviceQuery) {
      // Busca específica por serviço
      const filtered = services.filter((service: any) => 
        service.toLowerCase().includes(serviceQuery.toLowerCase())
      );
      
      if (filtered.length > 0) {
        return [{
          content: `Serviços relacionados a "${serviceQuery}": ${filtered.join(', ')}`,
          source: 'servicos',
          relevanceScore: 0.9
        }];
      }
    }

    return [{
      content: `Nossos serviços: ${services.join(', ')}`,
      source: 'servicos',
      relevanceScore: 0.8
    }];
  }

  private static retrieveDoctorsInfo(specialty?: string): RetrievedInfo[] {
    const doctors = this.knowledgeBase?.profissionais || [];
    if (doctors.length === 0) {
      return [{
        content: 'Profissionais não informados.',
        source: 'profissionais',
        relevanceScore: 0.5
      }];
    }

    if (specialty) {
      const filtered = doctors.filter((doctor: any) => 
        doctor.especialidade?.toLowerCase().includes(specialty.toLowerCase())
      );
      
      if (filtered.length > 0) {
        return [{
          content: `Profissionais de ${specialty}: ${filtered.map((d: any) => d.nome).join(', ')}`,
          source: 'profissionais',
          relevanceScore: 0.9
        }];
      }
    }

    return [{
      content: `Nossos profissionais: ${doctors.map((d: any) => `${d.nome} (${d.especialidade})`).join(', ')}`,
      source: 'profissionais',
      relevanceScore: 0.8
    }];
  }

  private static retrievePricesInfo(_service?: string): RetrievedInfo[] {
    // Implementação básica - pode ser expandida
    return [{
      content: 'Para informações sobre preços, entre em contato conosco pelo telefone ou WhatsApp.',
      source: 'precos',
      relevanceScore: 0.7
    }];
  }

  private static retrieveAppointmentInfo(): RetrievedInfo[] {
    const policies = this.knowledgeBase?.politicas?.agendamento;
    const rules = this.knowledgeBase?.regras_agendamento;
    
    let content = 'Informações sobre agendamentos:\n';
    if (policies) {
      content += `- Cancelamento: ${policies.cancelamento_antecedencia_horas}h de antecedência\n`;
      content += `- Reagendamento: ${policies.reagendamento_antecedencia_horas}h de antecedência\n`;
    }
    if (rules) {
      content += `- Horário de atendimento: ${rules.horario_inicio} às ${rules.horario_fim}\n`;
      content += `- Duração padrão: ${rules.duracao_padrao_minutos} minutos\n`;
    }

    return [{
      content: content.trim(),
      source: 'agendamento',
      relevanceScore: 0.9
    }];
  }

  private static generalSearch(query: string): RetrievedInfo[] {
    const results: RetrievedInfo[] = [];
    const lowerQuery = query.toLowerCase();

    // Busca simples por palavras-chave
    if (lowerQuery.includes('horário') || lowerQuery.includes('funciona')) {
      results.push(this.retrieveHoursInfo());
    }
    
    if (lowerQuery.includes('endereço') || lowerQuery.includes('onde')) {
      results.push(this.retrieveLocationInfo());
    }
    
    if (lowerQuery.includes('serviço') || lowerQuery.includes('atende')) {
      results.push(...this.retrieveServicesInfo());
    }
    
    if (lowerQuery.includes('médico') || lowerQuery.includes('doutor')) {
      results.push(...this.retrieveDoctorsInfo());
    }

    return results;
  }

  // Métodos auxiliares
  private static findAnswer(contextData: any[], question: string): string | null {
    const item = contextData.find(d => 
      d.question.toLowerCase().includes(question.toLowerCase())
    );
    return item?.answer || null;
  }

  private static parseServices(contextData: any[]): string[] {
    const services = contextData
      .filter(d => d.category === 'procedimentos_especialidades')
      .map(d => d.answer)
      .filter(Boolean);
    
    return services.length > 0 ? services : ['Consulta Geral'];
  }

  private static parseDoctors(contextData: any[]): any[] {
    const doctors = contextData
      .filter(d => d.category === 'profissionais')
      .map(d => {
        const parts = d.answer?.split(' - ') || [];
        return {
          nome: parts[0] || d.answer,
          especialidade: parts[1] || 'Medicina Geral'
        };
      })
      .filter(d => d.nome);
    
    return doctors.length > 0 ? doctors : [
      { nome: 'Dr. João Silva', especialidade: 'Medicina Geral' }
    ];
  }

  private static parseInsurance(contextData: any[]): string[] {
    const insurance = contextData
      .filter(d => d.question.toLowerCase().includes('convênio'))
      .map(d => d.answer)
      .filter(Boolean);
    
    return insurance.length > 0 ? insurance : ['Particular'];
  }
} 