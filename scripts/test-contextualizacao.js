const contextualizacaoData = {
  "clinica": {
    "informacoes_basicas": {
      "nome": "ESADI",
      "razao_social": "ESADI - Espaço de Saúde do Aparelho Digestivo",
      "cnpj": "12.345.678/0001-90",
      "especialidade_principal": "Gastroenterologia",
      "especialidades_secundarias": [
        "Endoscopia Digestiva",
        "Hepatologia",
        "Colonoscopia",
        "Diagnóstico por Imagem Digestiva"
      ],
      "descricao": "Centro especializado em saúde do aparelho digestivo com tecnologia de ponta para Santa Catarina. Oferecemos exames de baixa, média e alta complexidade em ambiente diferenciado.",
      "missao": "Proporcionar diagnósticos precisos e tratamentos eficazes para patologias do aparelho digestivo com tecnologia avançada e atendimento humanizado.",
      "valores": [
        "Excelência em diagnóstico",
        "Tecnologia de ponta",
        "Atendimento humanizado",
        "Segurança do paciente",
        "Ética profissional"
      ],
      "diferenciais": [
        "Comunicação direta com Hospital Santa Isabel",
        "Espaço diferenciado para acolhimento",
        "Fluxo otimizado de pacientes",
        "Equipamentos de última geração",
        "Equipe de anestesiologia especializada"
      ]
    },
    "localizacao": {
      "endereco_principal": {
        "logradouro": "Rua Sete de Setembro",
        "numero": "777",
        "complemento": "Edifício Stein Office - Sala 511",
        "bairro": "Centro",
        "cidade": "Blumenau",
        "estado": "SC",
        "cep": "89010-201",
        "pais": "Brasil",
        "coordenadas": {
          "latitude": -26.9194,
          "longitude": -49.0661
        }
      }
    },
    "contatos": {
      "telefone_principal": "(47) 3222-0432",
      "whatsapp": "(47) 99963-3223",
      "email_principal": "contato@esadi.com.br",
      "emails_departamentos": {
        "agendamento": "agendamento@esadi.com.br",
        "resultados": "resultados@esadi.com.br"
      },
      "website": "https://www.esadi.com.br"
    },
    "horario_funcionamento": {
      "segunda": {"abertura": "07:00", "fechamento": "18:00"},
      "terca": {"abertura": "07:00", "fechamento": "18:00"},
      "quarta": {"abertura": "07:00", "fechamento": "18:00"},
      "quinta": {"abertura": "07:00", "fechamento": "18:00"},
      "sexta": {"abertura": "07:00", "fechamento": "17:00"},
      "sabado": {"abertura": "07:00", "fechamento": "12:00"},
      "domingo": {"abertura": null, "fechamento": null}
    }
  },
  "agente_ia": {
    "configuracao": {
      "nome": "Jessica",
      "personalidade": "Profissional, acolhedora e especializada em gastroenterologia. Demonstra conhecimento técnico mas comunica de forma acessível.",
      "tom_comunicacao": "Formal mas acessível, com foco na tranquilização do paciente",
      "nivel_formalidade": "Médio-alto",
      "idiomas": ["português"],
      "saudacao_inicial": "Olá! Sou a Jessica, assistente virtual da ESADI. Estou aqui para ajudá-lo com agendamentos e orientações sobre exames. Como posso ajudá-lo hoje?",
      "mensagem_despedida": "Obrigado por escolher a ESADI para cuidar da sua saúde digestiva. Até breve!",
      "mensagem_fora_horario": "No momento estamos fora do horário de atendimento. Para urgências gastroenterológicas, procure o pronto-socorro do Hospital Santa Isabel. Retornaremos seu contato no próximo horário comercial."
    },
    "comportamento": {
      "proativo": true,
      "oferece_sugestoes": true,
      "solicita_feedback": true,
      "escalacao_automatica": true,
      "limite_tentativas": 3,
      "contexto_conversa": true
    }
  },
  "profissionais": [
    {
      "id": "prof_001",
      "nome_completo": "Dr. Carlos Eduardo Silva",
      "nome_exibicao": "Dr. Carlos Eduardo",
      "crm": "CRM-SC 12345",
      "especialidades": ["Gastroenterologia", "Endoscopia Digestiva"],
      "experiencia": "Mais de 25 anos de experiência em gastroenterologia e endoscopia digestiva",
      "ativo": true,
      "aceita_novos_pacientes": true,
      "horarios_disponibilidade": {
        "segunda": [{"inicio": "08:00", "fim": "12:00"}],
        "terca": [{"inicio": "14:00", "fim": "18:00"}],
        "quarta": [{"inicio": "08:00", "fim": "12:00"}],
        "quinta": [{"inicio": "14:00", "fim": "18:00"}],
        "sexta": [{"inicio": "08:00", "fim": "12:00"}]
      },
      "tempo_consulta_padrao": 30
    },
    {
      "id": "prof_002",
      "nome_completo": "Dr. João da Silva",
      "nome_exibicao": "Dr. João",
      "crm": "CRM-SC 9999",
      "especialidades": ["Endoscopia Digestiva", "Colonoscopia", "Diagnóstico por Imagem Digestiva"],
      "experiencia": "Mais de 10 anos de experiência em endoscopia digestiva, colonoscopia e hepatologia",
      "ativo": true,
      "aceita_novos_pacientes": true,
      "horarios_disponibilidade": {
        "segunda": [{"inicio": "08:00", "fim": "12:00"}],
        "terca": [{"inicio": "14:00", "fim": "18:00"}],
        "quarta": [{"inicio": "08:00", "fim": "12:00"}],
        "quinta": [{"inicio": "14:00", "fim": "18:00"}],
        "sexta": [{"inicio": "08:00", "fim": "12:00"}]
      },
      "tempo_consulta_padrao": 30
    }
  ],
  "servicos": {
    "consultas": [
      {
        "id": "cons_001",
        "nome": "Consulta Gastroenterológica",
        "descricao": "Avaliação completa do aparelho digestivo",
        "especialidade": "Gastroenterologia",
        "duracao_minutos": 30,
        "preco_particular": 280.00,
        "aceita_convenio": true,
        "convenios_aceitos": ["Unimed", "Bradesco Saúde", "SulAmérica"],
        "ativo": true
      }
    ],
    "exames": [
      {
        "id": "exam_001",
        "nome": "Endoscopia Digestiva Alta",
        "descricao": "Exame endoscópico do esôfago, estômago e duodeno",
        "categoria": "Endoscopia",
        "duracao_minutos": 30,
        "preco_particular": 450.00,
        "aceita_convenio": true,
        "convenios_aceitos": ["Unimed", "Bradesco Saúde", "SulAmérica", "Amil"],
        "preparacao": {
          "jejum_horas": 12,
          "instrucoes_especiais": "Jejum absoluto de 12 horas (sólidos e líquidos). Medicamentos de uso contínuo podem ser tomados com pouca água até 2 horas antes do exame."
        },
        "resultado_prazo_dias": 2,
        "ativo": true
      },
      {
        "id": "exam_002",
        "nome": "Colonoscopia",
        "descricao": "Exame endoscópico do intestino grosso",
        "categoria": "Endoscopia",
        "duracao_minutos": 45,
        "preco_particular": 650.00,
        "aceita_convenio": true,
        "convenios_aceitos": ["Unimed", "Bradesco Saúde", "SulAmérica"],
        "preparacao": {
          "jejum_horas": 12,
          "instrucoes_especiais": "Dieta específica 3 dias antes. Uso de laxante conforme orientação médica. Jejum absoluto de 12 horas."
        },
        "resultado_prazo_dias": 3,
        "ativo": true
      },
      {
        "id": "exam_003",
        "nome": "Teste Respiratório para H. Pylori",
        "descricao": "Teste não invasivo para detecção da bactéria Helicobacter pylori",
        "categoria": "Teste Diagnóstico",
        "duracao_minutos": 60,
        "preco_particular": 180.00,
        "aceita_convenio": true,
        "convenios_aceitos": ["Unimed", "Bradesco Saúde", "SulAmérica"],
        "preparacao": {
          "jejum_horas": 6,
          "instrucoes_especiais": "Suspender antibióticos por 4 semanas. Suspender omeprazol e similares por 2 semanas. Jejum de 6 horas."
        },
        "resultado_prazo_dias": 1,
        "ativo": true
      }
    ]
  },
  "convenios": [
    {
      "id": "conv_001",
      "nome": "Unimed",
      "ativo": true,
      "servicos_cobertos": ["cons_001", "exam_001", "exam_002", "exam_003"],
      "copagamento": false,
      "autorizacao_necessaria": true
    },
    {
      "id": "conv_002",
      "nome": "Bradesco Saúde",
      "ativo": true,
      "servicos_cobertos": ["cons_001", "exam_001", "exam_002", "exam_003"],
      "copagamento": true,
      "valor_copagamento": 25.00,
      "autorizacao_necessaria": true
    },
    {
      "id": "conv_003",
      "nome": "SulAmérica",
      "ativo": true,
      "servicos_cobertos": ["cons_001", "exam_001", "exam_002", "exam_003"],
      "copagamento": true,
      "valor_copagamento": 30.00,
      "autorizacao_necessaria": true
    }
  ],
  "formas_pagamento": {
    "dinheiro": true,
    "cartao_credito": true,
    "cartao_debito": true,
    "pix": true,
    "parcelamento": {
      "disponivel": true,
      "max_parcelas": 6,
      "valor_minimo_parcela": 100.00
    },
    "desconto_a_vista": {
      "disponivel": true,
      "percentual": 5.0
    }
  },
  "politicas": {
    "agendamento": {
      "antecedencia_minima_horas": 24,
      "antecedencia_maxima_dias": 90,
      "reagendamento_permitido": true,
      "cancelamento_antecedencia_horas": 24,
      "confirmacao_necessaria": true
    },
    "atendimento": {
      "tolerancia_atraso_minutos": 15,
      "acompanhante_permitido": true,
      "documentos_obrigatorios": ["RG ou CNH", "CPF", "Carteirinha do convênio"]
    }
  },
  "informacoes_adicionais": {
    "parcerias": [
      {
        "nome": "Hospital Santa Isabel",
        "tipo": "Hospital",
        "descricao": "Comunicação direta para casos de emergência"
      }
    ]
  },
  "metadados": {
    "versao_schema": "1.0.0",
    "data_criacao": "2024-06-30T19:00:00Z",
    "status": "ativo"
  }
};

class ContextualizacaoService {
  constructor(data) {
    this.contextualizacao = data;
  }

  getContextualizacao() {
    return this.contextualizacao;
  }

  getInformacoesBasicas() {
    return this.contextualizacao.clinica.informacoes_basicas;
  }

  getLocalizacao() {
    return this.contextualizacao.clinica.localizacao;
  }

  getContatos() {
    return this.contextualizacao.clinica.contatos;
  }

  getHorarioFuncionamento() {
    return this.contextualizacao.clinica.horario_funcionamento;
  }

  getConfiguracaoAgenteIA() {
    return this.contextualizacao.agente_ia.configuracao;
  }

  getComportamentoAgenteIA() {
    return this.contextualizacao.agente_ia.comportamento;
  }

  getProfissionais() {
    return this.contextualizacao.profissionais.filter(prof => prof.ativo);
  }

  getProfissionalPorId(id) {
    return this.contextualizacao.profissionais.find(prof => prof.id === id && prof.ativo);
  }

  getProfissionaisPorEspecialidade(especialidade) {
    return this.contextualizacao.profissionais.filter(
      prof => prof.ativo && prof.especialidades.includes(especialidade)
    );
  }

  getConsultas() {
    return this.contextualizacao.servicos.consultas.filter(consulta => consulta.ativo);
  }

  getExames() {
    return this.contextualizacao.servicos.exames.filter(exame => exame.ativo);
  }

  getExamePorId(id) {
    return this.contextualizacao.servicos.exames.find(exame => exame.id === id && exame.ativo);
  }

  getConsultaPorId(id) {
    return this.contextualizacao.servicos.consultas.find(consulta => consulta.id === id && consulta.ativo);
  }

  getConvenios() {
    return this.contextualizacao.convenios.filter(convenio => convenio.ativo);
  }

  getConvenioPorNome(nome) {
    return this.contextualizacao.convenios.find(
      convenio => convenio.nome.toLowerCase() === nome.toLowerCase() && convenio.ativo
    );
  }

  getFormasPagamento() {
    return this.contextualizacao.formas_pagamento;
  }

  getPoliticasAgendamento() {
    return this.contextualizacao.politicas.agendamento;
  }

  getPoliticasAtendimento() {
    return this.contextualizacao.politicas.atendimento;
  }

  isClinicaAberta() {
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

  getProximoHorarioAbertura() {
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

  gerarContextoChatbot() {
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

  getDiaSemana(dia) {
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    return dias[dia];
  }

  converterHoraParaMinutos(hora) {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }
}

// Teste da contextualização
console.log('=== TESTE DA CONTEXTUALIZAÇÃO ESADI ===\n');

const service = new ContextualizacaoService(contextualizacaoData);

// Teste 1: Informações básicas
console.log('1. INFORMAÇÕES BÁSICAS:');
const infoBasicas = service.getInformacoesBasicas();
console.log(`- Nome: ${infoBasicas.nome}`);
console.log(`- Razão Social: ${infoBasicas.razao_social}`);
console.log(`- Especialidade: ${infoBasicas.especialidade_principal}`);
console.log(`- Especialidades: ${infoBasicas.especialidades_secundarias.join(', ')}`);
console.log('');

// Teste 2: Contatos
console.log('2. CONTATOS:');
const contatos = service.getContatos();
console.log(`- Telefone: ${contatos.telefone_principal}`);
console.log(`- WhatsApp: ${contatos.whatsapp}`);
console.log(`- Email: ${contatos.email_principal}`);
console.log(`- Website: ${contatos.website}`);
console.log('');

// Teste 3: Localização
console.log('3. LOCALIZAÇÃO:');
const localizacao = service.getLocalizacao();
console.log(`- Endereço: ${localizacao.endereco_principal.logradouro}, ${localizacao.endereco_principal.numero}`);
console.log(`- Complemento: ${localizacao.endereco_principal.complemento}`);
console.log(`- Bairro: ${localizacao.endereco_principal.bairro}`);
console.log(`- Cidade: ${localizacao.endereco_principal.cidade} - ${localizacao.endereco_principal.estado}`);
console.log(`- CEP: ${localizacao.endereco_principal.cep}`);
console.log('');

// Teste 4: Profissionais
console.log('4. PROFISSIONAIS:');
const profissionais = service.getProfissionais();
profissionais.forEach(prof => {
  console.log(`- ${prof.nome_completo} (${prof.crm})`);
  console.log(`  Especialidades: ${prof.especialidades.join(', ')}`);
  console.log(`  Experiência: ${prof.experiencia}`);
});
console.log('');

// Teste 5: Serviços
console.log('5. SERVIÇOS:');
const consultas = service.getConsultas();
const exames = service.getExames();

console.log('Consultas:');
consultas.forEach(consulta => {
  console.log(`- ${consulta.nome}: R$ ${consulta.preco_particular.toFixed(2)}`);
});

console.log('Exames:');
exames.forEach(exame => {
  console.log(`- ${exame.nome}: R$ ${exame.preco_particular.toFixed(2)}`);
});
console.log('');

// Teste 6: Convênios
console.log('6. CONVÊNIOS:');
const convenios = service.getConvenios();
convenios.forEach(convenio => {
  console.log(`- ${convenio.nome}${convenio.copagamento ? ` (Copagamento: R$ ${convenio.valor_copagamento})` : ' (Sem copagamento)'}`);
});
console.log('');

// Teste 7: Status da clínica
console.log('7. STATUS DA CLÍNICA:');
const isAberta = service.isClinicaAberta();
console.log(`- Clínica está aberta: ${isAberta ? 'Sim' : 'Não'}`);

if (!isAberta) {
  const proximoHorario = service.getProximoHorarioAbertura();
  if (proximoHorario) {
    console.log(`- Próximo horário de abertura: ${proximoHorario.dia} às ${proximoHorario.horario}`);
  }
}
console.log('');

// Teste 8: Contexto do chatbot
console.log('8. CONTEXTO DO CHATBOT:');
const contexto = service.gerarContextoChatbot();
console.log(contexto);
console.log('');

// Teste 9: Busca por especialidade
console.log('9. BUSCA POR ESPECIALIDADE:');
const gastroProfissionais = service.getProfissionaisPorEspecialidade('Gastroenterologia');
console.log('Profissionais de Gastroenterologia:');
gastroProfissionais.forEach(prof => {
  console.log(`- ${prof.nome_completo}`);
});
console.log('');

// Teste 10: Busca de convênio
console.log('10. BUSCA DE CONVÊNIO:');
const unimed = service.getConvenioPorNome('Unimed');
if (unimed) {
  console.log(`- ${unimed.nome}: ${unimed.copagamento ? `Copagamento R$ ${unimed.valor_copagamento}` : 'Sem copagamento'}`);
}
console.log('');

console.log('=== TESTE CONCLUÍDO COM SUCESSO ==='); 