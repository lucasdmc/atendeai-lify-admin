// services/core/clinicContextManager.js
// Gerenciador de Contexto de Clínicas - ÚNICA FONTE: JSONs da tela de clínicas

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';

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
      
      // ✅ SISTEMA MULTICLÍNICAS: Sem arquivos locais hardcoded
      console.log('📄 [ClinicContextManager] Sistema configurado para JSONs dinâmicos do banco de dados');
      
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
      const supabase = config.getSupabaseClient();
      
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
      
      // ✅ SE NÃO ENCONTRAR, TENTAR BUSCA POR NOME EXATO (case insensitive)
      if (error && error.code === 'PGRST116') {
        console.log(`🔍 [ClinicContextManager] Tentando busca case insensitive para: ${clinicKey}`);
        
        const { data: clinics, error: searchError } = await supabase
          .from('clinics')
          .select('*')
          .ilike('name', clinicKey);
        
        if (!searchError && clinics && clinics.length > 0) {
          clinic = clinics[0];
          error = null;
          console.log(`✅ [ClinicContextManager] Clínica encontrada por busca case insensitive: ${clinic.name}`);
        }
      }
      
      // ✅ DEBUG: Mostrar todas as clínicas disponíveis
      if (error) {
        console.log(`🔍 [ClinicContextManager] Buscando todas as clínicas para debug...`);
        const { data: allClinics, error: allError } = await supabase
          .from('clinics')
          .select('name, id, has_contextualization, contextualization_json');
        
        if (!allError && allClinics) {
          console.log(`🔍 [ClinicContextManager] Clínicas disponíveis:`, allClinics.map(c => ({
            name: c.name, id: c.id, has_contextualization: c.has_contextualization
          })));
        }
      }
      
      // ✅ SISTEMA MULTICLÍNICAS: Sem fallbacks hardcoded
      if (error || !clinic) {
        console.error(`❌ [ClinicContextManager] Clínica ${clinicKey} não encontrada no banco de dados`);
        throw new Error(`Clínica ${clinicKey} não encontrada no banco de dados. Configure a clínica na tela de clínicas.`);
      }
      
      // ✅ DEBUG: Mostrar dados da clínica encontrada
      console.log(`🔍 [ClinicContextManager] Clínica encontrada:`, {
        name: clinic.name,
        id: clinic.id,
        hasContextualization: clinic.has_contextualization,
        hasJson: !!clinic.contextualization_json,
        jsonKeys: clinic.contextualization_json ? Object.keys(clinic.contextualization_json) : 'null',
        jsonSize: clinic.contextualization_json ? JSON.stringify(clinic.contextualization_json).length : 0
      });
      
      // ❌ SEM FALLBACKS HARDCODED - SE NÃO TEM JSON, ERRO
      if (!clinic.contextualization_json || Object.keys(clinic.contextualization_json).length === 0) {
        console.error(`❌ [ClinicContextManager] Clínica ${clinicKey} não tem JSON de contextualização`);
        console.error(`❌ [ClinicContextManager] Dados da clínica:`, {
          name: clinic.name,
          id: clinic.id,
          hasContextualization: clinic.has_contextualization,
          contextualizationJson: clinic.contextualization_json
        });
        throw new Error(`Clínica ${clinicKey} não tem JSON de contextualização configurado`);
      }
      
      console.log(`✅ [ClinicContextManager] JSON encontrado para ${clinicKey} no banco de dados`);
      console.log(`✅ [ClinicContextManager] Estrutura do JSON:`, Object.keys(clinic.contextualization_json));
      
      // ✅ EXTRAIR DADOS DO JSON DO BANCO (FONTE ÚNICA)
      const extractedData = this.extractClinicDataFromJson(clinic.contextualization_json, clinicKey);
      
      console.log(`✅ [ClinicContextManager] Dados extraídos para ${clinicKey}:`, {
        hasBasicInfo: !!extractedData.basicInfo,
        hasServices: !!extractedData.services && extractedData.services.length > 0,
        hasProfessionals: !!extractedData.professionals && extractedData.professionals.length > 0,
        hasWorkingHours: !!extractedData.workingHours && Object.keys(extractedData.workingHours).length > 0,
        hasAgentConfig: !!extractedData.agentConfig,
        servicesCount: extractedData.services?.length || 0,
        professionalsCount: extractedData.professionals?.length || 0
      });
      
      return extractedData;
      
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
      const agente = jsonContext.agente_ia || {};
      
      console.log(`🔍 [ClinicContextManager] Extraindo dados para ${clinicKey}:`);
      console.log(`   - Tem clinica: ${!!clinica}`);
      console.log(`   - Tem agente_ia: ${!!agente}`);
      console.log(`   - Tem configuracao: ${!!agente.configuracao}`);
      
      // ✅ SCHEMA DINÂMICO COMPLETO - Extrair TODA informação do JSON
      const localizacao = clinica.localizacao || {};
      const contatos = clinica.contatos || {};
      const servicos = jsonContext.servicos || {};
      const profissionais = jsonContext.profissionais || [];
      
      // ✅ Construir endereço completo
      let enderecoCompleto = '';
      if (localizacao.endereco_principal) {
        const end = localizacao.endereco_principal;
        enderecoCompleto = `${end.logradouro || ''}, ${end.numero || ''}${end.complemento ? ` - ${end.complemento}` : ''}, ${end.bairro || ''}, ${end.cidade || ''} - ${end.estado || ''}, CEP: ${end.cep || ''}`.trim();
      }
      
      // ✅ Extrair telefone principal
      const telefone = contatos.telefone_principal || contatos.whatsapp || '';
      
      // ✅ Extrair serviços COMPLETOS
      const servicosList = [];
      if (servicos.consultas) {
        servicosList.push(...servicos.consultas.map(s => s.nome));
      }
      if (servicos.exames) {
        servicosList.push(...servicos.exames.map(s => s.nome));
      }
      if (servicos.procedimentos) {
        servicosList.push(...servicos.procedimentos.map(s => s.nome));
      }
      
      // ✅ Extrair profissionais COMPLETOS
      const profissionaisList = profissionais.map(p => p.nome_completo || p.nome_exibicao || p.nome);
      
      console.log('✅ [ClinicContextManager] Dados extraídos:', {
        nome: clinica.informacoes_basicas?.nome || clinicKey,
        endereco: enderecoCompleto,
        telefone: telefone,
        servicos: servicosList.length,
        profissionais: profissionaisList.length
      });
      
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
          descricao: clinica.informacoes_basicas?.descricao || '',
          missao: clinica.informacoes_basicas?.missao || '',
          valores: clinica.informacoes_basicas?.valores || [],
          diferenciais: clinica.informacoes_basicas?.diferenciais || []
        },
        
        // ✅ ENDEREÇO DO JSON
        address: {
          rua: localizacao.endereco_principal?.logradouro || '',
          numero: localizacao.endereco_principal?.numero || '',
          complemento: localizacao.endereco_principal?.complemento || '',
          bairro: localizacao.endereco_principal?.bairro || '',
          cidade: localizacao.endereco_principal?.cidade || '',
          estado: localizacao.endereco_principal?.estado || '',
          cep: localizacao.endereco_principal?.cep || '',
          completo: enderecoCompleto
        },
        
        // ✅ CONTATOS DO JSON
        contacts: {
          telefone: telefone,
          whatsapp: contatos.whatsapp || '',
          email: contatos.email_principal || '',
          website: contatos.website || '',
          emails: contatos.emails_departamentos || {}
        },
        
        // ✅ HORÁRIOS DO JSON
        workingHours: clinica.horario_funcionamento || {},
        
        // ✅ PROFISSIONAIS DO JSON - SCHEMA COMPLETO
        professionals: profissionaisList,
        professionalsDetails: jsonContext.profissionais || [],
        
        // ✅ SERVIÇOS DO JSON - SCHEMA COMPLETO
        services: servicosList,
        servicesDetails: jsonContext.servicos || {},
        
        // ✅ CONFIGURAÇÕES DO AGENTE IA
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
        
        // ✅ DADOS ADICIONAIS COMPLETOS
        specialties: clinica.informacoes_basicas?.especialidades_secundarias || [],
        paymentMethods: jsonContext.formas_pagamento || {},
        insurance: jsonContext.convenios || [],
        insuranceDetails: jsonContext.convenios || [],
        bookingPolicies: jsonContext.politicas?.agendamento || {},
        servicePolicies: jsonContext.politicas?.atendimento || {},
        additionalInfo: jsonContext.informacoes_adicionais || {},
        structure: jsonContext.estrutura_fisica || {},
        metadata: jsonContext.metadados || {},
        
        // ✅ CONFIGURAÇÃO GOOGLE CALENDAR (OBRIGATÓRIA)
        googleCalendar: {
          enabled: true, // SEMPRE habilitado para clínicas com JSON
          calendarId: 'primary', // Calendário principal
          timezone: 'America/Sao_Paulo',
          appointmentRules: {
            minimumAdvanceHours: jsonContext.politicas?.agendamento?.antecedencia_minima_horas || 24,
            maximumAdvanceDays: jsonContext.politicas?.agendamento?.antecedencia_maxima_dias || 90,
            slotDuration: 30, // minutos padrão
            maxSlotsPerDay: 4 // máximo 4 slots por dia conforme solicitado
          }
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
      
      console.log(`🔍 [ClinicContextManager] Número normalizado: ${fullPhone}`);
      
      // ✅ BUSCAR CLÍNICA NO BANCO DE DADOS POR NÚMERO DE WHATSAPP
      const supabase = config.getSupabaseClient();
      
      // ✅ BUSCAR TODAS AS CLÍNICAS PARA DEBUG
      const { data: allClinics, error: allClinicsError } = await supabase
        .from('clinics')
        .select('name, whatsapp_phone, id');
      
      if (allClinicsError) {
        console.error(`❌ [ClinicContextManager] Erro ao buscar todas as clínicas:`, allClinicsError);
      } else {
        console.log(`🔍 [ClinicContextManager] Clínicas disponíveis:`, allClinics.map(c => ({
          name: c.name,
          whatsapp: c.whatsapp_phone,
          id: c.id
        })));
      }
      
      // ✅ BUSCAR CLÍNICA ESPECÍFICA
      const { data: clinic, error } = await supabase
        .from('clinics')
        .select('name, whatsapp_phone, id')
        .eq('whatsapp_phone', fullPhone)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error(`❌ [ClinicContextManager] Erro ao buscar clínica por WhatsApp:`, error);
        return null;
      }
      
      if (clinic) {
        console.log(`✅ [ClinicContextManager] Clínica encontrada para ${phoneNumber}: ${clinic.name} (ID: ${clinic.id})`);
        return clinic.name;
      } else {
              // ✅ SEM FALLBACKS HARDCODED - Sistema multiclínicas
      console.log(`⚠️ [ClinicContextManager] Número ${phoneNumber} não mapeado para nenhuma clínica no banco`);
      return null;
      }
      
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
