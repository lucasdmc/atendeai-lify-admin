// src/services/ai/llmOrchestratorService.js
// Versão JavaScript para compatibilidade com Node.js

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class LLMOrchestratorService {
  static async processMessage(request) {
    try {
      console.log('🤖 LLMOrchestrator processing:', request);

      const { phoneNumber, message, conversationId, userId } = request;

      // Sistema de memória simples
      const memory = await this.loadConversationMemory(phoneNumber);
      
      // Extrair nome do usuário se presente na mensagem
      const extractedName = this.extractUserName(message);
      if (extractedName && !memory.userProfile?.name) {
        memory.userProfile = memory.userProfile || {};
        memory.userProfile.name = extractedName;
        console.log(`👤 Nome extraído e salvo: ${extractedName}`);
        
        // Salvar nome na tabela conversation_memory
        await this.saveUserName(phoneNumber, extractedName);
      }
      
      // Detectar intenção básica
      const intent = await this.detectIntent(message);
      
      // Buscar contexto da clínica (contextualização dinâmica)
      const clinicContext = await this.getClinicContext(phoneNumber);
      
      // Preparar prompt do sistema com perfil do usuário
      const systemPrompt = this.prepareSystemPrompt(clinicContext, memory.userProfile);
      
      // Construir mensagens para o LLM
      const messages = this.buildMessages(systemPrompt, memory, message);
      
      // Chamar OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';

      // Salvar na memória
      await this.saveConversationMemory(phoneNumber, message, response, intent);

      return {
        response: response,
        intent: intent,
        toolsUsed: [],
        metadata: {
          confidence: intent.confidence,
          modelUsed: 'gpt-4o',
          memoryUsed: true,
          userProfile: memory.userProfile || { name: 'Usuário' },
          conversationContext: { lastIntent: intent.name }
        }
      };

    } catch (error) {
      console.error('❌ LLMOrchestrator error:', error);
      return {
        response: 'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em alguns instantes.',
        intent: {
          name: 'ERROR',
          confidence: 0,
          entities: {},
          requiresAction: false,
          category: 'support'
        },
        toolsUsed: [],
        metadata: {
          confidence: 0,
          modelUsed: 'fallback',
          error: error.message
        }
      };
    }
  }

  /**
   * Extrai nome do usuário da mensagem
   */
  static extractUserName(message) {
    const namePatterns = [
      /me chamo ([^,\.!?]+)/i,
      /meu nome é ([^,\.!?]+)/i,
      /sou o ([^,\.!?]+)/i,
      /sou a ([^,\.!?]+)/i,
      /eu sou ([^,\.!?]+)/i,
      /chamo-me ([^,\.!?]+)/i
    ];

    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match) {
        const name = match[1].trim();
        // Verificar se o nome não é muito longo (provavelmente pegou texto extra)
        if (name.length <= 50 && !name.includes('tudo bem') && !name.includes('qual')) {
          return name;
        }
      }
    }

    return null;
  }

  /**
   * Salva o nome do usuário na tabela conversation_memory
   */
  static async saveUserName(phoneNumber, name) {
    try {
      const { error } = await supabase
        .from('conversation_memory')
        .upsert({
          phone_number: phoneNumber,
          user_name: JSON.stringify({
            name: name,
            extracted_at: new Date().toISOString()
          }),
          last_interaction: new Date().toISOString()
        }, { onConflict: 'phone_number' });

      if (error) {
        console.error('❌ Erro ao salvar nome:', error);
      } else {
        console.log(`✅ Nome salvo para ${phoneNumber}: ${name}`);
      }
    } catch (error) {
      console.error('❌ Erro crítico ao salvar nome:', error);
    }
  }

  static async loadConversationMemory(phoneNumber) {
    try {
      console.log('🔍 Carregando memória para:', phoneNumber);
      
      const { data } = await supabase
        .from('conversation_memory')
        .select('memory_data, user_name')
        .eq('phone_number', phoneNumber)
        .single();

      console.log('✅ Memória carregada:', data ? 'encontrada' : 'não encontrada');
      
      let userProfile = {};
      
      // Extrair nome do usuário (lidar com string JSON)
      if (data?.user_name) {
        try {
          // Se user_name é uma string JSON, fazer parse
          if (typeof data.user_name === 'string') {
            // Verificar se é JSON válido
            if (data.user_name.startsWith('{') && data.user_name.endsWith('}')) {
              const parsedUserName = JSON.parse(data.user_name);
              userProfile.name = parsedUserName.name;
            } else {
              // Se não é JSON, usar como nome direto
              userProfile.name = data.user_name;
            }
          } else if (data.user_name.name) {
            // Se já é um objeto
            userProfile.name = data.user_name.name;
          }
        } catch (error) {
          console.error('Error parsing user_name:', error);
          // Se falhar o parse, usar como string direta
          userProfile.name = data.user_name;
        }
      }
      
      if (data?.memory_data) {
        console.log('  - Histórico:', data.memory_data.history?.length || 0, 'mensagens');
        console.log('  - UserProfile:', userProfile.name || 'sem nome');
        
        // Mesclar com dados existentes da memória
        if (data.memory_data.userProfile) {
          userProfile = { ...data.memory_data.userProfile, ...userProfile };
        }
      }

      return {
        ...data?.memory_data,
        userProfile: userProfile
      } || { history: [], userProfile: userProfile };
    } catch (error) {
      console.log('❌ Erro ao carregar memória para:', phoneNumber, error.message);
      return { history: [], userProfile: {} };
    }
  }

  static async saveConversationMemory(phoneNumber, userMessage, botResponse, intent) {
    try {
      const { data: existingMemory } = await supabase
        .from('conversation_memory')
        .select('memory_data')
        .eq('phone_number', phoneNumber)
        .single();

      const memoryData = existingMemory?.memory_data || { history: [], userProfile: {} };
      
      // Garantir que history existe
      if (!memoryData.history) {
        memoryData.history = [];
      }
      
      // Adicionar nova interação
      memoryData.history.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      });
      
      memoryData.history.push({
        role: 'assistant',
        content: botResponse,
        timestamp: new Date().toISOString()
      });

      // Manter apenas últimas 10 interações
      if (memoryData.history.length > 10) {
        memoryData.history = memoryData.history.slice(-10);
      }

      // Upsert na tabela
      await supabase
        .from('conversation_memory')
        .upsert({
          phone_number: phoneNumber,
          memory_data: memoryData,
          last_interaction: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error saving memory:', error);
    }
  }

  static async detectIntent(message) {
    try {
      const prompt = `Analise a mensagem e classifique a intenção principal.

Mensagem: "${message}"

Classifique em uma das seguintes categorias:
- GREETING: Saudações, olá, bom dia, etc.
- APPOINTMENT: Agendamento, consulta, marcação, etc.
- INFORMATION: Informações sobre serviços, horários, localização, etc.
- SUPPORT: Ajuda, suporte, problemas, etc.
- GOODBYE: Despedidas, tchau, até logo, etc.

Responda apenas com o nome da categoria.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 50,
      });

      const intentName = completion.choices[0]?.message?.content?.trim() || 'GREETING';

      return {
        name: intentName,
        confidence: 0.8,
        entities: {},
        requiresAction: false,
        category: this.getCategoryFromIntent(intentName)
      };

    } catch (error) {
      console.error('Error detecting intent:', error);
      return {
        name: 'GREETING',
        confidence: 0.5,
        entities: {},
        requiresAction: false,
        category: 'general'
      };
    }
  }

  static getCategoryFromIntent(intentName) {
    const categories = {
      'GREETING': 'general',
      'APPOINTMENT': 'appointment',
      'INFORMATION': 'information',
      'SUPPORT': 'support',
      'GOODBYE': 'general'
    };
    return categories[intentName] || 'general';
  }

  static async getClinicContext(phoneNumber = null) {
    try {
      console.log(`🏥 [LLMOrchestrator] Buscando contextualização para: ${phoneNumber || 'sem telefone'}`);
      
      let data;
      
      if (phoneNumber) {
        // ✅ BUSCA DINÂMICA - Buscar clínica específica pelo telefone
        console.log(`🔍 [LLMOrchestrator] Buscando clínica por WhatsApp: ${phoneNumber}`);
        
        const { data: clinicData, error } = await supabase
          .from('clinics')
          .select('*')
          .eq('whatsapp_phone', phoneNumber)
          .single();

        if (error) {
          console.log(`⚠️ [LLMOrchestrator] Clínica não encontrada para WhatsApp: ${phoneNumber}`);
          // Fallback para busca genérica
          const { data: fallbackData } = await supabase
            .from('clinics')
            .select('*')
            .eq('has_contextualization', true)
            .single();
          data = fallbackData;
        } else {
          data = clinicData;
        }
      } else {
        // Fallback para busca genérica (compatibilidade)
        console.log('⚠️ [LLMOrchestrator] Sem telefone fornecido, usando busca genérica');
        const { data: fallbackData } = await supabase
          .from('clinics')
          .select('*')
          .eq('has_contextualization', true)
          .single();
        data = fallbackData;
      }

      if (!data || !data.contextualization_json) {
        console.log('⚠️ [LLMOrchestrator] Clínica sem contextualização JSON');
        return {
          name: data?.name || 'Clínica Médica',
          address: '',
          phone: '',
          services: []
        };
      }

      const context = data.contextualization_json;
      console.log('📋 [LLMOrchestrator] Contextualização encontrada:', Object.keys(context));

      // Extrair informações básicas da clínica
      const clinica = context.clinica || {};
      const localizacao = clinica.localizacao || {};
      const contatos = clinica.contatos || {};
      const servicos = context.servicos || {};
      const profissionais = context.profissionais || [];

      // Construir endereço completo
      let enderecoCompleto = '';
      if (localizacao.endereco_principal) {
        const end = localizacao.endereco_principal;
        enderecoCompleto = `${end.logradouro || ''}, ${end.numero || ''}${end.complemento ? ` - ${end.complemento}` : ''}, ${end.bairro || ''}, ${end.cidade || ''} - ${end.estado || ''}, CEP: ${end.cep || ''}`.trim();
      }

      // Extrair telefone principal
      const telefone = contatos.telefone_principal || contatos.whatsapp || '';

      // Extrair serviços
      const servicosList = [];
      if (servicos.consultas) {
        servicosList.push(...servicos.consultas.map(s => s.nome));
      }
      if (servicos.exames) {
        servicosList.push(...servicos.exames.map(s => s.nome));
      }

      // Extrair profissionais
      const profissionaisList = profissionais.map(p => p.nome_completo);

      console.log('✅ [LLMOrchestrator] Dados extraídos:', {
        nome: clinica.informacoes_basicas?.nome || data.name,
        endereco: enderecoCompleto,
        telefone: telefone,
        servicos: servicosList.length,
        profissionais: profissionaisList.length,
        whatsapp_phone: data.whatsapp_phone
      });

      return {
        name: clinica.informacoes_basicas?.nome || data.name || 'Clínica Médica',
        address: enderecoCompleto,
        phone: telefone,
        services: servicosList,
        professionals: profissionaisList,
        specialties: clinica.informacoes_basicas?.especialidades_secundarias || [],
        description: clinica.informacoes_basicas?.descricao || '',
        mission: clinica.informacoes_basicas?.missao || '',
        values: clinica.informacoes_basicas?.valores || [],
        differentiators: clinica.informacoes_basicas?.diferenciais || [],
        workingHours: clinica.horario_funcionamento || {},
        paymentMethods: context.formas_pagamento || {},
        insurance: context.convenios || [],
        insuranceDetails: context.convenios || [],
        emails: contatos.emails_departamentos || {},
        website: contatos.website || '',
        mainEmail: contatos.email_principal || '',
        bookingPolicies: context.politicas?.agendamento || {},
        servicePolicies: context.politicas?.atendimento || {},
        additionalInfo: context.informacoes_adicionais || {},
        professionalsDetails: context.profissionais || [],
        servicesDetails: context.servicos || {},
        agentConfig: context.agente_ia?.configuracao || {},
        agentBehavior: context.agente_ia?.comportamento || {},
        agentRestrictions: context.agente_ia?.restricoes || {}
      };
    } catch (error) {
      console.error('❌ [LLMOrchestrator] Erro ao obter contexto da clínica:', error);
      return {
        name: 'Clínica Médica',
        address: '',
        phone: '',
        services: []
      };
    }
  }

  static prepareSystemPrompt(clinicContext, userProfile = null) {
    // Configurações do agente IA do JSON
    const agentConfig = clinicContext.agentConfig || {};
    const agentBehavior = clinicContext.agentBehavior || {};
    const agentRestrictions = clinicContext.agentRestrictions || {};
    
    // Nome do agente (padrão ou do JSON)
    const agentName = agentConfig.nome || 'Assistente Virtual';
    
    // Personalidade do agente (padrão ou do JSON)
    const agentPersonality = agentConfig.personalidade || 'profissional, empática e prestativa';
    
    // Tom de comunicação (padrão ou do JSON)
    const communicationTone = agentConfig.tom_comunicacao || 'Formal mas acessível';
    
    // Nível de formalidade (padrão ou do JSON)
    const formalityLevel = agentConfig.nivel_formalidade || 'Médio';
    
    // Saudação inicial (padrão ou do JSON)
    const initialGreeting = agentConfig.saudacao_inicial || `Olá! Sou o ${agentName}, assistente virtual da ${clinicContext.name}. Como posso ajudá-lo hoje?`;
    
    // Mensagem de despedida (padrão ou do JSON)
    const farewellMessage = agentConfig.mensagem_despedida || 'Obrigado por escolher nossa clínica. Até breve!';
    
    // Mensagem fora do horário (padrão ou do JSON)
    const outOfHoursMessage = agentConfig.mensagem_fora_horario || 'No momento estamos fora do horário de atendimento. Retornaremos seu contato no próximo horário comercial.';
    
    // Restrições específicas
    const restrictions = [];
    if (agentRestrictions.nao_pode_diagnosticar) {
      restrictions.push('NUNCA faça diagnósticos médicos');
    }
    if (agentRestrictions.nao_pode_prescrever) {
      restrictions.push('NUNCA prescreva medicamentos');
    }
    
    // Emergências cardíacas (se configuradas)
    const cardiacEmergencies = agentRestrictions.emergencias_cardiacas || [];
    
    let prompt = `Você é ${agentName}, assistente virtual da ${clinicContext.name}.
Sua personalidade é: ${agentPersonality}
Tom de comunicação: ${communicationTone}
Nível de formalidade: ${formalityLevel}

DIRETRIZES FUNDAMENTAIS:
1. Use EXCLUSIVAMENTE as informações fornecidas no contexto da clínica
2. Seja sempre cordial, profissional e empático
3. Para agendamentos, oriente o usuário sobre o processo
4. Se não souber uma informação, diga educadamente que não possui essa informação
5. ${restrictions.length > 0 ? restrictions.join(', ') : 'NUNCA invente informações ou dê conselhos médicos'}
6. Mantenha respostas concisas e objetivas (máximo 3 parágrafos)
7. Use o nome do usuário quando disponível para personalizar a conversa
8. Se o usuário perguntar sobre seu nome, responda com: "${agentName}"

\nINFORMAÇÕES COMPLETAS DA CLÍNICA:
- Nome: ${clinicContext.name}
- Endereço: ${clinicContext.address || 'Não informado'}
- Telefone: ${clinicContext.phone || 'Não informado'}`;

    // Adicionar email principal se disponível
    if (clinicContext.mainEmail) {
      prompt += `\n- Email: ${clinicContext.mainEmail}`;
    }

    // Adicionar website se disponível
    if (clinicContext.website) {
      prompt += `\n- Website: ${clinicContext.website}`;
    }

    // Adicionar descrição se disponível
    if (clinicContext.description) {
      prompt += `\n- Descrição: ${clinicContext.description}`;
    }

    // Adicionar missão se disponível
    if (clinicContext.mission) {
      prompt += `\n- Missão: ${clinicContext.mission}`;
    }

    // Adicionar valores se disponível
    if (clinicContext.values && clinicContext.values.length > 0) {
      prompt += `\n- Valores: ${clinicContext.values.join(', ')}`;
    }

    // Adicionar diferenciais se disponível
    if (clinicContext.differentiators && clinicContext.differentiators.length > 0) {
      prompt += `\n- Diferenciais: ${clinicContext.differentiators.join(', ')}`;
    }

    // Adicionar especialidades se disponível
    if (clinicContext.specialties && clinicContext.specialties.length > 0) {
      prompt += `\n- Especialidades: ${clinicContext.specialties.join(', ')}`;
    }

    // Adicionar serviços se disponível
    if (clinicContext.services && clinicContext.services.length > 0) {
      prompt += `\n- Serviços oferecidos: ${clinicContext.services.join(', ')}`;
    }

    // Adicionar profissionais se disponível
    if (clinicContext.professionals && clinicContext.professionals.length > 0) {
      prompt += `\n- Profissionais: ${clinicContext.professionals.join(', ')}`;
    }

    // Adicionar convênios se disponível
    if (clinicContext.insurance && clinicContext.insurance.length > 0) {
      const convenios = clinicContext.insurance.map(c => c.nome).join(', ');
      prompt += `\n- Convênios aceitos: ${convenios}`;
    }

    // Adicionar formas de pagamento se disponível
    if (clinicContext.paymentMethods) {
      const formas = [];
      if (clinicContext.paymentMethods.dinheiro) formas.push('Dinheiro');
      if (clinicContext.paymentMethods.cartao_credito) formas.push('Cartão de Crédito');
      if (clinicContext.paymentMethods.cartao_debito) formas.push('Cartão de Débito');
      if (clinicContext.paymentMethods.pix) formas.push('PIX');
      
      if (formas.length > 0) {
        prompt += `\n- Formas de pagamento: ${formas.join(', ')}`;
      }

      // Adicionar informações de parcelamento
      if (clinicContext.paymentMethods.parcelamento && clinicContext.paymentMethods.parcelamento.disponivel) {
        prompt += `\n- Parcelamento: Disponível em até ${clinicContext.paymentMethods.parcelamento.max_parcelas} parcelas`;
      }

      // Adicionar informações de desconto
      if (clinicContext.paymentMethods.desconto_a_vista && clinicContext.paymentMethods.desconto_a_vista.disponivel) {
        prompt += `\n- Desconto à vista: ${clinicContext.paymentMethods.desconto_a_vista.percentual}%`;
      }
    }

    // Adicionar horário de funcionamento se disponível
    if (clinicContext.workingHours && Object.keys(clinicContext.workingHours).length > 0) {
      prompt += `\n- Horário de funcionamento:`;
      const dias = {
        'segunda': 'Segunda-feira',
        'terca': 'Terça-feira', 
        'quarta': 'Quarta-feira',
        'quinta': 'Quinta-feira',
        'sexta': 'Sexta-feira',
        'sabado': 'Sábado',
        'domingo': 'Domingo'
      };
      
      Object.entries(clinicContext.workingHours).forEach(([dia, horario]) => {
        if (horario && horario.abertura && horario.fechamento) {
          prompt += `\n  • ${dias[dia]}: ${horario.abertura} às ${horario.fechamento}`;
        } else if (horario) {
          prompt += `\n  • ${dias[dia]}: Fechado`;
        }
      });
    }

    // Adicionar emails específicos por departamento se disponível
    if (clinicContext.emails && Object.keys(clinicContext.emails).length > 0) {
      prompt += `\n- Emails por departamento:`;
      Object.entries(clinicContext.emails).forEach(([dept, email]) => {
        prompt += `\n  • ${dept}: ${email}`;
      });
    }

    // Adicionar políticas de agendamento se disponível
    if (clinicContext.bookingPolicies) {
      prompt += `\n- Políticas de agendamento:`;
      if (clinicContext.bookingPolicies.antecedencia_minima_horas) {
        prompt += `\n  • Antecedência mínima: ${clinicContext.bookingPolicies.antecedencia_minima_horas}h`;
      }
      if (clinicContext.bookingPolicies.antecedencia_maxima_dias) {
        prompt += `\n  • Antecedência máxima: ${clinicContext.bookingPolicies.antecedencia_maxima_dias} dias`;
      }
      if (clinicContext.bookingPolicies.reagendamento_permitido !== undefined) {
        prompt += `\n  • Reagendamento: ${clinicContext.bookingPolicies.reagendamento_permitido ? 'Permitido' : 'Não permitido'}`;
      }
      if (clinicContext.bookingPolicies.cancelamento_antecedencia_horas) {
        prompt += `\n  • Cancelamento: ${clinicContext.bookingPolicies.cancelamento_antecedencia_horas}h de antecedência`;
      }
    }

    // Adicionar políticas de atendimento se disponível
    if (clinicContext.servicePolicies) {
      prompt += `\n- Políticas de atendimento:`;
      if (clinicContext.servicePolicies.tolerancia_atraso_minutos) {
        prompt += `\n  • Tolerância atraso: ${clinicContext.servicePolicies.tolerancia_atraso_minutos} min`;
      }
      if (clinicContext.servicePolicies.acompanhante_permitido !== undefined) {
        prompt += `\n  • Acompanhante: ${clinicContext.servicePolicies.acompanhante_permitido ? 'Permitido' : 'Não permitido'}`;
      }
      if (clinicContext.servicePolicies.documentos_obrigatorios && clinicContext.servicePolicies.documentos_obrigatorios.length > 0) {
        prompt += `\n  • Documentos obrigatórios: ${clinicContext.servicePolicies.documentos_obrigatorios.join(', ')}`;
      }
    }

    // Adicionar informações adicionais se disponível
    if (clinicContext.additionalInfo && clinicContext.additionalInfo.parcerias && clinicContext.additionalInfo.parcerias.length > 0) {
      prompt += `\n- Parcerias:`;
      clinicContext.additionalInfo.parcerias.forEach(parceria => {
        prompt += `\n  • ${parceria.nome} (${parceria.tipo}): ${parceria.descricao}`;
      });
    }

    // Adicionar emergências cardíacas se configuradas
    if (cardiacEmergencies && cardiacEmergencies.length > 0) {
      prompt += `\n\nEMERGÊNCIAS CARDÍACAS - ORIENTAÇÕES:`;
      cardiacEmergencies.forEach(emergencia => {
        prompt += `\n• ${emergencia}`;
      });
    }

    // Adicionar informações detalhadas dos profissionais se disponível
    if (clinicContext.professionalsDetails && clinicContext.professionalsDetails.length > 0) {
      prompt += `\n- Detalhes dos profissionais:`;
      clinicContext.professionalsDetails.forEach(prof => {
        prompt += `\n  • ${prof.nome_completo} (${prof.crm}): ${prof.especialidades?.join(', ')} - ${prof.experiencia}`;
        if (prof.horarios_disponibilidade) {
          const horarios = Object.entries(prof.horarios_disponibilidade)
            .filter(([dia, horarios]) => horarios && horarios.length > 0)
            .map(([dia, horarios]) => `${dia}: ${horarios.map(h => `${h.inicio}-${h.fim}`).join(', ')}`)
            .join('; ');
          if (horarios) {
            prompt += `\n    Horários: ${horarios}`;
          }
        }
      });
    }

    // Adicionar informações detalhadas dos serviços se disponível
    if (clinicContext.servicesDetails) {
      if (clinicContext.servicesDetails.consultas && clinicContext.servicesDetails.consultas.length > 0) {
        prompt += `\n- Detalhes das consultas:`;
        clinicContext.servicesDetails.consultas.forEach(consulta => {
          // Formatar preço para aceitar ambos os formatos
          const precoFormatado = consulta.preco_particular ? 
            (consulta.preco_particular % 1 === 0 ? 
              `R$ ${consulta.preco_particular},00` : 
              `R$ ${consulta.preco_particular.toFixed(2).replace('.', ',')}`) : 
            'Preço sob consulta';
          
          prompt += `\n  • ${consulta.nome}: ${consulta.descricao} - ${consulta.duracao_minutos}min - ${precoFormatado}`;
          if (consulta.convenios_aceitos && consulta.convenios_aceitos.length > 0) {
            prompt += ` (Convênios: ${consulta.convenios_aceitos.join(', ')})`;
          }
        });
      }

      if (clinicContext.servicesDetails.exames && clinicContext.servicesDetails.exames.length > 0) {
        prompt += `\n- Detalhes dos exames:`;
        clinicContext.servicesDetails.exames.forEach(exame => {
          // Formatar preço para aceitar ambos os formatos
          const precoFormatado = exame.preco_particular ? 
            (exame.preco_particular % 1 === 0 ? 
              `R$ ${exame.preco_particular},00` : 
              `R$ ${exame.preco_particular.toFixed(2).replace('.', ',')}`) : 
            'Preço sob consulta';
          
          prompt += `\n  • ${exame.nome}: ${exame.descricao} - ${exame.duracao_minutos}min - ${precoFormatado}`;
          if (exame.preparacao) {
            prompt += `\n    Preparação: ${exame.preparacao.instrucoes_especiais}`;
          }
          if (exame.resultado_prazo_dias) {
            prompt += `\n    Resultado: ${exame.resultado_prazo_dias} dia(s)`;
          }
        });
      }
    }

    // Adicionar informações detalhadas dos convênios se disponível
    if (clinicContext.insuranceDetails && clinicContext.insuranceDetails.length > 0) {
      prompt += `\n- Detalhes dos convênios:`;
      clinicContext.insuranceDetails.forEach(conv => {
        prompt += `\n  • ${conv.nome}: ${conv.copagamento ? `Copagamento R$ ${conv.valor_copagamento}` : 'Sem copagamento'}`;
        if (conv.autorizacao_necessaria) {
          prompt += ` (Autorização necessária)`;
        }
      });
    }

    if (userProfile && userProfile.name) {
      prompt += `\n\nINFORMAÇÕES DO USUÁRIO:
- Nome: ${userProfile.name}`;
    }

    return prompt;
  }

  static buildMessages(systemPrompt, memory, userMessage) {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    console.log('🧠 Construindo mensagens com memória...');
    console.log('  - Histórico disponível:', memory.history?.length || 0, 'mensagens');

    // Adicionar histórico relevante
    if (memory.history && memory.history.length > 0) {
      const recentHistory = memory.history.slice(-6);
      console.log('  - Usando últimas:', recentHistory.length, 'mensagens');
      
      recentHistory.forEach((h, index) => {
        if (h.role && h.content) {
          messages.push({ role: h.role, content: h.content });
          console.log(`    ${index + 1}. ${h.role}: ${h.content.substring(0, 30)}...`);
        }
      });
    }

    // Adicionar mensagem atual
    messages.push({ role: 'user', content: userMessage });
    console.log('  - Mensagem atual: user:', userMessage.substring(0, 30) + '...');
    console.log('  - Total de mensagens:', messages.length);

    return messages;
  }
} 