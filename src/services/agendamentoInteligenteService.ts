import { supabase } from '@/integrations/supabase/client';
import contextualizacaoService from './contextualizacaoService';
import { googleCalendarService } from './googleCalendarService';

export interface Paciente {
  id?: string;
  nome: string;
  telefone: string;
  email?: string;
  data_nascimento?: string;
  cpf?: string;
  convenio?: string;
  numero_carteirinha?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Agendamento {
  id?: string;
  paciente_id: string;
  profissional_id: string;
  servico_id: string;
  data: string;
  horario: string;
  duracao_minutos: number;
  status: 'agendado' | 'confirmado' | 'cancelado' | 'realizado' | 'remarcado';
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DisponibilidadeHorario {
  profissional_id: string;
  profissional_nome: string;
  data: string;
  horarios_disponiveis: string[];
  especialidades: string[];
}

export interface ConversaAgendamento {
  paciente_id?: string;
  etapa: 'inicio' | 'coleta_dados' | 'escolha_servico' | 'escolha_profissional' | 'escolha_data' | 'escolha_horario' | 'confirmacao' | 'finalizado';
  dados_coletados: {
    nome?: string;
    telefone?: string;
    email?: string;
    servico_desejado?: string;
    profissional_preferido?: string;
    data_preferida?: string;
    horario_preferido?: string;
    convenio?: string;
  };
  tentativas: number;
  ultima_interacao: string;
}

class AgendamentoInteligenteService {
  private contextualizacao = contextualizacaoService;

  /**
   * Inicia uma nova conversa de agendamento
   */
  async iniciarConversaAgendamento(telefone: string): Promise<ConversaAgendamento> {
    const conversa: ConversaAgendamento = {
      etapa: 'inicio',
      dados_coletados: {},
      tentativas: 0,
      ultima_interacao: new Date().toISOString()
    };

    // Salvar conversa no banco
    const { data, error } = await supabase
      .from('conversas_agendamento')
      .insert({
        telefone,
        dados_conversa: conversa
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao iniciar conversa:', error);
      throw new Error('Falha ao iniciar conversa de agendamento');
    }

    return conversa;
  }

  /**
   * Processa mensagem do usuário e retorna próxima ação
   */
  async processarMensagem(telefone: string, mensagem: string): Promise<{
    resposta: string;
    proxima_acao?: string;
    dados_atualizados?: Partial<ConversaAgendamento>;
  }> {
    // Buscar conversa atual
    const { data: conversaData } = await supabase
      .from('conversas_agendamento')
      .select('dados_conversa')
      .eq('telefone', telefone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let conversa: ConversaAgendamento = conversaData?.dados_conversa || {
      etapa: 'inicio',
      dados_coletados: {},
      tentativas: 0,
      ultima_interacao: new Date().toISOString()
    };

    // Processar baseado na etapa atual
    switch (conversa.etapa) {
      case 'inicio':
        return this.processarInicio(conversa, mensagem);
      
      case 'coleta_dados':
        return this.processarColetaDados(conversa, mensagem);
      
      case 'escolha_servico':
        return this.processarEscolhaServico(conversa, mensagem);
      
      case 'escolha_profissional':
        return this.processarEscolhaProfissional(conversa, mensagem);
      
      case 'escolha_data':
        return this.processarEscolhaData(conversa, mensagem);
      
      case 'escolha_horario':
        return this.processarEscolhaHorario(conversa, mensagem);
      
      case 'confirmacao':
        return this.processarConfirmacao(conversa, mensagem);
      
      default:
        return {
          resposta: 'Desculpe, ocorreu um erro. Vou reiniciar o processo de agendamento.',
          proxima_acao: 'reiniciar'
        };
    }
  }

  /**
   * Processa etapa inicial
   */
  private processarInicio(conversa: ConversaAgendamento, mensagem: string) {
    const mensagemLower = mensagem.toLowerCase();
    
    if (mensagemLower.includes('agendar') || mensagemLower.includes('marcar') || 
        mensagemLower.includes('consulta') || mensagemLower.includes('exame')) {
      
      conversa.etapa = 'coleta_dados';
      conversa.ultima_interacao = new Date().toISOString();
      
      return {
        resposta: `Perfeito! Vou ajudá-lo a agendar seu atendimento na ESADI. 

Para começar, preciso de algumas informações:

📝 Qual é o seu nome completo?`,
        proxima_acao: 'aguardar_nome',
        dados_atualizados: conversa
      };
    }

    return {
      resposta: `Olá! Sou a Jessica, assistente virtual da ESADI. 

Posso ajudá-lo com:
• 📅 Agendamento de consultas e exames
• ℹ️ Informações sobre nossos serviços
• 📞 Contatos e horários
• 💳 Convênios aceitos

Como posso ajudá-lo hoje?`
    };
  }

  /**
   * Processa coleta de dados do paciente
   */
  private async processarColetaDados(conversa: ConversaAgendamento, mensagem: string) {
    const dados = conversa.dados_coletados;
    
    if (!dados.nome) {
      // Coletando nome
      dados.nome = mensagem.trim();
      conversa.etapa = 'coleta_dados';
      conversa.ultima_interacao = new Date().toISOString();
      
      return {
        resposta: `Obrigada, ${dados.nome}! 

Agora preciso do seu número de telefone para contato (apenas números):`,
        proxima_acao: 'aguardar_telefone',
        dados_atualizados: conversa
      };
    }
    
    if (!dados.telefone) {
      // Coletando telefone
      const telefone = mensagem.replace(/\D/g, '');
      if (telefone.length < 10) {
        return {
          resposta: 'Por favor, informe um número de telefone válido (apenas números):'
        };
      }
      
      dados.telefone = telefone;
      conversa.etapa = 'escolha_servico';
      conversa.ultima_interacao = new Date().toISOString();
      
      const consultas = this.contextualizacao.getConsultas();
      const exames = this.contextualizacao.getExames();
      const servicos = [...consultas, ...exames];
      
      return {
        resposta: `Perfeito! Agora preciso saber qual serviço você gostaria de agendar:

${servicos.map((servico, index) => 
  `${index + 1}. ${servico.nome} - R$ ${servico.preco_particular.toFixed(2)}`
).join('\n')}

Digite o número do serviço desejado ou o nome do serviço:`,
        proxima_acao: 'aguardar_servico',
        dados_atualizados: conversa
      };
    }

    return {
      resposta: 'Desculpe, não entendi. Pode repetir?'
    };
  }

  /**
   * Processa escolha do serviço
   */
  private processarEscolhaServico(conversa: ConversaAgendamento, mensagem: string) {
    const consultas = this.contextualizacao.getConsultas();
    const exames = this.contextualizacao.getExames();
    const servicos = [...consultas, ...exames];
    const mensagemLower = mensagem.toLowerCase();
    
    // Tentar encontrar serviço por número ou nome
    let servicoEscolhido = null;
    
    // Por número
    const numero = parseInt(mensagem);
    if (!isNaN(numero) && numero > 0 && numero <= servicos.length) {
      servicoEscolhido = servicos[numero - 1];
    } else {
      // Por nome
      servicoEscolhido = servicos.find(servico => 
        servico.nome.toLowerCase().includes(mensagemLower) ||
        mensagemLower.includes(servico.nome.toLowerCase())
      );
    }
    
    if (!servicoEscolhido) {
      return {
        resposta: `Desculpe, não encontrei esse serviço. Por favor, escolha um dos serviços disponíveis:

${servicos.map((servico, index) => 
  `${index + 1}. ${servico.nome} - R$ ${servico.preco_particular.toFixed(2)}`
).join('\n')}`
      };
    }
    
    conversa.dados_coletados.servico_desejado = servicoEscolhido.id;
    conversa.etapa = 'escolha_profissional';
    conversa.ultima_interacao = new Date().toISOString();
    
    const profissionais = this.contextualizacao.getProfissionais();
    
    return {
      resposta: `Ótima escolha! Você selecionou: **${servicoEscolhido.nome}**

Agora escolha o profissional:

${profissionais.map((prof, index) => 
  `${index + 1}. ${prof.nome_exibicao} - ${prof.especialidades.join(', ')}`
).join('\n')}

Digite o número do profissional ou "qualquer" para qualquer um disponível:`,
      proxima_acao: 'aguardar_profissional',
      dados_atualizados: conversa
    };
  }

  /**
   * Processa escolha do profissional
   */
  private processarEscolhaProfissional(conversa: ConversaAgendamento, mensagem: string) {
    const profissionais = this.contextualizacao.getProfissionais();
    const mensagemLower = mensagem.toLowerCase();
    
    let profissionalEscolhido = null;
    
    if (mensagemLower.includes('qualquer') || mensagemLower.includes('indiferente')) {
      // Usar primeiro profissional disponível
      profissionalEscolhido = profissionais[0];
    } else {
      // Por número
      const numero = parseInt(mensagem);
      if (!isNaN(numero) && numero > 0 && numero <= profissionais.length) {
        profissionalEscolhido = profissionais[numero - 1];
      } else {
        // Por nome
        profissionalEscolhido = profissionais.find(prof => 
          prof.nome_completo.toLowerCase().includes(mensagemLower) ||
          prof.nome_exibicao.toLowerCase().includes(mensagemLower) ||
          mensagemLower.includes(prof.nome_exibicao.toLowerCase())
        );
      }
    }
    
    if (!profissionalEscolhido) {
      return {
        resposta: `Desculpe, não encontrei esse profissional. Por favor, escolha um dos profissionais disponíveis:

${profissionais.map((prof, index) => 
  `${index + 1}. ${prof.nome_exibicao} - ${prof.especialidades.join(', ')}`
).join('\n')}

Ou digite "qualquer" para qualquer profissional disponível.`
      };
    }
    
    conversa.dados_coletados.profissional_preferido = profissionalEscolhido.id;
    conversa.etapa = 'escolha_data';
    conversa.ultima_interacao = new Date().toISOString();
    
    // Gerar próximas datas disponíveis
    const proximasDatas = this.gerarProximasDatasDisponiveis(profissionalEscolhido);
    
    return {
      resposta: `Perfeito! Você escolheu: **${profissionalEscolhido.nome_exibicao}**

Agora escolha a data preferida:

${proximasDatas.map((data, index) => 
  `${index + 1}. ${data.formatada} (${data.diaSemana})`
).join('\n')}

Digite o número da data desejada:`,
      proxima_acao: 'aguardar_data',
      dados_atualizados: conversa
    };
  }

  /**
   * Processa escolha da data
   */
  private processarEscolhaData(conversa: ConversaAgendamento, mensagem: string) {
    const profissional = this.contextualizacao.getProfissionalPorId(conversa.dados_coletados.profissional_preferido!);
    if (!profissional) {
      return {
        resposta: 'Erro ao encontrar profissional. Vamos recomeçar.',
        proxima_acao: 'reiniciar'
      };
    }
    
    const proximasDatas = this.gerarProximasDatasDisponiveis(profissional);
    const numero = parseInt(mensagem);
    
    if (isNaN(numero) || numero < 1 || numero > proximasDatas.length) {
      return {
        resposta: `Por favor, escolha uma data válida:

${proximasDatas.map((data, index) => 
  `${index + 1}. ${data.formatada} (${data.diaSemana})`
).join('\n')}`
      };
    }
    
    const dataEscolhida = proximasDatas[numero - 1];
    conversa.dados_coletados.data_preferida = dataEscolhida.iso;
    conversa.etapa = 'escolha_horario';
    conversa.ultima_interacao = new Date().toISOString();
    
    // Gerar horários disponíveis para a data
    const horariosDisponiveis = this.gerarHorariosDisponiveis(profissional, dataEscolhida.iso);
    
    return {
      resposta: `Ótimo! Data escolhida: **${dataEscolhida.formatada}**

Agora escolha o horário preferido:

${horariosDisponiveis.map((horario, index) => 
  `${index + 1}. ${horario}`
).join('\n')}

Digite o número do horário desejado:`,
      proxima_acao: 'aguardar_horario',
      dados_atualizados: conversa
    };
  }

  /**
   * Processa escolha do horário
   */
  private processarEscolhaHorario(conversa: ConversaAgendamento, mensagem: string) {
    const profissional = this.contextualizacao.getProfissionalPorId(conversa.dados_coletados.profissional_preferido!);
    if (!profissional) {
      return {
        resposta: 'Erro ao encontrar profissional. Vamos recomeçar.',
        proxima_acao: 'reiniciar'
      };
    }
    
    const horariosDisponiveis = this.gerarHorariosDisponiveis(profissional, conversa.dados_coletados.data_preferida!);
    const numero = parseInt(mensagem);
    
    if (isNaN(numero) || numero < 1 || numero > horariosDisponiveis.length) {
      return {
        resposta: `Por favor, escolha um horário válido:

${horariosDisponiveis.map((horario, index) => 
  `${index + 1}. ${horario}`
).join('\n')}`
      };
    }
    
    const horarioEscolhido = horariosDisponiveis[numero - 1];
    conversa.dados_coletados.horario_preferido = horarioEscolhido;
    conversa.etapa = 'confirmacao';
    conversa.ultima_interacao = new Date().toISOString();
    
    const servico = this.contextualizacao.getConsultaPorId(conversa.dados_coletados.servico_desejado!) || 
                   this.contextualizacao.getExamePorId(conversa.dados_coletados.servico_desejado!);
    
    return {
      resposta: `🎉 Perfeito! Vamos confirmar seu agendamento:

📋 **Dados do Agendamento:**
• Paciente: ${conversa.dados_coletados.nome}
• Serviço: ${servico?.nome}
• Profissional: ${profissional.nome_exibicao}
• Data: ${this.formatarData(conversa.dados_coletados.data_preferida!)}
• Horário: ${horarioEscolhido}
• Valor: R$ ${servico?.preco_particular.toFixed(2)}

📞 **Confirmação:**
Digite "SIM" para confirmar o agendamento ou "NÃO" para cancelar.`,
      proxima_acao: 'aguardar_confirmacao',
      dados_atualizados: conversa
    };
  }

  /**
   * Processa confirmação do agendamento
   */
  private async processarConfirmacao(conversa: ConversaAgendamento, mensagem: string) {
    const mensagemLower = mensagem.toLowerCase();
    
    if (mensagemLower.includes('sim') || mensagemLower.includes('confirmar') || mensagemLower.includes('ok')) {
      try {
        // Criar ou buscar paciente
        const paciente = await this.criarOuBuscarPaciente(conversa.dados_coletados);
        
        // Criar agendamento no banco
        const agendamento = await this.criarAgendamento(paciente.id!, conversa.dados_coletados);
        
        // Criar evento no Google Calendar
        await this.criarEventoGoogleCalendar(agendamento, paciente, conversa.dados_coletados);
        
        conversa.etapa = 'finalizado';
        conversa.ultima_interacao = new Date().toISOString();
        
        return {
          resposta: `✅ **Agendamento confirmado com sucesso!**

📅 **Detalhes:**
• Código: #${agendamento.id?.slice(-6)}
• Data: ${this.formatarData(conversa.dados_coletados.data_preferida!)}
• Horário: ${conversa.dados_coletados.horario_preferido}

📋 **Lembretes importantes:**
• Chegue com 15 minutos de antecedência
• Traga RG/CPF e carteirinha do convênio (se aplicável)
• Para exames, siga as orientações de preparo

📞 **Contato:**
Em caso de dúvidas, ligue: (47) 3222-0432

Obrigada por escolher a ESADI! 😊`,
          proxima_acao: 'finalizado',
          dados_atualizados: conversa
        };
      } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        return {
          resposta: 'Desculpe, ocorreu um erro ao confirmar o agendamento. Por favor, tente novamente ou entre em contato pelo telefone (47) 3222-0432.',
          proxima_acao: 'reiniciar'
        };
      }
    } else if (mensagemLower.includes('não') || mensagemLower.includes('cancelar')) {
      conversa.etapa = 'inicio';
      conversa.dados_coletados = {};
      conversa.ultima_interacao = new Date().toISOString();
      
      return {
        resposta: 'Agendamento cancelado. Posso ajudá-lo com mais alguma coisa?',
        proxima_acao: 'reiniciar',
        dados_atualizados: conversa
      };
    }
    
    return {
      resposta: 'Por favor, digite "SIM" para confirmar ou "NÃO" para cancelar o agendamento.'
    };
  }

  /**
   * Cria evento no Google Calendar
   */
  private async criarEventoGoogleCalendar(agendamento: Agendamento, paciente: Paciente, dados: any) {
    try {
      // Buscar informações do serviço e profissional
      const servico = this.contextualizacao.getConsultaPorId(dados.servico_desejado!) || 
                     this.contextualizacao.getExamePorId(dados.servico_desejado!);
      const profissional = this.contextualizacao.getProfissionalPorId(dados.profissional_preferido!);
      
      if (!servico || !profissional) {
        console.error('Serviço ou profissional não encontrado');
        return;
      }

      // Preparar dados do evento
      const [horarioInicio, horarioFim] = dados.horario_preferido!.split(' - ');
      const dataEvento = new Date(dados.data_preferida!);
      const [horaInicio, minInicio] = horarioInicio.split(':').map(Number);
      const [horaFim, minFim] = horarioFim.split(':').map(Number);
      
      const startDateTime = new Date(dataEvento);
      startDateTime.setHours(horaInicio, minInicio, 0, 0);
      
      const endDateTime = new Date(dataEvento);
      endDateTime.setHours(horaFim, minFim, 0, 0);

      const eventData = {
        summary: `${servico.nome} - ${paciente.nome}`,
        description: `Agendamento via WhatsApp\n\nPaciente: ${paciente.nome}\nTelefone: ${paciente.telefone}\nServiço: ${servico.nome}\nProfissional: ${profissional.nome_exibicao}\nValor: R$ ${servico.preco_particular.toFixed(2)}\n\nCódigo: #${agendamento.id?.slice(-6)}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        location: 'ESADI - Clínica de Gastroenterologia',
        attendees: [
          { email: paciente.email || 'paciente@esadi.com.br' }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 dia antes
            { method: 'popup', minutes: 60 } // 1 hora antes
          ]
        }
      };

      // Criar evento no Google Calendar
      await googleCalendarService.createCalendarEvent(eventData);
      
      console.log('✅ Evento criado no Google Calendar:', eventData.summary);
      
    } catch (error) {
      console.error('❌ Erro ao criar evento no Google Calendar:', error);
      // Não falhar o agendamento se o Google Calendar falhar
      // O agendamento já foi criado no banco
    }
  }

  /**
   * Gera próximas datas disponíveis para um profissional
   */
  private gerarProximasDatasDisponiveis(profissional: any): Array<{iso: string, formatada: string, diaSemana: string}> {
    const datas = [];
    const hoje = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() + i);
      
      const diaSemana = this.getDiaSemana(data.getDay());
      const horarios = profissional.horarios_disponibilidade[diaSemana];
      
      if (horarios && horarios.length > 0) {
        datas.push({
          iso: data.toISOString().split('T')[0],
          formatada: data.toLocaleDateString('pt-BR'),
          diaSemana: this.getDiaSemanaNome(diaSemana)
        });
      }
    }
    
    return datas.slice(0, 7); // Retornar apenas as próximas 7 datas
  }

  /**
   * Gera horários disponíveis para uma data específica
   */
  private gerarHorariosDisponiveis(profissional: any, data: string): string[] {
    const dataObj = new Date(data);
    const diaSemana = this.getDiaSemana(dataObj.getDay());
    const horarios = profissional.horarios_disponibilidade[diaSemana] || [];
    
    return horarios.map((horario: any) => `${horario.inicio} - ${horario.fim}`);
  }

  /**
   * Cria ou busca paciente no banco
   */
  private async criarOuBuscarPaciente(dados: any): Promise<Paciente> {
    // Buscar paciente existente
    const { data: pacienteExistente } = await supabase
      .from('pacientes')
      .select('*')
      .eq('telefone', dados.telefone)
      .single();

    if (pacienteExistente) {
      return pacienteExistente;
    }

    // Criar novo paciente
    const { data: novoPaciente, error } = await supabase
      .from('pacientes')
      .insert({
        nome: dados.nome,
        telefone: dados.telefone,
        email: dados.email,
        convenio: dados.convenio
      })
      .select()
      .single();

    if (error) {
      throw new Error('Erro ao criar paciente');
    }

    return novoPaciente;
  }

  /**
   * Cria agendamento no banco
   */
  private async criarAgendamento(pacienteId: string, dados: any): Promise<Agendamento> {
    const { data: agendamento, error } = await supabase
      .from('agendamentos')
      .insert({
        paciente_id: pacienteId,
        profissional_id: dados.profissional_preferido,
        servico_id: dados.servico_desejado,
        data: dados.data_preferida,
        horario: dados.horario_preferido,
        duracao_minutos: 30, // Padrão, pode ser ajustado
        status: 'agendado'
      })
      .select()
      .single();

    if (error) {
      throw new Error('Erro ao criar agendamento');
    }

    return agendamento;
  }

  /**
   * Utilitários
   */
  private getDiaSemana(dia: number): string {
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    return dias[dia];
  }

  private getDiaSemanaNome(dia: string): string {
    const nomes = {
      'segunda': 'Segunda-feira',
      'terca': 'Terça-feira',
      'quarta': 'Quarta-feira',
      'quinta': 'Quinta-feira',
      'sexta': 'Sexta-feira',
      'sabado': 'Sábado',
      'domingo': 'Domingo'
    };
    return nomes[dia as keyof typeof nomes] || dia;
  }

  private formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR');
  }
}

export const agendamentoInteligenteService = new AgendamentoInteligenteService();
export default agendamentoInteligenteService; 