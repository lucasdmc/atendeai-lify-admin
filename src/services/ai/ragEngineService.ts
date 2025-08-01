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
  private static knowledgeBase: any[] | null = null;
  
  /**
   * Inicializa ou atualiza a base de conhecimento do RAG
   */
  static async initializeKnowledgeBase(): Promise<void> {
    try {
      // Buscar dados de contextualização da tabela clinics
      const { data: clinicData, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('has_contextualization', true)
        .single();

      if (error) {
        console.error('❌ Error fetching clinic data:', error);
        throw error;
      }

      if (clinicData && clinicData.contextualization_json) {
        this.knowledgeBase = this.parseContextualizationData(clinicData.contextualization_json);
        console.log(`✅ Knowledge base initialized with ${this.knowledgeBase.length} items from clinic: ${clinicData.name}`);
      } else {
        console.warn('⚠️ No contextualization data found, using fallback');
        this.knowledgeBase = this.getFallbackData();
      }
    } catch (error) {
      console.error('❌ Error initializing knowledge base:', error);
      // Usar dados padrão se não conseguir carregar
      this.knowledgeBase = this.getFallbackData();
    }
  }

  /**
   * Constrói base de conhecimento a partir de dados de contextualização
   */
  private static parseContextualizationData(contextData: any): any[] {
    const knowledgeBase: any[] = [];
    
    // Extrair informações básicas da clínica
    if (contextData.clinica) {
      if (contextData.clinica.informacoes_basicas) {
        knowledgeBase.push({
          title: 'Informações da Clínica',
          content: `Nome: ${contextData.clinica.informacoes_basicas.nome}\nEspecialidade: ${contextData.clinica.informacoes_basicas.especialidade_principal}\nMissão: ${contextData.clinica.informacoes_basicas.missao}`,
          category: 'institucional',
          tags: ['clínica', 'informações']
        });
      }
      
      if (contextData.clinica.localizacao) {
        knowledgeBase.push({
          title: 'Endereço da Clínica',
          content: contextData.clinica.localizacao.endereco_principal?.logradouro || 'Endereço não informado',
          category: 'localizacao',
          tags: ['endereço', 'localização']
        });
      }
      
      if (contextData.clinica.contatos) {
        knowledgeBase.push({
          title: 'Contatos',
          content: `Telefone: ${contextData.clinica.contatos.telefone_principal}\nWhatsApp: ${contextData.clinica.contatos.whatsapp}\nEmail: ${contextData.clinica.contatos.email_principal}`,
          category: 'contatos',
          tags: ['telefone', 'whatsapp', 'email']
        });
      }
      
      if (contextData.clinica.horario_funcionamento) {
        const hours = contextData.clinica.horario_funcionamento;
        let hoursContent = 'Horários de funcionamento:\n';
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
            hoursContent += `${dayNames[day] || day}: ${schedule.abertura} às ${schedule.fechamento}\n`;
          }
        });
        
        knowledgeBase.push({
          title: 'Horários de Funcionamento',
          content: hoursContent.trim(),
          category: 'horarios',
          tags: ['horário', 'funcionamento']
        });
      }
    }
    
    // Extrair informações de profissionais
    if (contextData.profissionais && Array.isArray(contextData.profissionais)) {
      const doctorsContent = contextData.profissionais.map((doctor: any) => 
        `${doctor.nome} - ${doctor.especialidade}`
      ).join('\n');
      
      knowledgeBase.push({
        title: 'Profissionais',
        content: doctorsContent,
        category: 'profissionais',
        tags: ['médicos', 'especialistas']
      });
    }
    
    // Extrair informações de serviços
    if (contextData.servicos && contextData.servicos.consultas) {
      knowledgeBase.push({
        title: 'Serviços Disponíveis',
        content: contextData.servicos.consultas.join(', '),
        category: 'servicos',
        tags: ['serviços', 'atendimento']
      });
    }
    
    // Extrair informações de convênios
    if (contextData.convenios && Array.isArray(contextData.convenios)) {
      knowledgeBase.push({
        title: 'Convênios Aceitos',
        content: contextData.convenios.join(', '),
        category: 'convenios',
        tags: ['convênios', 'planos']
      });
    }
    
    // Extrair informações do agente IA
    if (contextData.agente_ia && contextData.agente_ia.configuracao) {
      knowledgeBase.push({
        title: 'Informações do Atendimento',
        content: `Nome: ${contextData.agente_ia.configuracao.nome}\nPersonalidade: ${contextData.agente_ia.configuracao.personalidade}\nTom: ${contextData.agente_ia.configuracao.tom_comunicacao}`,
        category: 'atendimento',
        tags: ['agente', 'atendimento']
      });
    }
    
    return knowledgeBase;
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
        retrievedInfo.push(...this.retrieveHoursInfo());
        break;
      
      case 'INFO_LOCATION':
        retrievedInfo.push(...this.retrieveLocationInfo());
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
  private static retrieveHoursInfo(): RetrievedInfo[] {
    const hoursData = this.knowledgeBase?.filter(item => 
      item.category === 'horarios' || 
      item.title.toLowerCase().includes('horário') ||
      item.content.toLowerCase().includes('horário')
    ) || [];

    if (hoursData.length === 0) {
      return [{
        content: 'Horários de funcionamento não informados.',
        source: 'horarios',
        relevanceScore: 0.5
      }];
    }

    return hoursData.map(item => ({
      content: item.content,
      source: item.title || 'horarios',
      relevanceScore: 1.0,
      metadata: { category: item.category }
    }));
  }

  private static retrieveLocationInfo(): RetrievedInfo[] {
    const locationData = this.knowledgeBase?.filter(item => 
      item.category === 'localizacao' || 
      item.title.toLowerCase().includes('endereço') ||
      item.content.toLowerCase().includes('endereço')
    ) || [];

    if (locationData.length === 0) {
      return [{
        content: 'Endereço não informado.',
        source: 'localizacao',
        relevanceScore: 0.5
      }];
    }

    return locationData.map(item => ({
      content: item.content,
      source: item.title || 'localizacao',
      relevanceScore: 1.0,
      metadata: { category: item.category }
    }));
  }

  private static retrieveServicesInfo(serviceQuery?: string): RetrievedInfo[] {
    let servicesData = this.knowledgeBase?.filter(item => 
      item.category === 'servicos' || 
      item.title.toLowerCase().includes('serviço') ||
      item.content.toLowerCase().includes('serviço')
    ) || [];

    if (serviceQuery) {
      // Filtrar por serviço específico
      servicesData = servicesData.filter(item =>
        item.content.toLowerCase().includes(serviceQuery.toLowerCase()) ||
        item.title.toLowerCase().includes(serviceQuery.toLowerCase())
      );
    }

    if (servicesData.length === 0) {
      return [{
        content: 'Serviços não informados.',
        source: 'servicos',
        relevanceScore: 0.5
      }];
    }

    return servicesData.map(item => ({
      content: item.content,
      source: item.title || 'servicos',
      relevanceScore: serviceQuery ? 0.9 : 0.8,
      metadata: { category: item.category }
    }));
  }

  private static retrieveDoctorsInfo(specialty?: string): RetrievedInfo[] {
    let doctorsData = this.knowledgeBase?.filter(item => 
      item.category === 'profissionais' || 
      item.title.toLowerCase().includes('médico') ||
      item.content.toLowerCase().includes('médico')
    ) || [];

    if (specialty) {
      doctorsData = doctorsData.filter(item =>
        item.content.toLowerCase().includes(specialty.toLowerCase()) ||
        item.title.toLowerCase().includes(specialty.toLowerCase())
      );
    }

    if (doctorsData.length === 0) {
      return [{
        content: 'Profissionais não informados.',
        source: 'profissionais',
        relevanceScore: 0.5
      }];
    }

    return doctorsData.map(item => ({
      content: item.content,
      source: item.title || 'profissionais',
      relevanceScore: specialty ? 0.9 : 0.8,
      metadata: { category: item.category }
    }));
  }

  private static retrievePricesInfo(_service?: string): RetrievedInfo[] {
    const pricesData = this.knowledgeBase?.filter(item => 
      item.category === 'precos' || 
      item.title.toLowerCase().includes('preço') ||
      item.content.toLowerCase().includes('preço')
    ) || [];

    if (pricesData.length === 0) {
      return [{
        content: 'Para informações sobre preços, entre em contato conosco pelo telefone ou WhatsApp.',
        source: 'precos',
        relevanceScore: 0.7
      }];
    }

    return pricesData.map(item => ({
      content: item.content,
      source: item.title || 'precos',
      relevanceScore: 0.8,
      metadata: { category: item.category }
    }));
  }

  private static retrieveAppointmentInfo(): RetrievedInfo[] {
    const appointmentData = this.knowledgeBase?.filter(item => 
      item.category === 'agendamento' || 
      item.title.toLowerCase().includes('agendamento') ||
      item.content.toLowerCase().includes('agendamento')
    ) || [];

    if (appointmentData.length === 0) {
      return [{
        content: 'Informações sobre agendamentos não disponíveis.',
        source: 'agendamento',
        relevanceScore: 0.5
      }];
    }

    return appointmentData.map(item => ({
      content: item.content,
      source: item.title || 'agendamento',
      relevanceScore: 0.9,
      metadata: { category: item.category }
    }));
  }

  private static generalSearch(query: string): RetrievedInfo[] {
    const results: RetrievedInfo[] = [];
    const lowerQuery = query.toLowerCase();

    // Busca por relevância semântica
    const relevantItems = this.knowledgeBase?.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(lowerQuery);
      const contentMatch = item.content.toLowerCase().includes(lowerQuery);
      const categoryMatch = item.category.toLowerCase().includes(lowerQuery);
      
      return titleMatch || contentMatch || categoryMatch;
    }) || [];

    return relevantItems.map(item => ({
      content: item.content,
      source: item.title || item.category,
      relevanceScore: 0.7,
      metadata: { category: item.category }
    }));
  }

  /**
   * Dados de fallback caso não encontre dados na tabela
   */
  private static getFallbackData(): any[] {
    return [
      {
        title: 'Horários de Funcionamento',
        content: 'Segunda a Sexta: 08:00 às 18:00\nSábado: 08:00 às 12:00',
        category: 'horarios',
        tags: ['horário', 'funcionamento']
      },
      {
        title: 'Endereço da Clínica',
        content: 'Rua das Flores, 123 - Centro, São Paulo/SP',
        category: 'localizacao',
        tags: ['endereço', 'localização']
      },
      {
        title: 'Serviços Disponíveis',
        content: 'Consultas médicas, exames laboratoriais, ultrassonografia',
        category: 'servicos',
        tags: ['serviços', 'atendimento']
      }
    ];
  }
} 