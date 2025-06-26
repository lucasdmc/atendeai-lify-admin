
// Agent context management for WhatsApp integration
type AgentContext = {
  id: string;
  agent_id: string;
  category: 'informacoes_basicas' | 'profissionais' | 'procedimentos_especialidades' | 'regras_politicas_clinica' | 'regras_politicas_procedimentos';
  title: string;
  content: string;
  created_at: string | null;
  updated_at: string | null;
};

type Agent = {
  id: string;
  name: string;
  description: string | null;
  personality: string | null;
  temperature: number | null;
  clinic_id: string;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type Clinic = {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export class AgentContextManager {
  static async getAgentByPhone(phoneNumber: string, supabase: any): Promise<Agent | null> {
    console.log(`🔍 Buscando agente para número: ${phoneNumber}`);
    
    const { data: association, error } = await supabase
      .from('agent_phone_associations')
      .select(`
        agent_id,
        agents!inner(*)
      `)
      .eq('phone_number', phoneNumber)
      .eq('is_active', true)
      .single();

    if (error) {
      console.log(`⚠️ Nenhuma associação encontrada para ${phoneNumber}, usando agente padrão`);
      return await this.getDefaultAgent(supabase);
    }

    console.log(`✅ Agente encontrado: ${association.agents.name}`);
    return association.agents;
  }

  static async getDefaultAgent(supabase: any): Promise<Agent | null> {
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (error) {
      console.error('❌ Erro ao buscar agente padrão:', error);
      return null;
    }

    return agent;
  }

  static async getAgentContexts(agentId: string, supabase: any): Promise<AgentContext[]> {
    console.log(`📋 Buscando contextos para agente: ${agentId}`);
    
    const { data: contexts, error } = await supabase
      .from('agent_contexts')
      .select('*')
      .eq('agent_id', agentId)
      .order('category', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar contextos do agente:', error);
      return [];
    }

    console.log(`✅ ${contexts.length} contextos encontrados`);
    return contexts;
  }

  static async getClinicByAgent(agentId: string, supabase: any): Promise<Clinic | null> {
    const { data: agent, error } = await supabase
      .from('agents')
      .select(`
        clinic_id,
        clinics!inner(*)
      `)
      .eq('id', agentId)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar clínica do agente:', error);
      return null;
    }

    return agent.clinics;
  }

  static buildContextPrompt(agent: Agent, contexts: AgentContext[], clinic: Clinic | null): string {
    let prompt = `Você é ${agent.name}`;
    
    if (agent.description) {
      prompt += `, ${agent.description}`;
    }

    if (clinic) {
      prompt += ` da ${clinic.name}`;
    }

    prompt += `.\n\n`;

    if (agent.personality) {
      prompt += `**Personalidade:** ${agent.personality}\n\n`;
    }

    // Agrupar contextos por categoria
    const contextsByCategory = contexts.reduce((acc, context) => {
      if (!acc[context.category]) {
        acc[context.category] = [];
      }
      acc[context.category].push(context);
      return acc;
    }, {} as Record<string, AgentContext[]>);

    // Adicionar contextos organizados por categoria
    const categoryNames = {
      'informacoes_basicas': 'Informações Básicas',
      'profissionais': 'Profissionais',
      'procedimentos_especialidades': 'Procedimentos e Especialidades',
      'regras_politicas_clinica': 'Regras e Políticas da Clínica',
      'regras_politicas_procedimentos': 'Regras e Políticas de Procedimentos'
    };

    Object.entries(contextsByCategory).forEach(([category, categoryContexts]) => {
      const categoryName = categoryNames[category as keyof typeof categoryNames] || category;
      prompt += `**${categoryName}:**\n`;
      
      categoryContexts.forEach(context => {
        prompt += `- ${context.title}: ${context.content}\n`;
      });
      
      prompt += `\n`;
    });

    prompt += `
**Instruções importantes:**
- Seja sempre profissional, empático e prestativo
- Use emojis com moderação para tornar a conversa mais amigável
- Forneça informações precisas baseadas no contexto fornecido
- Se não souber algo, seja honesto e ofereça ajuda para entrar em contato
- Para agendamentos, use as ferramentas disponíveis quando apropriado
- Mantenha as respostas concisas mas completas
`;

    return prompt;
  }

  static async updateConversationAgent(conversationId: string, agentId: string, clinicId: string, supabase: any): Promise<void> {
    const { error } = await supabase
      .from('whatsapp_conversations')
      .update({
        agent_id: agentId,
        clinic_id: clinicId
      })
      .eq('id', conversationId);

    if (error) {
      console.error('❌ Erro ao atualizar conversa com agente:', error);
    } else {
      console.log(`✅ Conversa ${conversationId} associada ao agente ${agentId}`);
    }
  }
}
