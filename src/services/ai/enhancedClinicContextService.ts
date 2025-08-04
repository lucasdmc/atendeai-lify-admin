// src/services/ai/enhancedClinicContextService.ts
// Sistema de navegação inteligente do JSON baseado nas sugestões do Manus

import { supabase } from '@/integrations/supabase/client';

export interface NavigationData {
  critical: SectionData[];
  high: SectionData[];
  medium: SectionData[];
  low: SectionData[];
}

export interface SectionData {
  path: string;
  data: any;
  processed: string;
  tokens: number;
}

export interface OptimizedPrompt {
  prompt: string;
  tokensUsed: number;
  tokensAvailable: number;
  sectionsIncluded: number;
  intent: string;
}

export class EnhancedClinicContextService {
  private cache: Map<string, any> = new Map();
  private ttl = 30 * 60 * 1000; // 30 minutos
  private maxTokens = 4000;
  private reservedTokens = 1000;
  private availableTokens = this.maxTokens - this.reservedTokens;
  
  private priorityMap: Map<string, string>;
  private sectionProcessors: Record<string, Function>;
  private intentMap: Record<string, string[]>;

  constructor() {
    this.priorityMap = this.buildPriorityMap();
    this.sectionProcessors = this.buildSectionProcessors();
    this.intentMap = this.buildIntentMap();
  }

  /**
   * Função principal - navegação inteligente do JSON
   */
  async getEnhancedClinicContextualization(clinicId: string, userMessage: string = '', intent: string = 'general'): Promise<any> {
    try {
      console.log('🔍 [EnhancedClinicContext] Buscando contextualização avançada', { clinicId, intent });

      // Busca dados da clínica
      const { data: clinic, error } = await supabase
        .from('clinics')
        .select('id, contextualization, name, working_hours, specialties, address, phone, email')
        .eq('id', clinicId)
        .single();

      if (error) {
        console.error('❌ [EnhancedClinicContext] Erro ao buscar clínica:', error);
        return null;
      }

      if (!clinic) {
        console.warn('⚠️ [EnhancedClinicContext] Clínica não encontrada:', { clinicId });
        return null;
      }

      // Verifica cache
      const cacheKey = this.getCacheKey(clinicId, clinic.contextualization);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('📦 [EnhancedClinicContext] Usando contextualização do cache');
        return this.adaptToIntent(cached, userMessage, intent);
      }

      // Processa contextualização completa
      const contextualization = clinic.contextualization || {};
      const navigationData = await this.navigateJSON(contextualization, intent);
      const optimizedPrompt = this.optimizePrompt(navigationData, userMessage, intent);

      // Monta resultado final
      const result = {
        clinicId: clinic.id,
        clinicName: clinic.name || contextualization.clinica?.informacoes_basicas?.nome || 'Clínica',
        basicInfo: this.extractBasicInfo(clinic, contextualization),
        fullContext: optimizedPrompt,
        navigationData: navigationData,
        metadata: {
          tokensUsed: this.estimateTokens(optimizedPrompt.prompt),
          sectionsIncluded: this.countSections(navigationData),
          cacheKey: cacheKey,
          processedAt: new Date().toISOString()
        }
      };

      // Salva no cache
      this.saveToCache(cacheKey, result);

      console.log('✅ [EnhancedClinicContext] Contextualização avançada processada', {
        clinicId,
        tokensUsed: result.metadata.tokensUsed,
        sectionsIncluded: result.metadata.sectionsIncluded
      });

      return result;

    } catch (error) {
      console.error('💥 [EnhancedClinicContext] ERRO ao processar contextualização:', {
        error: error.message,
        clinicId
      });
      return this.getFallbackContext(clinicId);
    }
  }

  /**
   * Navega automaticamente todo o JSON
   */
  async navigateJSON(contextualization: any, intent: string = 'general'): Promise<NavigationData> {
    const navigation: NavigationData = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };

    // Explora todas as seções por prioridade
    for (const [sectionPath, priority] of this.priorityMap) {
      try {
        const data = this.extractSection(contextualization, sectionPath);
        if (data && this.hasValidData(data)) {
          const processed = this.processSection(sectionPath, data, intent);
          if (processed && processed.trim().length > 0) {
            navigation[priority as keyof NavigationData].push({
              path: sectionPath,
              data: data,
              processed: processed,
              tokens: this.estimateTokens(processed)
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ [EnhancedClinicContext] Erro ao processar seção ${sectionPath}:`, error.message);
      }
    }

    return navigation;
  }

  /**
   * Extrai seção específica do JSON usando path notation
   */
  extractSection(obj: any, path: string): any {
    try {
      const keys = path.split('.');
      let current = obj;
      
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return null;
        }
      }
      
      return current;
    } catch (error) {
      return null;
    }
  }

  /**
   * Processa seção específica baseada no tipo
   */
  processSection(sectionPath: string, data: any, intent: string): string {
    try {
      const processor = this.sectionProcessors[sectionPath];
      if (processor) {
        return processor.call(this, data, intent);
      }

      // Processador genérico para seções não mapeadas
      return this.genericProcessor(sectionPath, data);
    } catch (error) {
      console.warn(`⚠️ [EnhancedClinicContext] Erro ao processar seção ${sectionPath}:`, error.message);
      return '';
    }
  }

  /**
   * Mapa de prioridades para navegação
   */
  buildPriorityMap(): Map<string, string> {
    return new Map([
      // CRÍTICO (Sempre incluir)
      ['clinica.informacoes_basicas', 'critical'],
      ['agente_ia.configuracao', 'critical'],
      ['clinica.contatos', 'critical'],
      ['clinica.horario_funcionamento', 'critical'],

      // ALTA PRIORIDADE (Incluir se disponível)
      ['profissionais', 'high'],
      ['servicos.consultas', 'high'],
      ['servicos.exames', 'high'],
      ['convenios', 'high'],
      ['clinica.localizacao.endereco_principal', 'high'],

      // MÉDIA PRIORIDADE (Incluir conforme espaço)
      ['servicos.procedimentos', 'medium'],
      ['servicos.avaliacoes', 'medium'],
      ['servicos.cirurgias', 'medium'],
      ['formas_pagamento', 'medium'],
      ['politicas.agendamento', 'medium'],
      ['agente_ia.restricoes', 'medium'],

      // BAIXA PRIORIDADE (Incluir se sobrar espaço)
      ['politicas.atendimento', 'low'],
      ['estrutura_fisica', 'low'],
      ['informacoes_adicionais', 'low']
    ]);
  }

  /**
   * Processadores especializados por seção
   */
  buildSectionProcessors(): Record<string, Function> {
    return {
      'clinica.informacoes_basicas': (data: any, intent: string) => {
        let text = `CLÍNICA: ${data.nome || 'Nome não informado'}`;
        
        if (data.especialidade_principal) {
          text += `\nEspecialidade Principal: ${data.especialidade_principal}`;
        }
        
        if (data.especialidades_secundarias?.length > 0) {
          text += `\nEspecialidades Secundárias: ${data.especialidades_secundarias.join(', ')}`;
        }
        
        if (data.descricao) {
          text += `\nDescrição: ${data.descricao}`;
        }
        
        if (data.missao) {
          text += `\nMissão: ${data.missao}`;
        }
        
        if (data.valores?.length > 0) {
          text += `\nValores: ${data.valores.join(', ')}`;
        }
        
        if (data.diferenciais?.length > 0) {
          text += `\nDiferenciais: ${data.diferenciais.join(', ')}`;
        }
        
        if (data.historia) {
          text += `\nHistória: ${data.historia}`;
        }
        
        return text;
      },

      'agente_ia.configuracao': (data: any, intent: string) => {
        let text = `\nAGENTE IA - CONFIGURAÇÃO:`;
        text += `\nNome: ${data.nome || 'Assistente'}`;
        text += `\nPersonalidade: ${data.personalidade || 'Profissional e acolhedor'}`;
        
        if (data.tom_comunicacao) {
          text += `\nTom de Comunicação: ${data.tom_comunicacao}`;
        }
        
        if (data.saudacao_inicial) {
          text += `\nSaudação: ${data.saudacao_inicial}`;
        }
        
        if (data.mensagem_fora_horario) {
          text += `\nMensagem Fora de Horário: ${data.mensagem_fora_horario}`;
        }
        
        return text;
      },

      'profissionais': (data: any, intent: string) => {
        if (!Array.isArray(data) || data.length === 0) return '';
        
        let text = '\nPROFISSIONAIS DISPONÍVEIS:';
        
        data.filter((prof: any) => prof.ativo !== false)
            .forEach((prof: any) => {
              text += `\n\n• ${prof.nome_exibicao || prof.nome_completo}`;
              
              if (prof.crm || prof.crp || prof.crm_crp) {
                text += ` (${prof.crm || prof.crp || prof.crm_crp})`;
              }
              
              if (prof.especialidades?.length > 0) {
                text += `\n  Especialidades: ${prof.especialidades.join(', ')}`;
              }
              
              if (prof.experiencia) {
                text += `\n  Experiência: ${prof.experiencia}`;
              }
              
              if (prof.aceita_novos_pacientes !== false) {
                text += '\n  Status: Aceita novos pacientes';
              }
              
              if (prof.horarios_disponibilidade) {
                const horarios = this.formatHorarios(prof.horarios_disponibilidade);
                if (horarios) {
                  text += `\n  Horários: ${horarios}`;
                }
              }
              
              if (prof.tempo_consulta_padrao) {
                text += `\n  Duração da consulta: ${prof.tempo_consulta_padrao} minutos`;
              }
              
              if (prof.modalidades_atendimento?.length > 0) {
                text += `\n  Modalidades: ${prof.modalidades_atendimento.join(', ')}`;
              }
            });
        
        return text;
      },

      'servicos.consultas': (data: any, intent: string) => {
        if (!Array.isArray(data) || data.length === 0) return '';
        
        let text = '\nCONSULTAS DISPONÍVEIS:';
        
        data.filter((serv: any) => serv.ativo !== false)
            .forEach((consulta: any) => {
              text += `\n\n• ${consulta.nome}`;
              
              if (consulta.descricao) {
                text += `\n  Descrição: ${consulta.descricao}`;
              }
              
              if (consulta.especialidade) {
                text += `\n  Especialidade: ${consulta.especialidade}`;
              }
              
              if (consulta.duracao_minutos) {
                text += `\n  Duração: ${consulta.duracao_minutos} minutos`;
              }
              
              if (consulta.preco_particular) {
                text += `\n  Preço particular: R$ ${consulta.preco_particular.toFixed(2)}`;
              }
              
              if (consulta.aceita_convenio && consulta.convenios_aceitos?.length > 0) {
                text += `\n  Convênios aceitos: ${consulta.convenios_aceitos.join(', ')}`;
              }
              
              if (consulta.modalidades?.length > 0) {
                text += `\n  Modalidades: ${consulta.modalidades.join(', ')}`;
              }
              
              if (consulta.preparacao_necessaria) {
                text += `\n  Preparação: ${consulta.preparacao_necessaria}`;
              }
            });
        
        return text;
      },

      'servicos.exames': (data: any, intent: string) => {
        if (!Array.isArray(data) || data.length === 0) return '';
        
        let text = '\nEXAMES DISPONÍVEIS:';
        
        data.filter((exam: any) => exam.ativo !== false)
            .forEach((exame: any) => {
              text += `\n\n• ${exame.nome}`;
              
              if (exame.descricao) {
                text += `\n  Descrição: ${exame.descricao}`;
              }
              
              if (exame.categoria) {
                text += `\n  Categoria: ${exame.categoria}`;
              }
              
              if (exame.duracao_minutos) {
                text += `\n  Duração: ${exame.duracao_minutos} minutos`;
              }
              
              if (exame.preco_particular) {
                text += `\n  Preço particular: R$ ${exame.preco_particular.toFixed(2)}`;
              }
              
              if (exame.aceita_convenio && exame.convenios_aceitos?.length > 0) {
                text += `\n  Convênios aceitos: ${exame.convenios_aceitos.join(', ')}`;
              }
              
              // Preparação é CRÍTICA para exames
              if (exame.preparacao) {
                if (exame.preparacao.jejum_horas) {
                  text += `\n  ⚠️ JEJUM NECESSÁRIO: ${exame.preparacao.jejum_horas} horas`;
                }
                if (exame.preparacao.instrucoes_especiais) {
                  text += `\n  ⚠️ PREPARAÇÃO: ${exame.preparacao.instrucoes_especiais}`;
                }
              }
              
              if (exame.resultado_prazo_dias) {
                text += `\n  Resultado em: ${exame.resultado_prazo_dias} dias`;
              }
              
              if (exame.contraindicacoes?.length > 0) {
                text += `\n  Contraindicações: ${exame.contraindicacoes.join(', ')}`;
              }
            });
        
        return text;
      },

      'convenios': (data: any, intent: string) => {
        if (!Array.isArray(data) || data.length === 0) return '';
        
        let text = '\nCONVÊNIOS ACEITOS:';
        
        data.filter((conv: any) => conv.ativo !== false)
            .forEach((convenio: any) => {
              text += `\n\n• ${convenio.nome}`;
              
              if (convenio.categoria) {
                text += ` (${convenio.categoria})`;
              }
              
              if (convenio.copagamento && convenio.valor_copagamento) {
                text += `\n  Copagamento: R$ ${convenio.valor_copagamento.toFixed(2)}`;
              } else if (convenio.copagamento === false) {
                text += '\n  Sem copagamento';
              }
              
              if (convenio.autorizacao_necessaria) {
                text += '\n  ⚠️ Necessária autorização prévia';
              }
              
              if (convenio.documentos_necessarios?.length > 0) {
                text += `\n  Documentos: ${convenio.documentos_necessarios.join(', ')}`;
              }
              
              if (convenio.observacoes) {
                text += `\n  Observações: ${convenio.observacoes}`;
              }
              
              if (convenio.servicos_cobertos?.length > 0) {
                text += `\n  Serviços cobertos: ${convenio.servicos_cobertos.length} serviços`;
              }
            });
        
        return text;
      },

      'clinica.horario_funcionamento': (data: any, intent: string) => {
        let text = '\nHORÁRIO DE FUNCIONAMENTO:';
        
        const dias = {
          'segunda': 'Segunda-feira',
          'terca': 'Terça-feira',
          'quarta': 'Quarta-feira', 
          'quinta': 'Quinta-feira',
          'sexta': 'Sexta-feira',
          'sabado': 'Sábado',
          'domingo': 'Domingo'
        };

        for (const [dia, nome] of Object.entries(dias)) {
          if (data[dia]) {
            if (data[dia].abertura && data[dia].fechamento) {
              text += `\n• ${nome}: ${data[dia].abertura} às ${data[dia].fechamento}`;
            } else {
              text += `\n• ${nome}: Fechado`;
            }
          }
        }
        
        if (data.emergencia_24h) {
          text += '\n• Emergência: 24 horas';
        }
        
        if (data.observacoes) {
          text += `\n• Observações: ${data.observacoes}`;
        }
        
        return text;
      },

      'clinica.contatos': (data: any, intent: string) => {
        let text = '\nCONTATOS:';
        
        if (data.telefone_principal) {
          text += `\n• Telefone: ${data.telefone_principal}`;
        }
        
        if (data.whatsapp) {
          text += `\n• WhatsApp: ${data.whatsapp}`;
        }
        
        if (data.email_principal) {
          text += `\n• Email: ${data.email_principal}`;
        }
        
        if (data.website) {
          text += `\n• Website: ${data.website}`;
        }
        
        if (data.emails_departamentos) {
          text += '\n• Emails por departamento:';
          for (const [dept, email] of Object.entries(data.emails_departamentos)) {
            text += `\n  - ${dept}: ${email}`;
          }
        }
        
        return text;
      },

      'formas_pagamento': (data: any, intent: string) => {
        let text = '\nFORMAS DE PAGAMENTO:';
        const formas = [];
        
        if (data.dinheiro) formas.push('Dinheiro');
        if (data.cartao_credito) formas.push('Cartão de Crédito');
        if (data.cartao_debito) formas.push('Cartão de Débito');
        if (data.pix) formas.push('PIX');
        if (data.transferencia) formas.push('Transferência');
        if (data.boleto) formas.push('Boleto');
        
        if (formas.length > 0) {
          text += `\n• Aceitas: ${formas.join(', ')}`;
        }
        
        if (data.parcelamento?.disponivel) {
          text += `\n• Parcelamento: Até ${data.parcelamento.max_parcelas}x`;
          if (data.parcelamento.valor_minimo_parcela) {
            text += ` (parcela mínima: R$ ${data.parcelamento.valor_minimo_parcela.toFixed(2)})`;
          }
          if (data.parcelamento.juros) {
            text += ` - Juros: ${data.parcelamento.juros}% a.m.`;
          }
        }
        
        if (data.desconto_a_vista?.disponivel) {
          text += `\n• Desconto à vista: ${data.desconto_a_vista.percentual}%`;
        }
        
        return text;
      },

      'politicas.agendamento': (data: any, intent: string) => {
        let text = '\nPOLÍTICAS DE AGENDAMENTO:';
        
        if (data.antecedencia_minima_horas) {
          text += `\n• Antecedência mínima: ${data.antecedencia_minima_horas} horas`;
        }
        
        if (data.antecedencia_maxima_dias) {
          text += `\n• Antecedência máxima: ${data.antecedencia_maxima_dias} dias`;
        }
        
        if (data.cancelamento_antecedencia_horas) {
          text += `\n• Cancelamento: ${data.cancelamento_antecedencia_horas} horas de antecedência`;
        }
        
        if (data.reagendamento_permitido) {
          text += '\n• Reagendamento: Permitido';
          if (data.reagendamento_antecedencia_horas) {
            text += ` (${data.reagendamento_antecedencia_horas} horas de antecedência)`;
          }
        }
        
        if (data.confirmacao_necessaria) {
          text += '\n• Confirmação: Necessária';
          if (data.confirmacao_antecedencia_horas) {
            text += ` (${data.confirmacao_antecedencia_horas} horas antes)`;
          }
        }
        
        if (data.lista_espera) {
          text += '\n• Lista de espera: Disponível';
        }
        
        return text;
      }
    };
  }

  /**
   * Formata horários de disponibilidade
   */
  formatHorarios(horarios: any): string {
    const dias = {
      'segunda': 'Seg',
      'terca': 'Ter',
      'quarta': 'Qua',
      'quinta': 'Qui',
      'sexta': 'Sex',
      'sabado': 'Sáb',
      'domingo': 'Dom'
    };

    const horariosFormatados = [];
    
    for (const [dia, nome] of Object.entries(dias)) {
      if (horarios[dia] && Array.isArray(horarios[dia]) && horarios[dia].length > 0) {
        const periodos = horarios[dia]
          .map((periodo: any) => `${periodo.inicio}-${periodo.fim}`)
          .join(', ');
        horariosFormatados.push(`${nome}: ${periodos}`);
      }
    }
    
    return horariosFormatados.join(' | ');
  }

  /**
   * Otimiza prompt para caber no limite de tokens
   */
  optimizePrompt(navigationData: NavigationData, userMessage: string = '', intent: string = 'general'): OptimizedPrompt {
    let prompt = '';
    let currentTokens = 0;

    // Adiciona seções por prioridade
    const priorities = ['critical', 'high', 'medium', 'low'];
    
    for (const priority of priorities) {
      for (const section of navigationData[priority as keyof NavigationData]) {
        const sectionText = section.processed;
        const sectionTokens = section.tokens || this.estimateTokens(sectionText);
        
        if (currentTokens + sectionTokens <= this.availableTokens) {
          prompt += sectionText + '\n\n';
          currentTokens += sectionTokens;
        } else {
          // Se não cabe, tenta versão resumida
          const summarized = this.summarizeSection(sectionText);
          const summarizedTokens = this.estimateTokens(summarized);
          
          if (currentTokens + summarizedTokens <= this.availableTokens) {
            prompt += summarized + '\n\n';
            currentTokens += summarizedTokens;
          }
          // Se nem resumido cabe, para aqui
          break;
        }
      }
    }

    // Adiciona instruções específicas baseadas na intenção
    const intentInstructions = this.getIntentInstructions(intent);
    prompt += intentInstructions;

    return {
      prompt: prompt.trim(),
      tokensUsed: currentTokens,
      tokensAvailable: this.availableTokens - currentTokens,
      sectionsIncluded: this.countSections(navigationData),
      intent: intent
    };
  }

  /**
   * Instruções específicas por intenção
   */
  getIntentInstructions(intent: string): string {
    const instructions = {
      'agendamento': '\n\nINSTRUÇÕES ESPECIAIS:\n- Sempre mencione horários disponíveis dos profissionais\n- Informe sobre políticas de cancelamento\n- Pergunte sobre preferência de profissional\n- Confirme dados de contato',
      
      'precos': '\n\nINSTRUÇÕES ESPECIAIS:\n- Sempre informe preços particulares\n- Mencione convênios aceitos\n- Explique formas de pagamento\n- Ofereça descontos disponíveis',
      
      'preparacao_exames': '\n\nINSTRUÇÕES ESPECIAIS:\n- SEMPRE mencione preparação necessária\n- Destaque jejum obrigatório\n- Explique cuidados pré e pós\n- Confirme entendimento das orientações',
      
      'emergencia': '\n\nINSTRUÇÕES ESPECIAIS:\n- Identifique emergências médicas\n- Oriente procurar atendimento urgente\n- Forneça contatos de emergência\n- NÃO tente diagnosticar',
      
      'general': '\n\nINSTRUÇÕES ESPECIAIS:\n- Seja acolhedor e profissional\n- Ofereça informações relevantes\n- Pergunte como pode ajudar mais\n- Mantenha foco na saúde do paciente'
    };
    
    return instructions[intent as keyof typeof instructions] || instructions['general'];
  }

  /**
   * Mapa de intenções para busca contextual
   */
  buildIntentMap(): Record<string, string[]> {
    return {
      'agendamento': ['profissionais', 'servicos.consultas', 'servicos.exames', 'politicas.agendamento', 'clinica.horario_funcionamento'],
      'precos': ['servicos.consultas', 'servicos.exames', 'servicos.procedimentos', 'convenios', 'formas_pagamento'],
      'convenios': ['convenios', 'servicos.consultas', 'servicos.exames'],
      'preparacao_exames': ['servicos.exames', 'servicos.procedimentos', 'politicas.atendimento'],
      'horarios': ['clinica.horario_funcionamento', 'profissionais', 'politicas.agendamento'],
      'localizacao': ['clinica.localizacao', 'clinica.contatos'],
      'profissionais': ['profissionais', 'servicos.consultas'],
      'emergencia': ['agente_ia.restricoes', 'clinica.contatos'],
      'general': ['clinica.informacoes_basicas', 'agente_ia.configuracao', 'clinica.contatos', 'clinica.horario_funcionamento']
    };
  }

  /**
   * Identifica intenção baseada na mensagem do usuário
   */
  identifyIntent(userMessage: string): string {
    if (!userMessage) return 'general';
    
    const message = userMessage.toLowerCase();
    const keywordMap = {
      'agendamento': ['agendar', 'marcar', 'consulta', 'horário', 'disponível', 'agenda'],
      'precos': ['preço', 'valor', 'custo', 'quanto custa', 'tabela', 'pagar'],
      'convenios': ['convênio', 'plano', 'unimed', 'bradesco', 'amil', 'sulamerica'],
      'preparacao_exames': ['preparação', 'preparo', 'jejum', 'orientações', 'como fazer'],
      'horarios': ['horário', 'funcionamento', 'aberto', 'fechado', 'que horas'],
      'localizacao': ['endereço', 'onde fica', 'localização', 'como chegar', 'fica onde'],
      'profissionais': ['médico', 'doutor', 'doutora', 'dr', 'dra', 'profissional'],
      'emergencia': ['emergência', 'urgente', 'dor', 'socorro', 'grave']
    };

    const scores: Record<string, number> = {};
    for (const [intent, keywords] of Object.entries(keywordMap)) {
      scores[intent] = 0;
      keywords.forEach(keyword => {
        if (message.includes(keyword)) {
          scores[intent] += 1;
        }
      });
    }

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return 'general';
    
    return Object.keys(scores).find(intent => scores[intent] === maxScore) || 'general';
  }

  /**
   * Extrai informações básicas para compatibilidade
   */
  extractBasicInfo(clinic: any, contextualization: any): any {
    const basic = contextualization.clinica?.informacoes_basicas || {};
    const contacts = contextualization.clinica?.contatos || {};
    const location = contextualization.clinica?.localizacao?.endereco_principal || {};
    
    return {
      clinicName: clinic.name || basic.nome || 'Clínica',
      workingHours: clinic.working_hours || contextualization.clinica?.horario_funcionamento,
      specialties: clinic.specialties || basic.especialidade_principal,
      address: clinic.address || `${location.logradouro}, ${location.numero}`,
      phone: clinic.phone || contacts.telefone_principal,
      email: clinic.email || contacts.email_principal
    };
  }

  /**
   * Utilitários
   */
  hasValidData(data: any): boolean {
    if (data === null || data === undefined) return false;
    if (typeof data === 'string') return data.trim().length > 0;
    if (Array.isArray(data)) return data.length > 0;
    if (typeof data === 'object') return Object.keys(data).length > 0;
    return true;
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  countSections(navigationData: NavigationData): number {
    return Object.values(navigationData).reduce((total, sections) => total + sections.length, 0);
  }

  getCacheKey(clinicId: string, contextualization: any): string {
    const hash = this.hashJSON(contextualization);
    return `enhanced_context_${clinicId}_${hash}`;
  }

  hashJSON(obj: any): string {
    const crypto = require('crypto');
    return crypto
      .createHash('md5')
      .update(JSON.stringify(obj))
      .digest('hex')
      .substring(0, 8);
  }

  getFromCache(cacheKey: string): any {
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.ttl) {
      return cached.data;
    }
    return null;
  }

  saveToCache(cacheKey: string, data: any): void {
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
  }

  summarizeSection(text: string): string {
    const lines = text.split('\n');
    const essential = lines.filter(line => 
      line.includes('R$') || 
      line.includes('horário') || 
      line.includes('telefone') ||
      line.includes('Dr.') ||
      line.includes('Dra.') ||
      line.includes('⚠️')
    );
    return essential.join('\n');
  }

  genericProcessor(sectionPath: string, data: any): string {
    if (typeof data === 'string') {
      return `\n${sectionPath.toUpperCase()}: ${data}`;
    }
    if (typeof data === 'object') {
      return `\n${sectionPath.toUpperCase()}: ${JSON.stringify(data, null, 2)}`;
    }
    return '';
  }

  getFallbackContext(clinicId: string): any {
    return {
      clinicId: clinicId,
      clinicName: 'Clínica',
      basicInfo: {
        clinicName: 'Clínica',
        workingHours: null,
        specialties: null,
        address: null,
        phone: null,
        email: null
      },
      fullContext: {
        prompt: 'Você é um assistente virtual de uma clínica médica. Seja profissional e acolhedor.',
        tokensUsed: 50,
        tokensAvailable: this.availableTokens - 50,
        sectionsIncluded: 0,
        intent: 'general'
      },
      navigationData: { critical: [], high: [], medium: [], low: [] },
      metadata: {
        tokensUsed: 50,
        sectionsIncluded: 0,
        cacheKey: null,
        processedAt: new Date().toISOString(),
        fallback: true
      }
    };
  }

  /**
   * Adapta contexto baseado na intenção específica
   */
  adaptToIntent(cachedResult: any, userMessage: string, intent: string): any {
    if (intent === 'general' && !userMessage) {
      return cachedResult;
    }

    // Re-otimiza prompt baseado na nova intenção
    const adaptedPrompt = this.optimizePromptForIntent(
      cachedResult.navigationData, 
      userMessage, 
      intent
    );

    return {
      ...cachedResult,
      fullContext: adaptedPrompt,
      metadata: {
        ...cachedResult.metadata,
        adaptedAt: new Date().toISOString(),
        originalIntent: cachedResult.fullContext.intent,
        currentIntent: intent
      }
    };
  }

  optimizePromptForIntent(navigationData: NavigationData, userMessage: string, intent: string): OptimizedPrompt {
    // Reordena seções baseadas na intenção
    const intentSections = this.intentMap[intent] || this.intentMap['general'];
    const reorderedData = this.reorderByIntent(navigationData, intentSections);
    
    return this.optimizePrompt(reorderedData, userMessage, intent);
  }

  reorderByIntent(navigationData: NavigationData, intentSections: string[]): NavigationData {
    const reordered: NavigationData = { critical: [], high: [], medium: [], low: [] };
    
    // Promove seções relevantes para a intenção
    for (const priority of ['critical', 'high', 'medium', 'low']) {
      for (const section of navigationData[priority as keyof NavigationData]) {
        if (intentSections.includes(section.path)) {
          // Promove para alta prioridade se relevante para intenção
          const newPriority = priority === 'critical' ? 'critical' : 'high';
          reordered[newPriority as keyof NavigationData].push(section);
        } else {
          reordered[priority as keyof NavigationData].push(section);
        }
      }
    }
    
    return reordered;
  }
}

export default EnhancedClinicContextService; 