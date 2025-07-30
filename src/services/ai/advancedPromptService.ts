import { supabase } from '@/integrations/supabase/client';

export interface PromptContext {
  agentType: string;
  intent: string;
  clinicContext: any;
  userProfile?: any;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  medicalValidation?: boolean;
  confidenceLevel?: number;
}

export interface FewShotExample {
  input: string;
  output: string;
  intent: string;
  quality: number;
  context?: any;
}

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  intent: string;
  quality: number;
  usage: number;
}

export class AdvancedPromptService {
  private readonly basePrompt = `# IDENTIDADE E CONFIGURAÇÃO DO ASSISTENTE

Você é um assistente virtual especializado em atendimento médico, focado em agendamentos e informações sobre clínicas.

## DIRETRIZES FUNDAMENTAIS:
- SEMPRE seja profissional e acolhedor
- NUNCA forneça diagnósticos médicos
- NUNCA prescreva medicamentos
- SEMPRE direcione questões médicas para profissionais
- Use linguagem clara e acessível
- Confirme informações importantes antes de agendar

## COMPORTAMENTO:
- Seja proativo em oferecer ajuda
- Mantenha contexto da conversa
- Ofereça sugestões relevantes quando apropriado
- Solicite feedback para melhorar o atendimento`;

  private readonly constraintsPrompt = `
## RESTRIÇÕES IMPORTANTES:
- NUNCA forneça diagnósticos médicos
- NUNCA recomende medicamentos específicos
- SEMPRE direcione questões médicas para profissionais
- Mantenha tom profissional mas acolhedor
- Use linguagem clara e acessível
- Confirme informações importantes
- Não invente informações não fornecidas no contexto
- Se uma informação não estiver disponível, diga educadamente que não possui essa informação`;

  private readonly fewShotExamples: Record<string, FewShotExample[]> = {
    'APPOINTMENT_CREATE': [
      {
        input: 'Quero agendar uma consulta',
        output: 'Claro! Para agendar sua consulta, preciso de algumas informações:\n\n1. Qual especialidade você precisa?\n2. Você tem preferência de data e horário?\n3. É particular ou convênio?\n\nPosso ajudar você a encontrar a melhor opção!',
        intent: 'APPOINTMENT_CREATE',
        quality: 0.9
      },
      {
        input: 'Preciso marcar uma consulta com cardiologista',
        output: 'Perfeito! Vou ajudar você a agendar uma consulta com cardiologista.\n\nPara prosseguir, preciso saber:\n\n1. Qual sua preferência de data? (ex: próxima semana, mês que vem)\n2. Qual horário você prefere? (manhã, tarde, noite)\n3. É particular ou tem convênio?\n\nCom essas informações, posso verificar nossa disponibilidade e agendar para você!',
        intent: 'APPOINTMENT_CREATE',
        quality: 0.95
      }
    ],
    'INFO_SERVICES': [
      {
        input: 'Que serviços vocês oferecem?',
        output: 'Nossa clínica oferece diversas especialidades:\n\n• Clínica Geral\n• Cardiologia\n• Dermatologia\n• Pediatria\n• Ginecologia\n• Ortopedia\n• Neurologia\n• Psicologia\n\nGostaria de saber mais sobre alguma especialidade específica ou agendar uma consulta?',
        intent: 'INFO_SERVICES',
        quality: 0.9
      }
    ],
    'INFO_HOURS': [
      {
        input: 'Qual o horário de funcionamento?',
        output: 'Nosso horário de funcionamento:\n\n📅 Segunda a Sexta: 8h às 18h\n📅 Sábado: 8h às 12h\n📅 Domingo: Fechado\n\nPara emergências fora do horário, temos plantão 24h. Gostaria de agendar uma consulta?',
        intent: 'INFO_HOURS',
        quality: 0.95
      }
    ],
    'GREETING': [
      {
        input: 'Olá',
        output: 'Olá! 👋 Bem-vindo à nossa clínica!\n\nComo posso ajudar você hoje? Posso auxiliar com:\n\n• Agendamento de consultas\n• Informações sobre especialidades\n• Horários de funcionamento\n• Localização\n\nO que você gostaria de saber?',
        intent: 'GREETING',
        quality: 0.9
      }
    ]
  };

  /**
   * Gera prompt de sistema avançado baseado no contexto
   */
  generateSystemPrompt(context: PromptContext): string {
    const basePrompt = this.getBasePrompt();
    const rolePrompt = this.getRolePrompt(context.agentType);
    const contextPrompt = this.getContextPrompt(context);
    const constraintsPrompt = this.getConstraintsPrompt();
    const examplesPrompt = this.getFewShotExamples(context.intent);
    const medicalPrompt = context.medicalValidation ? this.getMedicalSafetyPrompt() : '';
    const confidencePrompt = context.confidenceLevel && context.confidenceLevel < 0.7 ? this.getLowConfidencePrompt() : '';

    return `${basePrompt}\n\n${rolePrompt}\n\n${contextPrompt}\n\n${constraintsPrompt}\n\n${examplesPrompt}\n\n${medicalPrompt}\n\n${confidencePrompt}`.trim();
  }

  /**
   * Gera prompt base do sistema
   */
  private getBasePrompt(): string {
    return this.basePrompt;
  }

  /**
   * Gera prompt específico do papel/agente
   */
  private getRolePrompt(agentType: string): string {
    const rolePrompts: Record<string, string> = {
      'receptionist': `
## PAPEL: Recepcionista Virtual
- Foco principal: Agendamentos e informações básicas
- Tom: Acolhedor e profissional
- Prioridade: Eficiência no atendimento
- Especialidade: Organização e agendamentos`,

      'medical_assistant': `
## PAPEL: Assistente Médico Virtual
- Foco principal: Informações médicas e orientações
- Tom: Profissional e cuidadoso
- Prioridade: Segurança e precisão
- Especialidade: Informações sobre procedimentos e especialidades`,

      'customer_service': `
## PAPEL: Atendimento ao Cliente
- Foco principal: Resolução de problemas e suporte
- Tom: Empático e solucionador
- Prioridade: Satisfação do cliente
- Especialidade: Resolução de questões e feedback`
    };

    return rolePrompts[agentType] || rolePrompts['receptionist'];
  }

  /**
   * Gera prompt de contexto da clínica
   */
  private getContextPrompt(context: PromptContext): string {
    if (!context.clinicContext) {
      return `
## CONTEXTO DA CLÍNICA:
- Clínica médica geral
- Atendimento humanizado
- Profissionais qualificados
- Foco na qualidade do atendimento`;
    }

    const clinic = context.clinicContext;
    
    return `
## INFORMAÇÕES DA CLÍNICA:

### Dados Básicos:
- Nome: ${clinic.name || 'Clínica Médica'}
- Especialidade Principal: ${clinic.specialty || 'Medicina Geral'}
- Missão: ${clinic.mission || 'Cuidar da saúde dos pacientes'}

### Localização e Contato:
- Endereço: ${clinic.address || 'Endereço não informado'}
- Telefone: ${clinic.phone || 'Telefone não informado'}
- WhatsApp: ${clinic.whatsapp || 'WhatsApp não informado'}

### Horário de Funcionamento:
${this.formatBusinessHours(clinic.businessHours)}

### Serviços Disponíveis:
${this.formatServices(clinic.services)}

### Políticas:
${this.formatPolicies(clinic.policies)}`;
  }

  /**
   * Gera prompt de restrições
   */
  private getConstraintsPrompt(): string {
    return this.constraintsPrompt;
  }

  /**
   * Gera exemplos few-shot para a intenção
   */
  private getFewShotExamples(intent: string): string {
    const examples = this.fewShotExamples[intent];
    
    if (!examples || examples.length === 0) {
      return '';
    }

    const examplesText = examples
      .filter(ex => ex.quality > 0.8) // Apenas exemplos de alta qualidade
      .map(ex => `Exemplo:\nUsuário: "${ex.input}"\nAssistente: "${ex.output}"`)
      .join('\n\n');

    return examplesText ? `\n## EXEMPLOS DE RESPOSTAS:\n\n${examplesText}` : '';
  }

  /**
   * Gera prompt de segurança médica
   */
  private getMedicalSafetyPrompt(): string {
    return `
## SEGURANÇA MÉDICA - ATENÇÃO ESPECIAL:
- NUNCA forneça diagnósticos ou opiniões médicas
- NUNCA recomende medicamentos ou tratamentos
- SEMPRE direcione questões médicas para profissionais
- Se detectar sintomas ou problemas médicos, sugira consulta imediata
- Para emergências, sempre oriente procurar atendimento médico urgente
- Mantenha tom calmo mas direto em situações médicas`;
  }

  /**
   * Gera prompt para situações de baixa confiança
   */
  private getLowConfidencePrompt(): string {
    return `
## SITUAÇÃO DE BAIXA CONFIANÇA:
- Seja mais cauteloso nas respostas
- Peça esclarecimentos quando necessário
- Confirme informações antes de prosseguir
- Ofereça transferir para atendente humano se apropriado
- Mantenha tom profissional e acolhedor`;
  }

  /**
   * Formata horários de funcionamento
   */
  private formatBusinessHours(hours: any): string {
    if (!hours) {
      return 'Segunda a Sexta: 8h às 18h\nSábado: 8h às 12h\nDomingo: Fechado';
    }

    const days = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
    const formatted = days.map(day => {
      const dayHours = hours[day];
      if (dayHours) {
        return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${dayHours.opening || '8h'} às ${dayHours.closing || '18h'}`;
      }
      return `${day.charAt(0).toUpperCase() + day.slice(1)}: Fechado`;
    });

    return formatted.join('\n');
  }

  /**
   * Formata serviços disponíveis
   */
  private formatServices(services: any): string {
    if (!services || !Array.isArray(services)) {
      return '• Clínica Geral\n• Especialidades diversas';
    }

    return services
      .map(service => `• ${service.name || service}`)
      .join('\n');
  }

  /**
   * Formata políticas da clínica
   */
  private formatPolicies(policies: any): string {
    if (!policies) {
      return '• Agendamento com antecedência\n• Cancelamento com 24h de antecedência\n• Atendimento humanizado';
    }

    const policyList = [];
    
    if (policies.cancellation) {
      policyList.push(`• Cancelamento: ${policies.cancellation}`);
    }
    
    if (policies.rescheduling) {
      policyList.push(`• Reagendamento: ${policies.rescheduling}`);
    }
    
    if (policies.insurance) {
      policyList.push(`• Convênios: ${policies.insurance}`);
    }

    return policyList.length > 0 ? policyList.join('\n') : '• Políticas padrão da clínica';
  }

  /**
   * Gera prompt contextual dinâmico
   */
  generateContextualPrompt(
    basePrompt: string,
    context: string,
    additionalInfo?: any
  ): string {
    let contextualPrompt = basePrompt;

    // Adicionar contexto específico
    if (context) {
      contextualPrompt += `\n\n## CONTEXTO ESPECÍFICO:\n${context}`;
    }

    // Adicionar informações adicionais
    if (additionalInfo) {
      contextualPrompt += `\n\n## INFORMAÇÕES ADICIONAIS:\n${JSON.stringify(additionalInfo, null, 2)}`;
    }

    return contextualPrompt;
  }

  /**
   * Otimiza prompt baseado em feedback
   */
  async optimizePromptFromFeedback(
    promptId: string,
    feedback: {
      quality: number;
      userSatisfaction: number;
      escalationRate: number;
      comments?: string;
    }
  ): Promise<void> {
    try {
      await supabase
        .from('prompt_feedback')
        .insert({
          prompt_id: promptId,
          quality_score: feedback.quality,
          user_satisfaction: feedback.userSatisfaction,
          escalation_rate: feedback.escalationRate,
          comments: feedback.comments,
          timestamp: new Date().toISOString()
        });

      console.log(`✅ Feedback registrado para prompt ${promptId}`);
    } catch (error) {
      console.error('❌ Erro ao registrar feedback do prompt:', error);
    }
  }

  /**
   * Aprende novos exemplos few-shot
   */
  async learnNewExample(example: FewShotExample): Promise<void> {
    try {
      // Adicionar exemplo à base de conhecimento
      await supabase
        .from('few_shot_examples')
        .insert({
          input: example.input,
          output: example.output,
          intent: example.intent,
          quality: example.quality,
          context: example.context,
          created_at: new Date().toISOString()
        });

      // Atualizar cache local
      if (!this.fewShotExamples[example.intent]) {
        this.fewShotExamples[example.intent] = [];
      }
      
      this.fewShotExamples[example.intent].push(example);

      console.log(`✅ Novo exemplo aprendido para intent: ${example.intent}`);
    } catch (error) {
      console.error('❌ Erro ao aprender novo exemplo:', error);
    }
  }

  /**
   * Carrega exemplos da base de dados
   */
  async loadExamplesFromDatabase(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('few_shot_examples')
        .select('*')
        .gte('quality', 0.8) // Apenas exemplos de alta qualidade
        .order('quality', { ascending: false });

      if (error) throw error;

      // Agrupar por intent
      const groupedExamples: Record<string, FewShotExample[]> = {};
      
      data.forEach(example => {
        if (!groupedExamples[example.intent]) {
          groupedExamples[example.intent] = [];
        }
        groupedExamples[example.intent].push({
          input: example.input,
          output: example.output,
          intent: example.intent,
          quality: example.quality,
          context: example.context
        });
      });

      // Atualizar cache local
      this.fewShotExamples = { ...this.fewShotExamples, ...groupedExamples };

      console.log(`✅ Carregados ${data.length} exemplos da base de dados`);
    } catch (error) {
      console.error('❌ Erro ao carregar exemplos da base de dados:', error);
    }
  }

  /**
   * Gera prompt para validação médica
   */
  generateMedicalValidationPrompt(): string {
    return `
## VALIDAÇÃO MÉDICA - PROMPT ESPECIAL:

Você é um sistema de validação médica. Sua função é:

1. DETECTAR conteúdo médico na resposta
2. AVALIAR se a resposta é segura
3. SUGERIR escalação se necessário

### CRITÉRIOS DE VALIDAÇÃO:
- A resposta contém diagnósticos médicos?
- A resposta recomenda medicamentos?
- A resposta faz afirmações médicas definitivas?
- A resposta pode causar dano se seguida?

### RESPOSTA ESPERADA:
- "SAFE" se a resposta é segura
- "UNSAFE" se a resposta é perigosa
- "ESCALATE" se deve escalar para humano
- Justificativa da decisão

### EXEMPLOS:
Resposta: "Você tem gripe"
Resultado: "UNSAFE - Diagnóstico médico sem qualificação"

Resposta: "Para gripe, consulte um médico"
Resultado: "SAFE - Orientação apropriada"

Resposta: "Tome paracetamol para dor"
Resultado: "UNSAFE - Prescrição de medicamento"`;
  }

  /**
   * Gera prompt para análise de qualidade
   */
  generateQualityAnalysisPrompt(): string {
    return `
## ANÁLISE DE QUALIDADE - PROMPT ESPECIAL:

Avalie a qualidade da resposta do assistente virtual:

### CRITÉRIOS:
1. RELEVÂNCIA: A resposta aborda a pergunta do usuário?
2. COMPLETUDE: A resposta fornece informações suficientes?
3. CLAREZA: A resposta é fácil de entender?
4. APROPRIATEZA: A resposta é apropriada para o contexto?

### ESCALA:
- 0.0-0.3: Muito baixa qualidade
- 0.4-0.6: Qualidade baixa
- 0.7-0.8: Qualidade boa
- 0.9-1.0: Qualidade excelente

### RESPOSTA ESPERADA:
- Score: [0.0-1.0]
- Justificativa: [explicação detalhada]
- Sugestões: [melhorias possíveis]`;
  }
} 