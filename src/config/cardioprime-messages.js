// ========================================
// CONFIGURAÇÃO DE MENSAGENS DA CARDIOPRIME
// ========================================
// Este arquivo contém as mensagens formatadas corretamente
// para evitar problemas de formatação no WhatsApp

export const CARDIOPRIME_MESSAGES = {
  // Mensagem sobre exames oferecidos
  exames: {
    titulo: "A CardioPrime oferece os seguintes exames:",
    lista: [
      {
        numero: "1.",
        nome: "Ecocardiograma Transtorácico",
        descricao: "Um ultrassom do coração que avalia a função cardíaca."
      },
      {
        numero: "2.",
        nome: "Teste Ergométrico",
        descricao: "Um teste de esforço para avaliar a capacidade cardíaca durante o exercício."
      },
      {
        numero: "3.",
        nome: "Holter 24 horas",
        descricao: "Monitorização contínua do ritmo cardíaco por 24 horas."
      }
    ],
    conclusao: "Esses exames são essenciais para uma avaliação detalhada da saúde cardiovascular.",
    acao: "Caso tenha interesse em agendar algum deles ou tenha dúvidas específicas, estou à disposição para ajudar."
  },

  // Mensagem sobre profissionais
  profissionais: {
    titulo: "Na CardioPrime, contamos com dois profissionais especializados em cardiologia:",
    lista: [
      {
        numero: "1.",
        nome: "Dr. Roberto Silva",
        descricao: "Médico cardiologista com vasta experiência na área."
      },
      {
        numero: "2.",
        nome: "Dra. Maria Fernanda",
        descricao: "Médica cardiologista também com sólida formação e atuação em cardiologia."
      }
    ],
    conclusao: "Ambos estão disponíveis para consultas e atendem a diferentes necessidades relacionadas à saúde cardiovascular.",
    acao: "Se precisar agendar uma consulta ou obter mais informações, estou à disposição para ajudar."
  },

  // Função para formatar mensagem de exames
  formatExamesMessage: function() {
    let message = this.exames.titulo + "\n\n";
    
    this.exames.lista.forEach(item => {
      message += `${item.numero} ${item.nome}: ${item.descricao}\n`;
    });
    
    message += `\n${this.exames.conclusao}\n\n${this.exames.acao}`;
    
    return message;
  },

  // Função para formatar mensagem de profissionais
  formatProfissionaisMessage: function() {
    let message = this.profissionais.titulo + "\n\n";
    
    this.profissionais.lista.forEach(item => {
      message += `${item.numero} *${item.nome}* - ${item.descricao}\n`;
    });
    
    message += `\n${this.profissionais.conclusao}\n\n${this.profissionais.acao}`;
    
    return message;
  }
};

// Função utilitária para formatar mensagens com quebras de linha corretas
export const formatMessage = {
  // Adiciona quebras de linha duplas entre seções
  addSectionBreaks: (text) => {
    return text.replace(/([.!?])\s+/g, '$1\n\n');
  },

  // Formata listas numeradas com espaçamento correto
  formatNumberedList: (items) => {
    return items.map((item, index) => {
      return `${index + 1}. ${item}`;
    }).join('\n');
  },

  // Formata nomes de profissionais com negrito (WhatsApp)
  formatProfessionalName: (name) => {
    return `*${name}*`;
  },

  // Remove espaços extras e normaliza quebras de linha
  cleanFormatting: (text) => {
    return text
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove quebras de linha triplas
      .replace(/\s+/g, ' ') // Remove espaços múltiplos
      .trim();
  }
};

export default CARDIOPRIME_MESSAGES;
