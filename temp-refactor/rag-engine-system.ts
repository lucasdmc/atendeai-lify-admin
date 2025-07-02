// src/services/ai/ragEngineService.ts

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
      // Buscar JSON completo da clínica
      const { data: clinicData } = await supabase
        .from('clinics')
        .select('knowledge_base')
        .single();

      if (!clinicData?.knowledge_base) {
        throw new Error('Knowledge base not found');
      }

      const kb = clinicData.knowledge_base;

      // Estruturar base de conhecimento otimizada para busca
      this.knowledgeBase = {
        // Informações Básicas
        basicInfo: {
          name: kb.clinica.informacoes_basicas.nome,
          razaoSocial: kb.clinica.informacoes_basicas.razao_social,
          cnpj: kb.clinica.informacoes_basicas.cnpj,
          especialidadePrincipal: kb.clinica.informacoes_basicas.especialidade_principal,
          especialidadesSecundarias: kb.clinica.informacoes_basicas.especialidades_secundarias,
          descricao: kb.clinica.informacoes_basicas.descricao,
          missao: kb.clinica.informacoes_basicas.missao,
          valores: kb.clinica.informacoes_basicas.valores,
          diferenciais: kb.clinica.informacoes_basicas.diferenciais
        },
        
        // Localização
        location: {
          principal: kb.clinica.localizacao.endereco_principal,
          unidades: kb.clinica.localizacao.unidades_adicionais || []
        },
        
        // Contatos
        contacts: kb.clinica.contatos,
        
        // Horários
        hours: kb.clinica.horario_funcionamento,
        
        // Profissionais
        professionals: kb.profissionais || [],
        
        // Serviços
        services: {
          consultas: kb.servicos.consultas || [],
          exames: kb.servicos.exames || [],
          procedimentos: kb.servicos.procedimentos || [],
          cirurgias: kb.servicos.cirurgias || []
        },
        
        // Convênios
        insurance: kb.convenios || [],
        
        // Formas de Pagamento
        payment: kb.formas_pagamento,
        
        // Políticas
        policies: kb.politicas,
        
        // Regras de Agendamento
        schedulingRules: kb.regras_agendamento,
        
        // Estrutura Física
        infrastructure: kb.estrutura_fisica,
        
        // Configuração do Agente IA
        aiAgent: kb.agente_ia,
        
        // Metadados
        metadata: {
          lastUpdate: kb.metadados?.data_ultima_atualizacao || new Date().toISOString(),
          version: kb.metadados?.versao_schema || '2.0'
        }
      };

      console.log('✅ Knowledge base initialized with full JSON structure');
    } catch (error) {
      console.error('❌ Error initializing knowledge base:', error);
      throw error;
    }
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

  // Métodos de busca específicos adaptados para novo JSON
  private static retrieveHoursInfo(): RetrievedInfo {
    const hours = this.knowledgeBase?.hours;
    if (!hours) {
      return {
        content: 'Horário de funcionamento não disponível',
        source: 'Horários',
        relevanceScore: 0.5
      };
    }

    let content = 'Horário de funcionamento:\n';
    const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
    const diasPt = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    
    dias.forEach((dia, index) => {
      if (hours[dia]) {
        content += `${diasPt[index]}: ${hours[dia].abertura} às ${hours[dia].fechamento}\n`;
      }
    });
    
    if (hours.feriados) {
      content += 'Atendemos em feriados (confirmar horário especial)';
    }
    
    if (hours.observacoes) {
      content += `\nObservações: ${hours.observacoes}`;
    }

    return {
      content,
      source: 'Horário de Funcionamento',
      relevanceScore: 1.0
    };
  }

  private static retrieveLocationInfo(): RetrievedInfo {
    const location = this.knowledgeBase?.location?.principal;
    const contacts = this.knowledgeBase?.contacts;
    
    if (!location) {
      return {
        content: 'Informações de localização não disponíveis',
        source: 'Localização',
        relevanceScore: 0.5
      };
    }

    let content = `Endereço principal: ${location.logradouro}, ${location.numero}`;
    if (location.complemento) content += `, ${location.complemento}`;
    content += ` - ${location.bairro}, ${location.cidade}/${location.estado}`;
    content += ` - CEP: ${location.cep}`;
    
    if (contacts) {
      content += `\n\nContatos:`;
      content += `\nTelefone: ${contacts.telefone_principal}`;
      if (contacts.whatsapp) content += `\nWhatsApp: ${contacts.whatsapp}`;
      content += `\nE-mail: ${contacts.email_principal}`;
      if (contacts.website) content += `\nSite: ${contacts.website}`;
    }

    // Adicionar informações de outras unidades se houver
    const unidades = this.knowledgeBase?.location?.unidades;
    if (unidades && unidades.length > 0) {
      content += `\n\nOutras unidades:`;
      unidades.forEach((unidade: any) => {
        content += `\n- ${unidade.nome}: ${unidade.endereco.logradouro}, ${unidade.endereco.numero} - ${unidade.endereco.bairro}`;
      });
    }

    return {
      content,
      source: 'Localização e Contatos',
      relevanceScore: 1.0
    };
  }

  private static retrieveServicesInfo(serviceQuery?: string): RetrievedInfo[] {
    const services = this.knowledgeBase?.services;
    if (!services) return [];
    
    const results: RetrievedInfo[] = [];
    
    // Buscar em consultas
    if (services.consultas) {
      const consultas = serviceQuery 
        ? services.consultas.filter((c: any) => 
            c.nome.toLowerCase().includes(serviceQuery.toLowerCase()) ||
            c.especialidade?.toLowerCase().includes(serviceQuery.toLowerCase())
          )
        : services.consultas;
      
      consultas.forEach((consulta: any) => {
        results.push({
          content: `${consulta.nome} (${consulta.especialidade}): ${consulta.descricao}. Duração: ${consulta.duracao_minutos} min. Valor particular: R$ ${consulta.preco_particular}`,
          source: 'Consultas',
          relevanceScore: 0.9
        });
      });
    }
    
    // Buscar em exames
    if (services.exames && (!serviceQuery || serviceQuery.toLowerCase().includes('exame'))) {
      services.exames.forEach((exame: any) => {
        if (!serviceQuery || exame.nome.toLowerCase().includes(serviceQuery.toLowerCase())) {
          results.push({
            content: `Exame: ${exame.nome} - ${exame.descricao}. Prazo resultado: ${exame.resultado_prazo_dias} dias`,
            source: 'Exames',
            relevanceScore: 0.8
          });
        }
      });
    }
    
    // Buscar em procedimentos
    if (services.procedimentos) {
      services.procedimentos.forEach((proc: any) => {
        if (!serviceQuery || proc.nome.toLowerCase().includes(serviceQuery.toLowerCase())) {
          results.push({
            content: `Procedimento: ${proc.nome} - ${proc.descricao}. Duração: ${proc.duracao_minutos} min`,
            source: 'Procedimentos',
            relevanceScore: 0.8
          });
        }
      });
    }
    
    return results;
  }

  private static retrieveDoctorsInfo(specialty?: string): RetrievedInfo[] {
    const professionals = this.knowledgeBase?.professionals || [];
    
    let filtered = professionals;
    if (specialty) {
      filtered = professionals.filter((p: any) => 
        p.especialidades?.some((e: string) => 
          e.toLowerCase().includes(specialty.toLowerCase())
        )
      );
    }
    
    return filtered.map((prof: any) => {
      let content = `${prof.titulo} ${prof.nome_exibicao || prof.nome_completo}`;
      content += ` - ${prof.especialidades.join(', ')}`;
      if (prof.crm) content += ` (CRM: ${prof.crm})`;
      
      // Adicionar horários de disponibilidade
      const dias = Object.keys(prof.horarios_disponibilidade || {});
      if (dias.length > 0) {
        content += '\nAtende: ';
        const diasAtendimento = dias.filter(d => 
          prof.horarios_disponibilidade[d] && prof.horarios_disponibilidade[d].length > 0
        );
        content += diasAtendimento.join(', ');
      }
      
      return {
        content,
        source: 'Profissionais',
        relevanceScore: specialty ? 0.95 : 0.85
      };
    });
  }

  private static retrievePricesInfo(service?: string): RetrievedInfo[] {
    const info: RetrievedInfo[] = [];
    const payment = this.knowledgeBase?.payment;
    const insurance = this.knowledgeBase?.insurance || [];
    
    // Informações de pagamento
    if (payment) {
      let paymentInfo = 'Formas de pagamento aceitas: ';
      const formas = [];
      if (payment.dinheiro) formas.push('Dinheiro');
      if (payment.cartao_credito) formas.push('Cartão de Crédito');
      if (payment.cartao_debito) formas.push('Cartão de Débito');
      if (payment.pix) formas.push('PIX');
      if (payment.transferencia) formas.push('Transferência');
      if (payment.boleto) formas.push('Boleto');
      
      paymentInfo += formas.join(', ');
      
      if (payment.parcelamento?.disponivel) {
        paymentInfo += `\nParcelamento: até ${payment.parcelamento.max_parcelas}x`;
        if (payment.parcelamento.valor_minimo_parcela) {
          paymentInfo += ` (parcela mínima R$ ${payment.parcelamento.valor_minimo_parcela})`;
        }
      }
      
      if (payment.desconto_a_vista?.disponivel) {
        paymentInfo += `\nDesconto à vista: ${payment.desconto_a_vista.percentual}%`;
      }
      
      info.push({
        content: paymentInfo,
        source: 'Formas de Pagamento',
        relevanceScore: 0.9
      });
    }
    
    // Convênios
    if (insurance.length > 0) {
      const conveniosAtivos = insurance.filter((c: any) => c.ativo);
      info.push({
        content: `Convênios aceitos: ${conveniosAtivos.map((c: any) => c.nome).join(', ')}`,
        source: 'Convênios',
        relevanceScore: 0.85
      });
    }
    
    // Preços específicos de serviços
    if (service) {
      const services = this.knowledgeBase?.services;
      
      // Buscar preço em consultas
      const consulta = services?.consultas?.find((c: any) => 
        c.nome.toLowerCase().includes(service.toLowerCase())
      );
      if (consulta) {
        info.push({
          content: `${consulta.nome}: R$ ${consulta.preco_particular} (particular)`,
          source: 'Tabela de Preços - Consultas',
          relevanceScore: 1.0
        });
      }
      
      // Buscar em exames
      const exame = services?.exames?.find((e: any) => 
        e.nome.toLowerCase().includes(service.toLowerCase())
      );
      if (exame) {
        info.push({
          content: `${exame.nome}: R$ ${exame.preco_particular} (particular)`,
          source: 'Tabela de Preços - Exames',
          relevanceScore: 1.0
        });
      }
    }
    
    return info;
  }

  private static retrieveAppointmentInfo(): RetrievedInfo[] {
    return [
      {
        content: 'Para agendar uma consulta, preciso de: data desejada, horário preferencial, tipo de consulta/especialidade',
        source: 'Processo de Agendamento',
        relevanceScore: 0.9
      },
      {
        content: `Horário de atendimento: ${this.knowledgeBase?.basicInfo.hours || 'Segunda a Sexta, 8h às 18h'}`,
        source: 'Horários Disponíveis',
        relevanceScore: 0.8
      }
    ];
  }

  private static generalSearch(query: string): RetrievedInfo[] {
    const results: RetrievedInfo[] = [];
    const queryLower = query.toLowerCase();
    
    // Busca em FAQs
    const faqs = this.knowledgeBase?.faqs || [];
    faqs.forEach((faq: any) => {
      if (faq.question.toLowerCase().includes(queryLower) ||
          faq.answer.toLowerCase().includes(queryLower)) {
        results.push({
          content: `${faq.question}: ${faq.answer}`,
          source: 'Perguntas Frequentes',
          relevanceScore: 0.7
        });
      }
    });
    
    // Busca em políticas
    const policies = this.knowledgeBase?.policies || [];
    policies.forEach((policy: any) => {
      if (policy.title.toLowerCase().includes(queryLower) ||
          policy.content.toLowerCase().includes(queryLower)) {
        results.push({
          content: `${policy.title}: ${policy.content}`,
          source: 'Políticas da Clínica',
          relevanceScore: 0.6
        });
      }
    });
    
    return results;
  }

  // Métodos auxiliares para parsing
  private static findAnswer(contextData: any[], question: string): string {
    const item = contextData?.find(d => 
      d.question.toLowerCase().includes(question.toLowerCase())
    );
    return item?.answer || '';
  }

  private static parseServices(contextData: any[]): any[] {
    const servicesItem = contextData?.find(d => 
      d.question.toLowerCase().includes('serviços') ||
      d.question.toLowerCase().includes('especialidades')
    );
    
    if (!servicesItem?.answer) return [];
    
    // Tentar parsear como JSON ou lista
    try {
      return JSON.parse(servicesItem.answer);
    } catch {
      // Se não for JSON, tentar extrair lista
      return servicesItem.answer
        .split(/[,;]/)
        .map((s: string) => ({ name: s.trim(), description: '' }));
    }
  }

  private static parseDoctors(contextData: any[]): any[] {
    const doctorsItem = contextData?.find(d => 
      d.question.toLowerCase().includes('médicos') ||
      d.question.toLowerCase().includes('profissionais')
    );
    
    if (!doctorsItem?.answer) return [];
    
    try {
      return JSON.parse(doctorsItem.answer);
    } catch {
      return doctorsItem.answer
        .split(/[,;]/)
        .map((d: string) => {
          const parts = d.trim().split('-');
          return {
            name: parts[0]?.trim(),
            specialty: parts[1]?.trim() || ''
          };
        });
    }
  }

  private static parseProcedures(contextData: any[]): any[] {
    const item = contextData?.find(d => 
      d.question.toLowerCase().includes('procedimentos')
    );
    return item?.answer ? this.parseListAnswer(item.answer) : [];
  }

  private static parseInsurance(contextData: any[]): string[] {
    const item = contextData?.find(d => 
      d.question.toLowerCase().includes('convênio')
    );
    return item?.answer ? this.parseListAnswer(item.answer) : [];
  }

  private static parsePolicies(contextData: any[]): any[] {
    const policies = [];
    
    // Política de cancelamento
    const cancelItem = contextData?.find(d => 
      d.question.toLowerCase().includes('cancelamento')
    );
    if (cancelItem?.answer) {
      policies.push({
        title: 'Política de Cancelamento',
        content: cancelItem.answer
      });
    }
    
    // Política de atraso
    const delayItem = contextData?.find(d => 
      d.question.toLowerCase().includes('atraso')
    );
    if (delayItem?.answer) {
      policies.push({
        title: 'Política de Atrasos',
        content: delayItem.answer
      });
    }
    
    return policies;
  }

  private static parsePrices(contextData: any[]): Record<string, string> {
    const pricesItem = contextData?.find(d => 
      d.question.toLowerCase().includes('preço') ||
      d.question.toLowerCase().includes('valor')
    );
    
    if (!pricesItem?.answer) return {};
    
    try {
      return JSON.parse(pricesItem.answer);
    } catch {
      // Formato simples de preços
      const prices: Record<string, string> = {};
      const lines = pricesItem.answer.split('\n');
      lines.forEach((line: string) => {
        const [service, price] = line.split(':');
        if (service && price) {
          prices[service.trim()] = price.trim();
        }
      });
      return prices;
    }
  }

  private static parseFAQs(contextData: any[]): any[] {
    return contextData
      ?.filter(d => d.category === 'faq')
      ?.map(d => ({
        question: d.question,
        answer: d.answer
      })) || [];
  }

  private static parseListAnswer(answer: string): string[] {
    try {
      return JSON.parse(answer);
    } catch {
      return answer
        .split(/[,;]/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
  }
}