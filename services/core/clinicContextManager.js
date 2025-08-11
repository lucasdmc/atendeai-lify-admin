// services/core/clinicContextManager.js
// Gerenciador de Contexto de Clínicas - ÚNICA FONTE: JSONs da tela de clínicas

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class ClinicContextManager {
  // Cache de contextualizações JSON
  static jsonContexts = new Map();
  
  /**
   * Inicializa o gerenciador carregando todos os JSONs
   */
  static async initialize() {
    try {
      console.log('🏥 [ClinicContextManager] Inicializando...');
      
      // ✅ APENAS: Carregar todos os JSONs de contextualização
      await this.loadAllJsonContexts();
      
      console.log('✅ [ClinicContextManager] Inicializado com sucesso');
    } catch (error) {
      console.error('❌ [ClinicContextManager] Erro na inicialização:', error);
    }
  }
  
  /**
   * Carrega todos os JSONs de contextualização
   */
  static async loadAllJsonContexts() {
    try {
      // ✅ ÚNICA FONTE: Arquivos da pasta data (JSONs da tela de clínicas)
      const dataDir = path.join(__dirname, '../../data');
      const files = fs.readdirSync(dataDir);
      
      for (const file of files) {
        if (file.startsWith('contextualizacao-') && file.endsWith('.json')) {
          const clinicKey = file.replace('contextualizacao-', '').replace('.json', '');
          const filePath = path.join(dataDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const context = JSON.parse(content);
          
          // ✅ MAPEAMENTO DIRETO: Chave do arquivo
          this.jsonContexts.set(clinicKey, context);
          console.log(`📄 [ClinicContextManager] JSON da tela de clínicas carregado: ${clinicKey}`);
        }
      }
      
      console.log(`✅ [ClinicContextManager] Total de JSONs carregados: ${this.jsonContexts.size}`);
      
    } catch (error) {
      console.error('❌ [ClinicContextManager] Erro ao carregar JSONs da tela de clínicas:', error);
    }
  }
  
  /**
   * Obtém contexto de uma clínica por chave (ex: 'cardioprime', 'esadi')
   */
  static getClinicContext(clinicKey) {
    try {
      console.log(`🔍 [ClinicContextManager] Buscando contexto para: ${clinicKey}`);
      
      const context = this.jsonContexts.get(clinicKey);
      
      if (!context) {
        console.log(`⚠️ [ClinicContextManager] JSON não encontrado para: ${clinicKey}`);
        return this.getDefaultContext(clinicKey);
      }
      
      // ✅ RETORNAR APENAS OS DADOS DO JSON
      const clinicContext = this.extractClinicDataFromJson(context, clinicKey);
      
      console.log(`✅ [ClinicContextManager] Contexto obtido para: ${clinicKey}`);
      return clinicContext;
      
    } catch (error) {
      console.error('❌ [ClinicContextManager] Erro ao obter contexto:', error);
      return this.getDefaultContext(clinicKey);
    }
  }
  
  /**
   * Extrai dados da clínica APENAS do JSON
   */
  static extractClinicDataFromJson(jsonContext, clinicKey) {
    const clinica = jsonContext.clinica || {};
    const agente = jsonContext.agente_ia || {};
    
    return {
      // ✅ IDENTIFICAÇÃO
      id: clinicKey,
      key: clinicKey,
      
      // ✅ INFORMAÇÕES BÁSICAS DO JSON
      name: clinica.informacoes_basicas?.nome || clinicKey,
      description: clinica.informacoes_basicas?.descricao || '',
      mission: clinica.informacoes_basicas?.missao || '',
      values: clinica.informacoes_basicas?.valores || [],
      differentiators: clinica.informacoes_basicas?.diferenciais || [],
      specialties: clinica.informacoes_basicas?.especialidades_secundarias || [],
      
      // ✅ LOCALIZAÇÃO DO JSON
      address: clinica.localizacao?.endereco_principal ? 
        `${clinica.localizacao.endereco_principal.logradouro}, ${clinica.localizacao.endereco_principal.numero} - ${clinica.localizacao.endereco_principal.bairro}, ${clinica.localizacao.endereco_principal.cidade}/${clinica.localizacao.endereco_principal.estado}` : '',
      
      // ✅ CONTATOS DO JSON
      phone: clinica.contatos?.telefone_principal || '',
      whatsapp: clinica.contatos?.whatsapp || '',
      email: clinica.contatos?.email_principal || '',
      website: clinica.contatos?.website || '',
      
      // ✅ HORÁRIOS DO JSON
      workingHours: clinica.horario_funcionamento || {},
      
      // ✅ PROFISSIONAIS DO JSON
      professionals: clinica.profissionais || [],
      
      // ✅ SERVIÇOS DO JSON
      services: clinica.servicos || [],
      
      // ✅ CONFIGURAÇÕES DO AGENTE IA (PRIORIDADE ALTA)
      agentConfig: {
        nome: agente.configuracao?.nome || 'Assistente Virtual',
        personalidade: agente.configuracao?.personalidade || 'Profissional e prestativo',
        tom_comunicacao: agente.configuracao?.tom_comunicacao || 'Formal mas acessível',
        nivel_formalidade: agente.configuracao?.nivel_formalidade || 'Médio',
        saudacao_inicial: agente.configuracao?.saudacao_inicial || `Olá! Sou o assistente virtual da ${clinica.informacoes_basicas?.nome || clinicKey}. Como posso ajudá-lo hoje?`,
        mensagem_despedida: agente.configuracao?.mensagem_despedida || 'Obrigado por escolher nossa clínica. Até breve!',
        mensagem_fora_horario: agente.configuracao?.mensagem_fora_horario || 'No momento estamos fora do horário de atendimento. Retornaremos seu contato no próximo horário comercial.'
      },
      
      agentBehavior: agente.comportamento || {
        proativo: true,
        oferece_sugestoes: true,
        solicita_feedback: true,
        escalacao_automatica: true,
        limite_tentativas: 3,
        contexto_conversa: true
      },
      
      agentRestrictions: agente.restricoes || {
        nao_pode_diagnosticar: true,
        nao_pode_prescrever: true,
        emergencias_cardiacas: []
      },
      
      // ✅ METADADOS
      hasJsonContext: true,
      source: 'JSON_FILE',
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Contexto padrão quando não há JSON
   */
  static getDefaultContext(clinicKey) {
    return {
      id: clinicKey,
      key: clinicKey,
      name: clinicKey,
      agentConfig: {
        nome: 'Assistente Virtual',
        personalidade: 'Profissional e prestativo',
        tom_comunicacao: 'Formal mas acessível',
        nivel_formalidade: 'Médio',
        saudacao_inicial: `Olá! Sou o assistente virtual da ${clinicKey}. Como posso ajudá-lo hoje?`,
        mensagem_despedida: 'Obrigado pelo contato. Até breve!',
        mensagem_fora_horario: 'Estamos fora do horário de atendimento. Retornaremos seu contato no próximo horário comercial.'
      },
      hasJsonContext: false,
      source: 'DEFAULT',
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Lista todas as clínicas disponíveis (APENAS dos JSONs)
   */
  static getAllClinics() {
    return Array.from(this.jsonContexts.keys()).map(key => ({
      key: key,
      name: this.jsonContexts.get(key)?.clinica?.informacoes_basicas?.nome || key
    }));
  }
  
  /**
   * Verifica se uma clínica tem contextualização JSON
   */
  static hasJsonContext(clinicKey) {
    return this.jsonContexts.has(clinicKey);
  }
  
  /**
   * Obtém estatísticas de uso
   */
  static getStats() {
    return {
      totalJsonContexts: this.jsonContexts.size,
      totalClinics: this.jsonContexts.size,
      availableClinics: Array.from(this.jsonContexts.keys()),
      cacheSize: this.jsonContexts.size
    };
  }
}

export { ClinicContextManager };
