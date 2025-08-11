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
      console.log('🏥 [ClinicContextManager] Inicializando...');
      console.log('📄 [ClinicContextManager] SISTEMA CONFIGURADO PARA USAR APENAS JSON DA TELA DE CLÍNICAS');
      
      // ✅ FONTE ÚNICA: JSON inserido na tela de clínicas (banco de dados)
      // ❌ NÃO USAR: Arquivos estáticos
      // ❌ NÃO USAR: Diretórios de configuração
      
      console.log('📄 [ClinicContextManager] JSONs serão carregados dinamicamente do banco de dados');
      console.log('📄 [ClinicContextManager] quando necessário através de getClinicContext()');
      
      // ✅ INICIALIZAÇÃO COMPLETA: Sistema pronto para carregar JSONs dinamicamente
      console.log('✅ [ClinicContextManager] Sistema inicializado para JSON dinâmico da tela de clínicas');
      
    } catch (error) {
      console.error('❌ [ClinicContextManager] Erro na inicialização:', error);
    }
  }

  /**
   * Obtém contexto de uma clínica específica
   */
  static async getClinicContext(clinicKey) {
    try {
      console.log(`🔍 [ClinicContextManager] Buscando contexto para: ${clinicKey}`);
      
      // ✅ FONTE ÚNICA: Buscar JSON do banco de dados (tela de clínicas)
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
        process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M'
      );
      
      // ✅ BUSCAR CLÍNICA NO BANCO DE DADOS
      // 🔧 CORREÇÃO: Buscar por nome exato ou por chave similar
      let { data: clinic, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('name', clinicKey)
        .single();
      
      // 🔧 CORREÇÃO: Se não encontrar, tentar buscar por nome similar
      if (error && error.code === 'PGRST116') {
        console.log(`🔍 [ClinicContextManager] Tentando busca por nome similar para: ${clinicKey}`);
        
        const { data: clinics, error: searchError } = await supabase
          .from('clinics')
          .select('*')
          .ilike('name', `%${clinicKey}%`);
        
        if (!searchError && clinics && clinics.length > 0) {
          clinic = clinics[0]; // Usar a primeira clínica encontrada
          error = null;
          console.log(`✅ [ClinicContextManager] Clínica encontrada por busca similar: ${clinic.name}`);
        }
      }
      
      if (error) {
        console.error(`❌ [ClinicContextManager] Erro ao buscar clínica ${clinicKey}:`, error);
        return this.getDefaultContext(clinicKey);
      }
      
      if (!clinic) {
        console.log(`⚠️ [ClinicContextManager] Clínica ${clinicKey} não encontrada no banco`);
        return this.getDefaultContext(clinicKey);
      }
      
      // ✅ VERIFICAR SE TEM JSON DE CONTEXTUALIZAÇÃO
      if (!clinic.contextualization_json || Object.keys(clinic.contextualization_json).length === 0) {
        console.log(`⚠️ [ClinicContextManager] Clínica ${clinicKey} não tem JSON de contextualização`);
        return this.getDefaultContext(clinicKey);
      }
      
      console.log(`✅ [ClinicContextManager] JSON encontrado para ${clinicKey} no banco de dados`);
      
      // ✅ EXTRAIR DADOS DO JSON DO BANCO
      return this.extractClinicDataFromJson(clinic.contextualization_json, clinicKey);
      
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
      const agente = jsonContext.agente_ia || {}; // 🔧 CORREÇÃO: agente_ia em vez de agente
      
      console.log(`🔍 [ClinicContextManager] Extraindo dados para ${clinicKey}:`);
      console.log(`   - Tem clinica: ${!!clinica}`);
      console.log(`   - Tem agente_ia: ${!!agente}`);
      console.log(`   - Tem configuracao: ${!!agente.configuracao}`);
      
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
          rua: clinica.localizacao?.endereco_principal?.logradouro || '',
          numero: clinica.localizacao?.endereco_principal?.numero || '',
          complemento: clinica.localizacao?.endereco_principal?.complemento || '',
          bairro: clinica.localizacao?.endereco_principal?.bairro || '',
          cidade: clinica.localizacao?.endereco_principal?.cidade || '',
          estado: clinica.localizacao?.endereco_principal?.estado || '',
          cep: clinica.localizacao?.endereco_principal?.cep || ''
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
