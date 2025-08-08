// ========================================
// APPOINTMENT CONVERSATION SERVICE (JavaScript)
// Versão compatível com Node.js para webhook
// ========================================

import { AppointmentService } from './appointmentService.js';
import fs from 'fs';
import path from 'path';

export class AppointmentConversationService {
  static conversationStates = new Map();
  static clinicData = null;

  /**
   * Carrega dados da clínica do banco de dados (prioridade) ou arquivo JSON (fallback)
   */
  static async loadClinicData(clinicId = 'cardioprime') {
    if (this.clinicData) return this.clinicData;
    
    try {
      console.log(`[AppointmentConversationService] Carregando dados para clinicId: ${clinicId}`);
      
      // PRIMEIRO: Tentar buscar do banco de dados (mais confiável em produção)
      try {
        console.log(`[AppointmentConversationService] Tentando importar Supabase...`);
        const { createClient } = await import('@supabase/supabase-js');
        
        console.log(`[AppointmentConversationService] Criando cliente Supabase...`);
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        console.log(`[AppointmentConversationService] Buscando dados do banco para clinicId: ${clinicId}`);
        const { data: clinicFromDB, error: dbError } = await supabase
          .from('clinics')
          .select('contextualization_json, name, whatsapp_phone')
          .eq('id', clinicId)
          .single();
        
        if (!dbError && clinicFromDB?.contextualization_json) {
          console.log('✅ [AppointmentConversationService] Dados carregados do banco de dados');
          this.clinicData = clinicFromDB.contextualization_json;
          return this.clinicData;
        } else {
          console.log('⚠️ [AppointmentConversationService] Dados não encontrados no banco:', dbError?.message);
          
          // Tentar buscar clínica genérica se a específica não for encontrada
          console.log('🔍 [AppointmentConversationService] Tentando buscar clínica genérica...');
          const { data: genericClinic, error: genericError } = await supabase
            .from('clinics')
            .select('contextualization_json, name, whatsapp_phone')
            .eq('has_contextualization', true)
            .single();
          
          if (!genericError && genericClinic?.contextualization_json) {
            console.log('✅ [AppointmentConversationService] Dados carregados de clínica genérica');
            this.clinicData = genericClinic.contextualization_json;
            return this.clinicData;
          } else {
            console.log('❌ [AppointmentConversationService] Nenhuma clínica com contextualização encontrada no banco');
          }
        }
      } catch (dbImportError) {
        console.log('⚠️ [AppointmentConversationService] Erro ao importar Supabase:', dbImportError.message);
        console.log('📋 Tentando carregar do arquivo como fallback...');
      }
      
      // SEGUNDO: Tentar carregar do arquivo (fallback apenas se não conseguir do banco)
      console.log(`[AppointmentConversationService] Tentando carregar do arquivo...`);
      
      // Mapear UUIDs de clínicas para nomes de arquivos
      const clinicIdMapping = {
        '4a73f615-b636-4134-8937-c20b5db5acac': 'cardioprime',
        '9b11dfd6-d638-48e3-bc84-f3880f987da2': 'esadi',
        'cardioprime': 'cardioprime',
        'esadi': 'esadi',
        'cardioprime_blumenau_2024': 'cardioprime'
      };
      
      // Usar o mapeamento ou o clinicId original
      const fileId = clinicIdMapping[clinicId] || clinicId;
      
      console.log(`[AppointmentConversationService] Mapeando clinicId ${clinicId} para arquivo: ${fileId}`);
      
      // Tentar múltiplos caminhos possíveis (usando apenas process.cwd())
      const possiblePaths = [
        path.join(process.cwd(), 'src', 'data', `contextualizacao-${fileId}.json`),
        path.join(process.cwd(), 'atendeai-lify-admin', 'src', 'data', `contextualizacao-${fileId}.json`),
        path.join(process.cwd(), 'dist', 'src', 'data', `contextualizacao-${fileId}.json`),
        path.join(process.cwd(), 'build', 'src', 'data', `contextualizacao-${fileId}.json`),
        path.join(process.cwd(), 'public', 'data', `contextualizacao-${fileId}.json`),
        path.join(process.cwd(), 'data', `contextualizacao-${fileId}.json`),
        // Caminhos adicionais para produção
        path.join(process.cwd(), '..', 'src', 'data', `contextualizacao-${fileId}.json`),
        path.join(process.cwd(), '..', 'atendeai-lify-admin', 'src', 'data', `contextualizacao-${fileId}.json`),
        path.join(process.cwd(), '..', '..', 'src', 'data', `contextualizacao-${fileId}.json`),
        path.join(process.cwd(), '..', '..', 'atendeai-lify-admin', 'src', 'data', `contextualizacao-${fileId}.json`)
      ];
      
      let rawData = null;
      let usedPath = null;
      
      for (const dataPath of possiblePaths) {
        try {
          console.log(`[AppointmentConversationService] Tentando carregar dados de: ${dataPath}`);
          rawData = fs.readFileSync(dataPath, 'utf8');
          usedPath = dataPath;
          break;
        } catch (pathError) {
          console.log(`[AppointmentConversationService] Caminho não encontrado: ${dataPath}`);
          continue;
        }
      }
      
      if (rawData) {
        console.log(`[AppointmentConversationService] Dados carregados com sucesso de: ${usedPath}`);
        this.clinicData = JSON.parse(rawData);
        return this.clinicData;
      }
      
      // TERCEIRO: Se chegou até aqui, usar dados básicos hardcoded
      console.log('📋 [AppointmentConversationService] Usando dados básicos da clínica...');
      
      // Criar dados básicos da clínica para funcionar
      this.clinicData = {
        clinica: {
          informacoes_basicas: {
            nome: 'CardioPrime',
            especialidades_secundarias: [
              'Cardiologia Clínica',
              'Cardiologia Intervencionista',
              'Eletrofisiologia',
              'Ecocardiografia',
              'Teste Ergométrico',
              'Holter 24h'
            ]
          },
          horario_funcionamento: {
            segunda: { abertura: '08:00', fechamento: '18:00' },
            terca: { abertura: '08:00', fechamento: '18:00' },
            quarta: { abertura: '08:00', fechamento: '18:00' },
            quinta: { abertura: '08:00', fechamento: '18:00' },
            sexta: { abertura: '08:00', fechamento: '17:00' },
            sabado: { abertura: '08:00', fechamento: '12:00' },
            domingo: { abertura: null, fechamento: null }
          }
        },
        profissionais: [
          {
            id: 'prof_001',
            nome_completo: 'Dr. Roberto Silva',
            nome_exibicao: 'Dr. Roberto',
            especialidades: ['Cardiologia Clínica', 'Ecocardiografia'],
            ativo: true,
            aceita_novos_pacientes: true,
            horarios_disponibilidade: {
              segunda: [{ inicio: '08:00', fim: '12:00' }],
              terca: [{ inicio: '14:00', fim: '18:00' }],
              quarta: [{ inicio: '08:00', fim: '12:00' }],
              quinta: [{ inicio: '14:00', fim: '18:00' }],
              sexta: [{ inicio: '08:00', fim: '12:00' }]
            }
          }
        ]
      };
      
      console.log('✅ [AppointmentConversationService] Dados básicos da clínica criados');
      return this.clinicData;
      
    } catch (error) {
      console.error('💥 [AppointmentConversationService] Erro ao carregar dados da clínica:', error);
      
      // Último fallback: dados mínimos
      console.log('🆘 [AppointmentConversationService] Usando dados mínimos de emergência...');
      
      this.clinicData = {
        clinica: {
          informacoes_basicas: {
            nome: 'Clínica',
            especialidades_secundarias: ['Consulta Médica']
          },
          horario_funcionamento: {
            segunda: { abertura: '08:00', fechamento: '18:00' },
            terca: { abertura: '08:00', fechamento: '18:00' },
            quarta: { abertura: '08:00', fechamento: '18:00' },
            quinta: { abertura: '08:00', fechamento: '18:00' },
            sexta: { abertura: '08:00', fechamento: '18:00' },
            sabado: { abertura: '08:00', fechamento: '12:00' },
            domingo: { abertura: null, fechamento: null }
          }
        },
        profissionais: [
          {
            id: 'prof_001',
            nome_completo: 'Dr. Médico',
            nome_exibicao: 'Dr. Médico',
            especialidades: ['Consulta Médica'],
            ativo: true,
            aceita_novos_pacientes: true,
            horarios_disponibilidade: {
              segunda: [{ inicio: '08:00', fim: '18:00' }],
              terca: [{ inicio: '08:00', fim: '18:00' }],
              quarta: [{ inicio: '08:00', fim: '18:00' }],
              quinta: [{ inicio: '08:00', fim: '18:00' }],
              sexta: [{ inicio: '08:00', fim: '18:00' }]
            }
          }
        ]
      };
      
      return this.clinicData;
    }
  }

  /**
   * Processa mensagem do usuário no contexto de agendamento
   */
  static async processMessage(message, patientPhone, clinicId) {
    try {
      console.log('📅 [AppointmentConversationService] Processando mensagem de agendamento:', {
        message,
        patientPhone,
        clinicId
      });

      // Carregar dados da clínica (já tem fallbacks robustos)
      let clinicData = await this.loadClinicData(clinicId);
      
      // Garantir que temos dados da clínica (loadClinicData já tem fallbacks)
      if (!clinicData) {
        console.error('💥 [AppointmentConversationService] Falha crítica: não foi possível carregar dados da clínica');
        return this.createResponse(
          'Desculpe, não foi possível carregar as informações da clínica. Tente novamente mais tarde.',
          'initial',
          { step: 'initial', collectedData: {}, patientPhone, clinicId }
        );
      }

      // Obter ou criar estado da conversa
      let state = this.conversationStates.get(patientPhone);
      
      if (!state) {
        state = {
          step: 'initial',
          collectedData: {},
          patientPhone,
          clinicId,
          clinicData
        };
        this.conversationStates.set(patientPhone, state);
      }

      console.log('📊 [AppointmentConversationService] Estado atual:', state.step);

      // Processar baseado no passo atual
      switch (state.step) {
        case 'initial':
          return await this.handleInitialStep(message, state);
        
        case 'collecting_name':
          return await this.handleNameCollection(message, state);
        
        case 'collecting_phone':
          return await this.handlePhoneCollection(message, state);
        
        case 'collecting_specialty':
          return await this.handleSpecialtyCollection(message, state);
        
        case 'collecting_date':
          return await this.handleDateCollection(message, state);
        
        case 'selecting_time':
          return await this.handleTimeSelection(message, state);
        
        case 'selecting_doctor':
          return await this.handleDoctorSelection(message, state);
        
        case 'confirming':
          return await this.handleConfirmationStep(message, state);
        
        default:
          return this.createResponse(
            'Desculpe, ocorreu um erro. Vamos começar novamente.',
            'initial',
            state
          );
      }
    } catch (error) {
      console.error('💥 [AppointmentConversationService] Erro ao processar mensagem de agendamento:', error);
      return this.createResponse(
        'Desculpe, ocorreu um erro. Por favor, tente novamente.',
        'initial',
        { step: 'initial', collectedData: {}, patientPhone, clinicId }
      );
    }
  }

  /**
   * Processa passo inicial - reconhecimento de intenção
   */
  static async handleInitialStep(message, state) {
    console.log('🔍 [AppointmentConversationService] Verificando intenção de agendamento...');
    
    // Verificar se é realmente uma intenção de agendamento
    const intent = await AppointmentService.recognizeAppointmentIntent(message);
    
    if (!intent || intent.intent !== 'APPOINTMENT_CREATE') {
      return this.createResponse(
        'Desculpe, não entendi. Você gostaria de agendar uma consulta?',
        'initial',
        state
      );
    }

    // Iniciar coleta de dados
    state.step = 'collecting_name';
    state.collectedData = {
      patientPhone: state.patientPhone,
      serviceType: intent.entities?.serviceType || 'consulta'
    };

    return this.createResponse(
      'Perfeito! Vou ajudá-lo a agendar sua consulta. Primeiro, preciso de algumas informações:\n\n' +
      '📝 Qual é o seu nome completo?',
      'collecting_name',
      state,
      true
    );
  }

  /**
   * Processa coleta do nome
   */
  static async handleNameCollection(message, state) {
    const name = message.trim();
    if (name.length < 2) {
      return this.createResponse(
        'Por favor, informe seu nome completo:',
        'collecting_name',
        state,
        true
      );
    }

    state.collectedData.patientName = name;
    state.step = 'collecting_phone';

    return this.createResponse(
      'Ótimo! Agora preciso do seu telefone para contato:\n\n' +
      '📞 Seu telefone (se diferente deste WhatsApp):',
      'collecting_phone',
      state,
      true
    );
  }

  /**
   * Processa coleta do telefone
   */
  static async handlePhoneCollection(message, state) {
    let phone = message.trim();
    
    // Se o usuário não informou telefone, usar o do WhatsApp
    if (!phone || phone === 'mesmo' || phone === 'igual') {
      phone = state.patientPhone;
    }

    state.collectedData.contactPhone = phone;
    state.step = 'collecting_specialty';

    // Mostrar especialidades disponíveis
    const specialties = state.clinicData.clinica.informacoes_basicas.especialidades_secundarias;
    const specialtyList = specialties.map((spec, index) => `${index + 1}. ${spec}`).join('\n');

    return this.createResponse(
      'Perfeito! Agora me diga qual especialidade você precisa:\n\n' +
      `${specialtyList}\n\n` +
      'Digite o número da especialidade ou o nome:',
      'collecting_specialty',
      state,
      true
    );
  }

  /**
   * Processa coleta da especialidade
   */
  static async handleSpecialtyCollection(message, state) {
    const specialty = message.trim();
    state.collectedData.specialty = specialty;
    state.step = 'collecting_date';

    return this.createResponse(
      'Excelente! Agora preciso saber para quando você gostaria de agendar:\n\n' +
      '📅 Para qual data você prefere?\n' +
      '• Hoje\n' +
      '• Amanhã\n' +
      '• Próxima semana\n' +
      '• Outra data (especifique DD/MM/AAAA)',
      'collecting_date',
      state,
      true
    );
  }

  /**
   * Processa coleta da data
   */
  static async handleDateCollection(message, state) {
    const dateInput = message.trim().toLowerCase();
    let targetDate;

    // Processar diferentes formatos de data
    if (dateInput === 'hoje') {
      targetDate = new Date();
    } else if (dateInput === 'amanhã' || dateInput === 'amanha') {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (dateInput === 'próxima semana' || dateInput === 'proxima semana') {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 7);
    } else {
      // Tentar parsear data no formato DD/MM/AAAA
      const dateMatch = dateInput.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        targetDate = new Date(year, month - 1, day);
      } else {
        return this.createResponse(
          'Por favor, informe a data no formato DD/MM/AAAA ou escolha uma das opções:\n' +
          '• Hoje\n' +
          '• Amanhã\n' +
          '• Próxima semana',
          'collecting_date',
          state,
          true
        );
      }
    }

    // Validar se a data não é no passado
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      return this.createResponse(
        'Não é possível agendar para datas passadas. Por favor, escolha uma data futura:',
        'collecting_date',
        state,
        true
      );
    }

    // Validar horário de funcionamento da clínica
    const dayOfWeek = targetDate.getDay();
    const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const dayName = dayNames[dayOfWeek];
    const workingHours = state.clinicData.clinica.horario_funcionamento[dayName];

    if (!workingHours || !workingHours.abertura) {
      return this.createResponse(
        'Desculpe, a clínica não funciona aos domingos. Por favor, escolha outra data:',
        'collecting_date',
        state,
        true
      );
    }

    state.collectedData.targetDate = targetDate;
    state.collectedData.dayName = dayName;
    state.collectedData.workingHours = workingHours;
    state.step = 'selecting_time';

    // Buscar horários disponíveis no Google Calendar
    const availableSlots = await this.getAvailableTimeSlots(state);
    
    if (availableSlots.length === 0) {
      return this.createResponse(
        'Desculpe, não há horários disponíveis para esta data. Gostaria de escolher outra data?',
        'collecting_date',
        state,
        true
      );
    }

    // Mostrar horários disponíveis
    const timeSlots = availableSlots.slice(0, 4).map((slot, index) => 
      `${index + 1}. ${slot.startTime} - ${slot.endTime}`
    ).join('\n');

    state.collectedData.availableSlots = availableSlots;

    return this.createResponse(
      `Perfeito! Encontrei os seguintes horários disponíveis para ${dayName}:\n\n` +
      `${timeSlots}\n\n` +
      'Digite o número do horário que prefere:',
      'selecting_time',
      state,
      true
    );
  }

  /**
   * Processa seleção de horário
   */
  static async handleTimeSelection(message, state) {
    const choice = parseInt(message.trim());
    const availableSlots = state.collectedData.availableSlots;

    if (isNaN(choice) || choice < 1 || choice > availableSlots.length) {
      const timeSlots = availableSlots.slice(0, 4).map((slot, index) => 
        `${index + 1}. ${slot.startTime} - ${slot.endTime}`
      ).join('\n');

      return this.createResponse(
        `Por favor, escolha um número válido:\n\n` +
        `${timeSlots}\n\n` +
        'Digite o número do horário:',
        'selecting_time',
        state,
        true
      );
    }

    const selectedSlot = availableSlots[choice - 1];
    state.collectedData.selectedSlot = selectedSlot;
    state.step = 'selecting_doctor';

    // Mostrar médicos disponíveis
    const availableDoctors = this.getAvailableDoctors(state);
    const doctorList = availableDoctors.map((doctor, index) => 
      `${index + 1}. ${doctor.nome_exibicao} - ${doctor.especialidades.join(', ')}`
    ).join('\n');

    state.collectedData.availableDoctors = availableDoctors;

    return this.createResponse(
      'Excelente! Agora escolha o médico:\n\n' +
      `${doctorList}\n\n` +
      'Digite o número do médico:',
      'selecting_doctor',
      state,
      true
    );
  }

  /**
   * Processa seleção do médico
   */
  static async handleDoctorSelection(message, state) {
    const choice = parseInt(message.trim());
    const availableDoctors = state.collectedData.availableDoctors;

    if (isNaN(choice) || choice < 1 || choice > availableDoctors.length) {
      const doctorList = availableDoctors.map((doctor, index) => 
        `${index + 1}. ${doctor.nome_exibicao} - ${doctor.especialidades.join(', ')}`
      ).join('\n');

      return this.createResponse(
        `Por favor, escolha um número válido:\n\n` +
        `${doctorList}\n\n` +
        'Digite o número do médico:',
        'selecting_doctor',
        state,
        true
      );
    }

    const selectedDoctor = availableDoctors[choice - 1];
    state.collectedData.selectedDoctor = selectedDoctor;
    state.step = 'confirming';

    // Criar resumo do agendamento
    const appointmentSummary = this.createAppointmentSummary(state);

    return this.createResponse(
      `✅ Resumo do Agendamento:\n\n` +
      `${appointmentSummary}\n\n` +
      `Confirma este agendamento?\n` +
      `1️⃣ Sim, confirmar\n` +
      `2️⃣ Não, alterar dados`,
      'confirming',
      state,
      true,
      ['1', '2']
    );
  }

  /**
   * Processa confirmação do agendamento
   */
  static async handleConfirmationStep(message, state) {
    console.log('✅ [AppointmentConversationService] Processando confirmação...');
    
    const choice = message.trim();

    if (choice === '2') {
      // Voltar para coleta de dados
      state.step = 'collecting_name';
      return this.createResponse(
        'Vamos começar novamente. Qual é o seu nome completo?',
        'collecting_name',
        state,
        true
      );
    }

    if (choice !== '1') {
      return this.createResponse(
        'Por favor, escolha uma opção válida (1 ou 2):',
        'confirming',
        state,
        true,
        ['1', '2']
      );
    }

    // Criar agendamento
    try {
      console.log('📅 [AppointmentConversationService] Criando agendamento...');
      
      const appointmentData = {
        patientName: state.collectedData.patientName,
        patientPhone: state.collectedData.contactPhone,
        specialty: state.collectedData.specialty,
        date: state.collectedData.targetDate,
        startTime: state.collectedData.selectedSlot.startTime,
        endTime: state.collectedData.selectedSlot.endTime,
        doctor: state.collectedData.selectedDoctor,
        clinicId: state.clinicId
      };

      // Criar agendamento usando AppointmentService
      const result = await AppointmentService.createAppointment(appointmentData);

      // Limpar estado da conversa
      this.conversationStates.delete(state.patientPhone);

      const appointmentSummary = this.createAppointmentSummary(state);

      return this.createResponse(
        `✅ Agendamento confirmado com sucesso!\n\n` +
        `${appointmentSummary}\n\n` +
        `📱 Você receberá uma confirmação por WhatsApp.\n` +
        `📍 Lembre-se de chegar 15 minutos antes do horário.\n\n` +
        `Obrigado por escolher a ${state.clinicData.clinica.informacoes_basicas.nome}! 😊`,
        'completed',
        { step: 'completed', collectedData: {}, patientPhone: state.patientPhone }
      );

    } catch (error) {
      console.error('💥 [AppointmentConversationService] Erro ao criar agendamento:', error);
      return this.createResponse(
        'Desculpe, ocorreu um erro ao confirmar o agendamento. Tente novamente mais tarde.',
        'initial',
        state
      );
    }
  }

  /**
   * Busca horários disponíveis no Google Calendar
   */
  static async getAvailableTimeSlots(state) {
    try {
      // Por enquanto, simular horários disponíveis baseados no horário de funcionamento
      // Em produção, integrar com Google Calendar
      const workingHours = state.collectedData.workingHours;
      const dayName = state.collectedData.dayName;
      
      // Buscar médicos disponíveis para este dia
      const availableDoctors = this.getAvailableDoctors(state);
      
      if (availableDoctors.length === 0) {
        return [];
      }

      // Gerar slots de horário baseados no horário de funcionamento
      const slots = [];
      const startHour = parseInt(workingHours.abertura.split(':')[0]);
      const endHour = parseInt(workingHours.fechamento.split(':')[0]);
      
      for (let hour = startHour; hour < endHour; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        
        slots.push({
          startTime,
          endTime,
          available: true
        });
      }

      return slots;
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      return [];
    }
  }

  /**
   * Obtém médicos disponíveis para o dia selecionado
   */
  static getAvailableDoctors(state) {
    const dayName = state.collectedData.dayName;
    const specialty = state.collectedData.specialty;
    
    return state.clinicData.profissionais.filter(doctor => {
      // Verificar se o médico está ativo
      if (!doctor.ativo || !doctor.aceita_novos_pacientes) {
        return false;
      }
      
      // Verificar se trabalha no dia selecionado
      const daySchedule = doctor.horarios_disponibilidade[dayName];
      if (!daySchedule || daySchedule.length === 0) {
        return false;
      }
      
      // Verificar se tem a especialidade necessária
      if (specialty && !doctor.especialidades.some(esp => 
        esp.toLowerCase().includes(specialty.toLowerCase())
      )) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Cria resumo do agendamento
   */
  static createAppointmentSummary(state) {
    const data = state.collectedData;
    const date = data.targetDate;
    const formattedDate = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `👤 Paciente: ${data.patientName}
📞 Telefone: ${data.contactPhone}
🏥 Especialidade: ${data.specialty}
📅 Data: ${formattedDate}
⏰ Horário: ${data.selectedSlot.startTime} - ${data.selectedSlot.endTime}
👨‍⚕️ Médico: ${data.selectedDoctor.nome_exibicao}
🏥 Clínica: ${state.clinicData.clinica.informacoes_basicas.nome}`;
  }

  /**
   * Cria resposta padronizada
   */
  static createResponse(message, nextStep, state, requiresInput = false, options = null) {
    return {
      message,
      nextStep,
      requiresInput,
      options,
      state
    };
  }

  /**
   * Limpa estado da conversa
   */
  static clearConversation(patientPhone) {
    this.conversationStates.delete(patientPhone);
  }

  /**
   * Obtém estado atual da conversa
   */
  static getConversationState(patientPhone) {
    return this.conversationStates.get(patientPhone);
  }
} 