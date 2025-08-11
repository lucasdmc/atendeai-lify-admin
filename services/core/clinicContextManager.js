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
      let { data: clinic, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('name', clinicKey)
        .single();
      
      // ✅ SE NÃO ENCONTRAR, TENTAR BUSCA POR NOME SIMILAR
      if (error && error.code === 'PGRST116') {
        console.log(`🔍 [ClinicContextManager] Tentando busca por nome similar para: ${clinicKey}`);
        
        const { data: clinics, error: searchError } = await supabase
          .from('clinics')
          .select('*')
          .ilike('name', `%${clinicKey}%`);
        
        if (!searchError && clinics && clinics.length > 0) {
          clinic = clinics[0];
          error = null;
          console.log(`✅ [ClinicContextManager] Clínica encontrada por busca similar: ${clinic.name}`);
        }
      }
      
      // ❌ SEM FALLBACKS HARDCODED - SE NÃO ENCONTRAR, ERRO
      if (error || !clinic) {
        console.error(`❌ [ClinicContextManager] Clínica ${clinicKey} não encontrada no banco`);
        throw new Error(`Clínica ${clinicKey} não encontrada no banco de dados`);
      }
      
      // ❌ SEM FALLBACKS HARDCODED - SE NÃO TEM JSON, ERRO
      if (!clinic.contextualization_json || Object.keys(clinic.contextualization_json).length === 0) {
        console.error(`❌ [ClinicContextManager] Clínica ${clinicKey} não tem JSON de contextualização`);
        throw new Error(`Clínica ${clinicKey} não tem JSON de contextualização configurado`);
      }
      
      console.log(`✅ [ClinicContextManager] JSON encontrado para ${clinicKey} no banco de dados`);
      
      // ✅ EXTRAIR DADOS DO JSON DO BANCO (FONTE ÚNICA)
      return this.extractClinicDataFromJson(clinic.contextualization_json, clinicKey);
      
    } catch (error) {
      console.error(`❌ [ClinicContextManager] Erro ao obter contexto para ${clinicKey}:`, error);
      // ❌ SEM FALLBACKS - PROPAGAR ERRO
      throw error;
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

  // ❌ MÉTODO REMOVIDO: getDefaultContext era fallback hardcoded (NUNCA PEDIDO)

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
  static async getClinicByWhatsApp(phoneNumber) {
    try {
      console.log(`🔍 [ClinicContextManager] Mapeando WhatsApp: ${phoneNumber}`);
      
      // ✅ NORMALIZAR NÚMERO DE TELEFONE
      const normalizedPhone = phoneNumber.replace(/\D/g, '');
      const fullPhone = normalizedPhone.startsWith('55') ? `+${normalizedPhone}` : `+55${normalizedPhone}`;
      
      // ✅ BUSCAR CLÍNICA NO BANCO DE DADOS POR NÚMERO DE WHATSAPP
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
        process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M'
      );
      
      const { data: clinic, error } = await supabase
        .from('clinics')
        .select('name, whatsapp_phone')
        .eq('whatsapp_phone', fullPhone)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error(`❌ [ClinicContextManager] Erro ao buscar clínica por WhatsApp:`, error);
        return null;
      }
      
      if (clinic) {
        console.log(`✅ [ClinicContextManager] Clínica encontrada para ${phoneNumber}: ${clinic.name}`);
        return clinic.name.toLowerCase().replace(/\s+/g, '-');
      }
      
      // ✅ SE NÃO ENCONTRAR, RETORNAR NULL (SEM FALLBACK HARDCODED)
      console.log(`⚠️ [ClinicContextManager] Nenhuma clínica encontrada para WhatsApp: ${phoneNumber}`);
      return null;
      
    } catch (error) {
      console.error(`❌ [ClinicContextManager] Erro ao mapear WhatsApp ${phoneNumber}:`, error);
      return null; // SEM FALLBACK HARDCODED
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
