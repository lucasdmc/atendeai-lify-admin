// Arquivo: src/services/ai/contextualizedChatService.ts

import { contextualizacaoService } from '../contextualizacaoService';
import { LLMOrchestratorService } from './llmOrchestratorService';
import { ConversationMemoryService } from './conversationMemoryService';

export interface ContextualizedMessage {
  phoneNumber: string;
  message: string;
  context?: {
    isNewConversation?: boolean;
    previousIntent?: string;
    userProfile?: Record<string, unknown>;
  };
}

export class ContextualizedChatService {
  private static contextCache: Map<string, string> = new Map();
  
  /**
   * Processa mensagem com contextualização completa da clínica
   */
  static async processMessage(data: ContextualizedMessage): Promise<string> {
    try {
      // 1. Carregar contexto da clínica
      const clinicContext = this.getOrCreateContext();
      
      // 2. Carregar memória da conversa
      const memory = await ConversationMemoryService.loadMemory(data.phoneNumber);
      
      // 3. Determinar se é uma nova conversa
      const isNewConversation = data.context?.isNewConversation || 
        !memory.history || memory.history.length === 0;
      
      // 4. Criar prompt contextualizado
      const contextualizedPrompt = this.buildContextualizedPrompt(
        data.message,
        clinicContext,
        memory,
        isNewConversation
      );
      
      // 5. Processar através do orquestrador com contexto
      const response = await LLMOrchestratorService.processMessage({
        phoneNumber: data.phoneNumber,
        message: contextualizedPrompt
      });
      
      // 6. Salvar na memória
      await ConversationMemoryService.addInteraction(
        data.phoneNumber,
        data.message,
        response.response
      );
      
      return response.response;
      
    } catch (error) {
      console.error('Erro ao processar mensagem contextualizada:', error);
      return this.getFallbackResponse();
    }
  }
  
  /**
   * Constrói o contexto completo da clínica para o chatbot
   */
  private static getOrCreateContext(): string {
    // Verificar cache
    if (this.contextCache.has('clinic_context')) {
      return this.contextCache.get('clinic_context')!;
    }
    
    // Buscar dados da contextualização
    const contexto = contextualizacaoService.getContextualizacao();
    const info = contexto.clinica.informacoes_basicas;
    const contatos = contexto.clinica.contatos;
    const localizacao = contexto.clinica.localizacao;
    const agente = contexto.agente_ia.configuracao;
    const horarios = contexto.clinica.horario_funcionamento;
    const profissionais = contextualizacaoService.getProfissionais();
    const exames = contextualizacaoService.getExames();
    const consultas = contextualizacaoService.getConsultas();
    const convenios = contextualizacaoService.getConvenios();
    const formasPagamento = contextualizacaoService.getFormasPagamento();
    
    // Construir contexto detalhado
    const contextText = `
Você é ${agente.nome}, assistente virtual da ${info.nome}.

INFORMAÇÕES DA CLÍNICA:
Nome: ${info.nome} (${info.razao_social})
CNPJ: ${info.cnpj}
Especialidade Principal: ${info.especialidade_principal}
Outras Especialidades: ${info.especialidades_secundarias.join(', ')}

DESCRIÇÃO:
${info.descricao}

MISSÃO:
${info.missao}

VALORES:
${info.valores.map(v => `- ${v}`).join('\n')}

DIFERENCIAIS:
${info.diferenciais.map(d => `- ${d}`).join('\n')}

LOCALIZAÇÃO:
${localizacao.endereco_principal.logradouro}, ${localizacao.endereco_principal.numero}
${localizacao.endereco_principal.complemento}
${localizacao.endereco_principal.bairro}, ${localizacao.endereco_principal.cidade} - ${localizacao.endereco_principal.estado}
CEP: ${localizacao.endereco_principal.cep}

CONTATOS:
Telefone: ${contatos.telefone_principal}
WhatsApp: ${contatos.whatsapp}
E-mail: ${contatos.email_principal}
Website: ${contatos.website}

HORÁRIO DE FUNCIONAMENTO:
${Object.entries(horarios).map(([dia, horario]) => {
  if (horario.abertura && horario.fechamento) {
    return `${dia.charAt(0).toUpperCase() + dia.slice(1)}: ${horario.abertura} às ${horario.fechamento}`;
  }
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)}: Fechado`;
}).join('\n')}

PROFISSIONAIS:
${profissionais.map(prof => `
Dr(a). ${prof.nome_exibicao} - CRM: ${prof.crm}
Especialidades: ${prof.especialidades.join(', ')}
${prof.experiencia}
`).join('\n')}

EXAMES DISPONÍVEIS:
${exames.map(exame => `
- ${exame.nome}: ${exame.descricao}
  Duração: ${exame.duracao_minutos} minutos
  Preparo: ${exame.preparacao.instrucoes_especiais}
  Resultado em: ${exame.resultado_prazo_dias} dias
  Valor particular: R$ ${exame.preco_particular.toFixed(2)}
`).join('\n')}

CONSULTAS:
${consultas.map(consulta => `
- ${consulta.nome}: ${consulta.descricao}
  Duração: ${consulta.duracao_minutos} minutos
  Valor particular: R$ ${consulta.preco_particular.toFixed(2)}
`).join('\n')}

CONVÊNIOS ACEITOS:
${convenios.map(conv => conv.nome).join(', ')}

FORMAS DE PAGAMENTO:
${formasPagamento.dinheiro ? '- Dinheiro' : ''}
${formasPagamento.cartao_credito ? '- Cartão de Crédito' : ''}
${formasPagamento.cartao_debito ? '- Cartão de Débito' : ''}
${formasPagamento.pix ? '- PIX' : ''}
${formasPagamento.parcelamento.disponivel ? `- Parcelamento em até ${formasPagamento.parcelamento.max_parcelas}x` : ''}

PERSONALIDADE E TOM:
${agente.personalidade}
Tom de comunicação: ${agente.tom_comunicacao}
Nível de formalidade: ${agente.nivel_formalidade}

INSTRUÇÕES DE COMPORTAMENTO:
1. Sempre seja ${agente.tom_comunicacao.toLowerCase()} e ${agente.nivel_formalidade.toLowerCase()}
2. Use emojis moderadamente para tornar a conversa mais amigável
3. Forneça informações precisas sobre a clínica, serviços e profissionais
4. Para agendamentos, colete: nome completo, CPF, data de nascimento, telefone, tipo de exame/consulta
5. Sempre confirme os dados antes de finalizar um agendamento
6. Se não souber algo, seja honesto e ofereça alternativas
7. Em caso de emergência, oriente a procurar o pronto-socorro

SAUDAÇÃO PADRÃO: ${agente.saudacao_inicial}
DESPEDIDA PADRÃO: ${agente.mensagem_despedida}
`.trim();
    
    // Cachear contexto
    this.contextCache.set('clinic_context', contextText);
    
    return contextText;
  }
  
  /**
   * Constrói prompt contextualizado com histórico
   */
  private static buildContextualizedPrompt(
    userMessage: string,
    clinicContext: string,
    memory: any,
    isNewConversation: boolean
  ): string {
    let prompt = userMessage;
    
    // Se é nova conversa, adicionar contexto de boas-vindas
    if (isNewConversation) {
      const agente = contextualizacaoService.getConfiguracaoAgenteIA();
      prompt = `[NOVA CONVERSA - Use a saudação: "${agente.saudacao_inicial}"]\n\nMensagem do usuário: ${userMessage}`;
    }
    
    // Adicionar contexto do histórico recente se houver
    if (memory?.history && Array.isArray(memory.history) && memory.history.length > 0) {
      const recentHistory = memory.history.slice(-3); // Últimas 3 interações
      const historyContext = recentHistory.map((h: any) => 
        `${h.role === 'user' ? 'Usuário' : 'Assistente'}: ${h.content}`
      ).join('\n');
      
      prompt = `Histórico recente:\n${historyContext}\n\nNova mensagem: ${userMessage}`;
    }
    
    // Adicionar informações do perfil do usuário se disponível
    if (memory?.userProfile) {
      prompt += `\n\n[Informações do usuário: ${JSON.stringify(memory.userProfile)}]`;
    }
    
    return prompt;
  }
  
  /**
   * Resposta de fallback em caso de erro
   */
  private static getFallbackResponse(): string {
    const agente = contextualizacaoService.getConfiguracaoAgenteIA();
    return `Desculpe, estou com dificuldades técnicas no momento. ${agente.mensagem_despedida} Por favor, entre em contato pelo telefone ${contextualizacaoService.getContatos().telefone_principal}.`;
  }
  
  /**
   * Verifica se a clínica está aberta
   */
  static isClinicOpen(): boolean {
    return contextualizacaoService.isClinicaAberta();
  }
  
  /**
   * Obtém mensagem para fora do horário
   */
  static getOutOfHoursMessage(): string {
    const agente = contextualizacaoService.getConfiguracaoAgenteIA();
    const proximoHorario = contextualizacaoService.getProximoHorarioAbertura();
    
    let mensagem = agente.mensagem_fora_horario;
    
    if (proximoHorario) {
      mensagem += ` Retornaremos ${proximoHorario.dia} às ${proximoHorario.horario}.`;
    }
    
    return mensagem;
  }
  
  /**
   * Limpa o cache de contexto
   */
  static clearCache(): void {
    this.contextCache.clear();
  }
} 