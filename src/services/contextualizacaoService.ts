import contextualizacaoData from '../data/contextualizacao-esadi.json';

export interface ContextualizacaoClinica {
  clinica: {
    informacoes_basicas: {
      nome: string;
      razao_social: string;
      cnpj: string;
      especialidade_principal: string;
      especialidades_secundarias: string[];
      descricao: string;
      missao: string;
      valores: string[];
      diferenciais: string[];
    };
    localizacao: {
      endereco_principal: {
        logradouro: string;
        numero: string;
        complemento: string;
        bairro: string;
        cidade: string;
        estado: string;
        cep: string;
        pais: string;
        coordenadas: {
          latitude: number;
          longitude: number;
        };
      };
    };
    contatos: {
      telefone_principal: string;
      whatsapp: string;
      email_principal: string;
      emails_departamentos: {
        agendamento: string;
        resultados: string;
      };
      website: string;
    };
    horario_funcionamento: {
      [key: string]: { abertura: string | null; fechamento: string | null };
    };
  };
  agente_ia: {
    configuracao: {
      nome: string;
      personalidade: string;
      tom_comunicacao: string;
      nivel_formalidade: string;
      idiomas: string[];
      saudacao_inicial: string;
      mensagem_despedida: string;
      mensagem_fora_horario: string;
    };
    comportamento: {
      proativo: boolean;
      oferece_sugestoes: boolean;
      solicita_feedback: boolean;
      escalacao_automatica: boolean;
      limite_tentativas: number;
      contexto_conversa: boolean;
    };
  };
  profissionais: Array<{
    id: string;
    nome_completo: string;
    nome_exibicao: string;
    crm: string;
    especialidades: string[];
    experiencia: string;
    ativo: boolean;
    aceita_novos_pacientes: boolean;
    horarios_disponibilidade: {
      [key: string]: Array<{ inicio: string; fim: string }>;
    };
    tempo_consulta_padrao: number;
  }>;
  servicos: {
    consultas: Array<{
      id: string;
      nome: string;
      descricao: string;
      especialidade: string;
      duracao_minutos: number;
      preco_particular: number;
      aceita_convenio: boolean;
      convenios_aceitos: string[];
      ativo: boolean;
    }>;
    exames: Array<{
      id: string;
      nome: string;
      descricao: string;
      categoria: string;
      duracao_minutos: number;
      preco_particular: number;
      aceita_convenio: boolean;
      convenios_aceitos: string[];
      preparacao: {
        jejum_horas: number;
        instrucoes_especiais: string;
      };
      resultado_prazo_dias: number;
      ativo: boolean;
    }>;
  };
  convenios: Array<{
    id: string;
    nome: string;
    ativo: boolean;
    servicos_cobertos: string[];
    copagamento: boolean;
    valor_copagamento?: number;
    autorizacao_necessaria: boolean;
  }>;
  formas_pagamento: {
    dinheiro: boolean;
    cartao_credito: boolean;
    cartao_debito: boolean;
    pix: boolean;
    parcelamento: {
      disponivel: boolean;
      max_parcelas: number;
      valor_minimo_parcela: number;
    };
    desconto_a_vista: {
      disponivel: boolean;
      percentual: number;
    };
  };
  politicas: {
    agendamento: {
      antecedencia_minima_horas: number;
      antecedencia_maxima_dias: number;
      reagendamento_permitido: boolean;
      cancelamento_antecedencia_horas: number;
      confirmacao_necessaria: boolean;
    };
    atendimento: {
      tolerancia_atraso_minutos: number;
      acompanhante_permitido: boolean;
      documentos_obrigatorios: string[];
    };
  };
  informacoes_adicionais: {
    parcerias: Array<{
      nome: string;
      tipo: string;
      descricao: string;
    }>;
  };
  metadados: {
    versao_schema: string;
    data_criacao: string;
    status: string;
  };
}

class ContextualizacaoService {
  private contextualizacao: ContextualizacaoClinica;

  constructor() {
    this.contextualizacao = contextualizacaoData as ContextualizacaoClinica;
  }

  /**
   * Obtém toda a contextualização da clínica
   */
  getContextualizacao(): ContextualizacaoClinica {
    return this.contextualizacao;
  }

  /**
   * Obtém informações básicas da clínica
   */
  getInformacoesBasicas() {
    return this.contextualizacao.clinica.informacoes_basicas;
  }

  /**
   * Obtém informações de localização
   */
  getLocalizacao() {
    return this.contextualizacao.clinica.localizacao;
  }

  /**
   * Obtém informações de contato
   */
  getContatos() {
    return this.contextualizacao.clinica.contatos;
  }

  /**
   * Obtém horário de funcionamento
   */
  getHorarioFuncionamento() {
    return this.contextualizacao.clinica.horario_funcionamento;
  }

  /**
   * Obtém configuração do agente IA
   */
  getConfiguracaoAgenteIA() {
    return this.contextualizacao.agente_ia.configuracao;
  }

  /**
   * Obtém comportamento do agente IA
   */
  getComportamentoAgenteIA() {
    return this.contextualizacao.agente_ia.comportamento;
  }

  /**
   * Obtém lista de profissionais
   */
  getProfissionais() {
    return this.contextualizacao.profissionais.filter(prof => prof.ativo);
  }

  /**
   * Obtém profissional por ID
   */
  getProfissionalPorId(id: string) {
    return this.contextualizacao.profissionais.find(prof => prof.id === id && prof.ativo);
  }

  /**
   * Obtém profissionais por especialidade
   */
  getProfissionaisPorEspecialidade(especialidade: string) {
    return this.contextualizacao.profissionais.filter(
      prof => prof.ativo && prof.especialidades.includes(especialidade)
    );
  }

  /**
   * Obtém lista de consultas
   */
  getConsultas() {
    return this.contextualizacao.servicos.consultas.filter(consulta => consulta.ativo);
  }

  /**
   * Obtém lista de exames
   */
  getExames() {
    return this.contextualizacao.servicos.exames.filter(exame => exame.ativo);
  }

  /**
   * Obtém exame por ID
   */
  getExamePorId(id: string) {
    return this.contextualizacao.servicos.exames.find(exame => exame.id === id && exame.ativo);
  }

  /**
   * Obtém consulta por ID
   */
  getConsultaPorId(id: string) {
    return this.contextualizacao.servicos.consultas.find(consulta => consulta.id === id && consulta.ativo);
  }

  /**
   * Obtém lista de convênios ativos
   */
  getConvenios() {
    return this.contextualizacao.convenios.filter(convenio => convenio.ativo);
  }

  /**
   * Obtém convênio por nome
   */
  getConvenioPorNome(nome: string) {
    return this.contextualizacao.convenios.find(
      convenio => convenio.nome.toLowerCase() === nome.toLowerCase() && convenio.ativo
    );
  }

  /**
   * Obtém formas de pagamento
   */
  getFormasPagamento() {
    return this.contextualizacao.formas_pagamento;
  }

  /**
   * Obtém políticas de agendamento
   */
  getPoliticasAgendamento() {
    return this.contextualizacao.politicas.agendamento;
  }

  /**
   * Obtém políticas de atendimento
   */
  getPoliticasAtendimento() {
    return this.contextualizacao.politicas.atendimento;
  }

  /**
   * Verifica se a clínica está aberta no momento atual
   */
  isClinicaAberta(): boolean {
    const agora = new Date();
    const diaSemana = this.getDiaSemana(agora.getDay());
    const horario = this.contextualizacao.clinica.horario_funcionamento[diaSemana];
    
    if (!horario.abertura || !horario.fechamento) {
      return false; // Domingo ou dia fechado
    }

    const horaAtual = agora.getHours() * 60 + agora.getMinutes();
    const horaAbertura = this.converterHoraParaMinutos(horario.abertura);
    const horaFechamento = this.converterHoraParaMinutos(horario.fechamento);

    return horaAtual >= horaAbertura && horaAtual <= horaFechamento;
  }

  /**
   * Obtém o próximo horário de abertura
   */
  getProximoHorarioAbertura(): { dia: string; horario: string } | null {
    const agora = new Date();
    const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    
    for (let i = 1; i <= 7; i++) {
      const dataFutura = new Date(agora);
      dataFutura.setDate(agora.getDate() + i);
      
      const diaSemana = this.getDiaSemana(dataFutura.getDay());
      const horario = this.contextualizacao.clinica.horario_funcionamento[diaSemana];
      
      if (horario.abertura) {
        return {
          dia: diaSemana,
          horario: horario.abertura
        };
      }
    }
    
    return null;
  }

  /**
   * Gera contexto para o chatbot
   */
  gerarContextoChatbot(): string {
    const info = this.contextualizacao.clinica.informacoes_basicas;
    const contatos = this.contextualizacao.clinica.contatos;
    const agente = this.contextualizacao.agente_ia.configuracao;
    
    return `
Você é a ${agente.nome}, assistente virtual da ${info.nome} (${info.razao_social}).

INFORMAÇÕES DA CLÍNICA:
- Especialidade: ${info.especialidade_principal}
- Especialidades: ${info.especialidades_secundarias.join(', ')}
- Descrição: ${info.descricao}
- Missão: ${info.missao}

CONTATOS:
- Telefone: ${contatos.telefone_principal}
- WhatsApp: ${contatos.whatsapp}
- Email: ${contatos.email_principal}
- Website: ${contatos.website}

ENDEREÇO:
${this.contextualizacao.clinica.localizacao.endereco_principal.logradouro}, ${this.contextualizacao.clinica.localizacao.endereco_principal.numero}
${this.contextualizacao.clinica.localizacao.endereco_principal.complemento}
${this.contextualizacao.clinica.localizacao.endereco_principal.bairro}, ${this.contextualizacao.clinica.localizacao.endereco_principal.cidade} - ${this.contextualizacao.clinica.localizacao.endereco_principal.estado}
CEP: ${this.contextualizacao.clinica.localizacao.endereco_principal.cep}

PERSONALIDADE: ${agente.personalidade}
TOM DE COMUNICAÇÃO: ${agente.tom_comunicacao}

Sempre responda de forma profissional, acolhedora e especializada em gastroenterologia. Use as informações acima para fornecer respostas precisas sobre a clínica, serviços, agendamentos e orientações médicas.
    `.trim();
  }

  private getDiaSemana(dia: number): string {
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    return dias[dia];
  }

  private converterHoraParaMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }
}

export const contextualizacaoService = new ContextualizacaoService();
export default contextualizacaoService; 