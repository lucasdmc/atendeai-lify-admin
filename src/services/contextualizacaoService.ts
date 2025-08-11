// ✅ SISTEMA MULTICLÍNICA: Sem referências hardcoded
// Os dados vêm dinamicamente do banco de dados (tela de clínicas)

export interface ClinicContext {
  id: string;
  name: string;
  specialty: string;
  doctors: any[];
  schedule: any;
  services: any[];
  location: any;
  contact: any;
  policies: any;
  assistant: any;
}

export class ContextualizacaoService {
  /**
   * ✅ SISTEMA MULTICLÍNICA: Obtém contexto de uma clínica por ID
   * Os dados vêm dinamicamente do banco de dados
   */
  static async getClinicContext(clinicId: string): Promise<any> {
    try {
      // ✅ IMPLEMENTAÇÃO FUTURA: Buscar do banco de dados
      // Por enquanto, retorna null para forçar uso do ClinicContextManager
      console.log(`🔍 [ContextualizacaoService] Buscando contexto para: ${clinicId}`);
      console.log(`⚠️ [ContextualizacaoService] Use ClinicContextManager.getClinicContext() em vez deste serviço`);
      
      return null;
    } catch (error) {
      console.error('❌ [ContextualizacaoService] Erro ao obter contexto da clínica:', error);
      return null;
    }
  }

  /**
   * ✅ SISTEMA MULTICLÍNICA: Obtém clínica por número do WhatsApp
   * Os dados vêm dinamicamente do banco de dados
   */
  static async getClinicByWhatsAppNumber(phoneNumber: string): Promise<ClinicContext | null> {
    try {
      // ✅ IMPLEMENTAÇÃO FUTURA: Buscar do banco de dados
      // Por enquanto, retorna null para forçar uso do ClinicContextManager
      console.log(`🔍 [ContextualizacaoService] Buscando clínica para WhatsApp: ${phoneNumber}`);
      console.log(`⚠️ [ContextualizacaoService] Use ClinicContextManager.getClinicByWhatsApp() em vez deste serviço`);
      
      return null;
    } catch (error) {
      console.error('❌ [ContextualizacaoService] Erro ao obter clínica por WhatsApp:', error);
      return null;
    }
  }

  /**
   * ✅ SISTEMA MULTICLÍNICA: Gera prompt do sistema baseado no contexto da clínica
   */
  static generateSystemPromptFromContext(context: ClinicContext): string {
    if (!context || !context.assistant) {
      return 'Você é um assistente virtual profissional e prestativo.';
    }

    return `
Você é o ${context.assistant.name}, assistente virtual da ${context.name}.

${context.assistant.personality}

CAPACIDADES:
${context.assistant.capabilities?.map(cap => `- ${cap}`).join('\n') || '- Assistência geral'}

LIMITAÇÕES:
${context.assistant.limitations?.map(lim => `- ${lim}`).join('\n') || '- Não posso dar conselhos médicos'}

Seja sempre profissional, acolhedor e útil.`;
  }

  /**
   * ✅ SISTEMA MULTICLÍNICA: Obtém horários de funcionamento
   */
  static async getWorkingHours(clinicId: string): Promise<any> {
    try {
      // ✅ IMPLEMENTAÇÃO FUTURA: Buscar do banco de dados
      console.log(`🔍 [ContextualizacaoService] Buscando horários para: ${clinicId}`);
      return null;
    } catch (error) {
      console.error('❌ [ContextualizacaoService] Erro ao obter horários:', error);
      return null;
    }
  }

  /**
   * ✅ SISTEMA MULTICLÍNICA: Obtém profissionais da clínica
   */
  static async getProfessionals(clinicId: string): Promise<any[]> {
    try {
      // ✅ IMPLEMENTAÇÃO FUTURA: Buscar do banco de dados
      console.log(`🔍 [ContextualizacaoService] Buscando profissionais para: ${clinicId}`);
      return [];
    } catch (error) {
      console.error('❌ [ContextualizacaoService] Erro ao obter profissionais:', error);
      return [];
    }
  }

  /**
   * ✅ SISTEMA MULTICLÍNICA: Obtém serviços da clínica
   */
  static async getServices(clinicId: string): Promise<string[]> {
    try {
      // ✅ IMPLEMENTAÇÃO FUTURA: Buscar do banco de dados
      console.log(`🔍 [ContextualizacaoService] Buscando serviços para: ${clinicId}`);
      return [];
    } catch (error) {
      console.error('❌ [ContextualizacaoService] Erro ao obter serviços:', error);
      return [];
    }
  }
} 