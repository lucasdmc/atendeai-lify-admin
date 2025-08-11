// services/core/clinicContextManager.js
// Gerenciador de Contexto de Clínicas - ÚNICA FONTE: JSONs da tela de clínicas

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ CORREÇÃO: __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class ClinicContextManager {
  // ✅ CACHE EM MEMÓRIA: JSONs carregados na inicialização
  static jsonContexts = new Map();

  /**
   * Inicializa o gerenciador de contexto
   */
  static async initialize() {
    try {
      console.log('🏥 [ClinicContextManager] Inicializando...');
      
      // ✅ CARREGAR APENAS JSONs da tela de clínicas
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
   * Obtém contexto de uma clínica específica
   */
  static getClinicContext(clinicKey) {
    try {
      // ✅ BUSCAR APENAS NO CACHE DE JSONs
      const jsonContext = this.jsonContexts.get(clinicKey);
      
      if (jsonContext) {
        console.log(`✅ [ClinicContextManager] Contexto encontrado para: ${clinicKey}`);
        return this.extractClinicDataFromJson(jsonContext, clinicKey);
      }
      
      // ✅ FALLBACK: Contexto padrão se não encontrar JSON
      console.log(`⚠️ [ClinicContextManager] JSON não encontrado para: ${clinicKey}, usando contexto padrão`);
      return this.getDefaultContext(clinicKey);
      
    } catch (error) {
      console.error(`❌ [ClinicContextManager] Erro ao obter contexto para ${clinicKey}:`, error);
      return this.getDefaultContext(clinicKey);
    }
  }

  /**
   * Extrai dados estruturados do JSON da clínica
   */
  static extractClinicDataFromJson(jsonContext, clinicKey) {
    try {
      const clinica = jsonContext.clinica || {};
      const agente = jsonContext.agente || {};
      
      return {
        // ✅ IDENTIFICAÇÃO
        id: clinicKey,
        key: clinicKey,
        name: clinica.informacoes_basicas?.nome || clinicKey,
        
        // ✅ INFORMAÇÕES BÁSICAS DO JSON
        basicInfo: {
          nome: clinica.informacoes_basicas?.nome || clinicKey,
          tipo: clinica.informacoes_basicas?.tipo || 'Clínica',
          especialidade: clinica.informacoes_basicas?.especialidade || 'Geral',
          descricao: clinica.informacoes_basicas?.descricao || ''
        },
        
        // ✅ ENDEREÇO DO JSON
        address: {
          rua: clinica.endereco?.rua || '',
          numero: clinica.endereco?.numero || '',
          complemento: clinica.endereco?.complemento || '',
          bairro: clinica.endereco?.bairro || '',
          cidade: clinica.endereco?.cidade || '',
          estado: clinica.endereco?.estado || '',
          cep: clinica.endereco?.cep || ''
        },
        
        // ✅ CONTATOS DO JSON
        contacts: {
          telefone: clinica.contatos?.telefone_principal || '',
          whatsapp: clinica.contatos?.whatsapp || '',
          email: clinica.contatos?.email_principal || '',
          website: clinica.contatos?.website || ''
        },
        
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
    } catch (error) {
      console.error(`❌ [ClinicContextManager] Erro ao extrair dados do JSON para ${clinicKey}:`, error);
      return this.getDefaultContext(clinicKey);
    }
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
   * 🔧 NOVA FUNÇÃO: Identifica clínica baseado no número do WhatsApp
   * Esta função mapeia números de WhatsApp para clínicas
   */
  static getClinicByWhatsApp(phoneNumber) {
    try {
      // ✅ MAPEAMENTO DIRETO: Números de WhatsApp para chaves de clínica
      const whatsappMapping = {
        '+554730915628': 'cardioprime',  // CardioPrime
        '+554730915629': 'esadi',        // ESADI
        // ✅ ADICIONAR NOVOS NÚMEROS AQUI CONFORME NECESSÁRIO
      };

      // ✅ NORMALIZAR NÚMERO (remover espaços, traços, etc.)
      const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
      
      // ✅ BUSCAR MAPEAMENTO
      const clinicKey = whatsappMapping[normalizedPhone];
      
      if (clinicKey) {
        console.log(`🔍 [ClinicContextManager] Clínica identificada: ${phoneNumber} → ${clinicKey}`);
        return clinicKey;
      }

      // ✅ FALLBACK: Tentar encontrar por padrão
      for (const [mappedPhone, key] of Object.entries(whatsappMapping)) {
        if (normalizedPhone.includes(mappedPhone.replace(/[\s\-\(\)]/g, '')) || 
            mappedPhone.includes(normalizedPhone)) {
          console.log(`🔍 [ClinicContextManager] Clínica encontrada por padrão: ${phoneNumber} → ${key}`);
          return key;
        }
      }

      // ✅ FALLBACK FINAL: Usar clínica padrão se não encontrar
      console.log(`⚠️ [ClinicContextManager] Clínica não encontrada para ${phoneNumber}, usando padrão: cardioprime`);
      return 'cardioprime';
      
    } catch (error) {
      console.error(`❌ [ClinicContextManager] Erro ao identificar clínica por WhatsApp:`, error);
      return 'cardioprime'; // Fallback seguro
    }
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
