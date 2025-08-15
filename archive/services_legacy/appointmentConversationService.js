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
        
        case 'collecting_patient_data':
          return await this.handlePatientDataCollection(message, state);
        
        case 'collecting_specialty':
          return await this.handleSpecialtyCollection(message, state);
        
        case 'selecting_date':
          return await this.handleDateSelection(message, state);
        
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

    // Buscar as próximas 4 datas disponíveis no Google Calendar
    console.log('📅 [AppointmentConversationService] Buscando datas disponíveis...');
    const availableDates = await this.getAvailableDates(state);
    
    if (availableDates.length === 0) {
      return this.createResponse(
        'Desculpe, não encontrei datas disponíveis nos próximos dias. Por favor, entre em contato pelo telefone (47) 3231-0200.',
        'error',
        state,
        false
      );
    }

    // Formatar datas para exibição
    const dateOptions = availableDates.map((date, index) => {
      const formattedDate = date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      return `${index + 1}. ${formattedDate}`;
    }).join('\n');

    // Iniciar coleta de dados com datas disponíveis
    state.step = 'collecting_patient_data';
    state.collectedData = {
      patientPhone: state.patientPhone,
      serviceType: intent.entities?.serviceType || 'consulta',
      availableDates: availableDates
    };

    return this.createResponse(
      'Perfeito! Vou ajudá-lo a agendar sua consulta.\n\n' +
      '📅 **Datas disponíveis:**\n' +
      `${dateOptions}\n\n` +
      '📝 **Agora preciso dos seus dados para o agendamento:**\n\n' +
      '1️⃣ **Nome completo:**\n' +
      '2️⃣ **CPF:**\n' +
      '3️⃣ **Data de nascimento (DD/MM/AAAA):**\n' +
      '4️⃣ **Convênio ou particular:**\n\n' +
      'Por favor, informe todos os dados separados por vírgula nesta ordem:\n' +
      'Exemplo: João Silva, 123.456.789-00, 15/03/1985, particular',
      'collecting_patient_data',
      state,
      true
    );
  }

  /**
   * Processa coleta de dados do paciente
   */
  static async handlePatientDataCollection(message, state) {
    console.log('📝 [AppointmentConversationService] Processando dados do paciente...');
    
    const data = message.trim();
    const parts = data.split(',').map(part => part.trim());
    
    if (parts.length !== 4) {
      return this.createResponse(
        'Por favor, informe todos os dados separados por vírgula:\n\n' +
        '📝 **Nome completo:**\n' +
        '📋 **CPF:**\n' +
        '📅 **Data de nascimento (DD/MM/AAAA):**\n' +
        '🏥 **Convênio ou particular:**\n\n' +
        'Exemplo: João Silva, 123.456.789-00, 15/03/1985, particular',
        'collecting_patient_data',
        state,
        true
      );
    }
    
    const [name, cpf, birthDate, insurance] = parts;
    
    // Validações básicas
    if (name.length < 2) {
      return this.createResponse(
        'Por favor, informe um nome válido.',
        'collecting_patient_data',
        state,
        true
      );
    }
    
    if (!cpf || cpf.length < 11) {
      return this.createResponse(
        'Por favor, informe um CPF válido.',
        'collecting_patient_data',
        state,
        true
      );
    }
    
    // Validar formato da data
    const dateMatch = birthDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!dateMatch) {
      return this.createResponse(
        'Por favor, informe a data de nascimento no formato DD/MM/AAAA.',
        'collecting_patient_data',
        state,
        true
      );
    }
    
    // Salvar dados do paciente
    state.collectedData.patientName = name;
    state.collectedData.patientCpf = cpf;
    state.collectedData.patientBirthDate = birthDate;
    state.collectedData.patientInsurance = insurance;
    
    console.log('✅ [AppointmentConversationService] Dados do paciente coletados:', {
      name,
      cpf,
      birthDate,
      insurance
    });
    
    // Mostrar especialidades disponíveis
    const specialties = state.clinicData.clinica.informacoes_basicas.especialidades_secundarias;
    const specialtyList = specialties.map((spec, index) => `${index + 1}. ${spec}`).join('\n');

    state.step = 'collecting_specialty';

    return this.createResponse(
      '✅ Dados recebidos com sucesso!\n\n' +
      'Agora me diga qual especialidade você precisa:\n\n' +
      `${specialtyList}\n\n` +
      'Digite o número da especialidade ou o nome:',
      'collecting_specialty',
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
    console.log('🏥 [AppointmentConversationService] Processando especialidade:', message);
    
    const specialty = message.trim();
    state.collectedData.specialty = specialty;
    
    // Usar as datas já disponíveis que foram mostradas na primeira mensagem
    const availableDates = state.collectedData.availableDates;
    
    if (!availableDates || availableDates.length === 0) {
      console.error('❌ [AppointmentConversationService] Datas não encontradas no estado');
      return this.createResponse(
        'Desculpe, ocorreu um erro. Vamos começar novamente.\n\n' +
        'Digite "quero agendar uma consulta" para iniciar.',
        'initial',
        state
      );
    }

    // Formatar datas para exibição
    const dateOptions = availableDates.map((date, index) => {
      const formattedDate = date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      return `${index + 1}. ${formattedDate}`;
    }).join('\n');

    state.step = 'selecting_date';

    return this.createResponse(
      'Excelente! Agora escolha uma das datas disponíveis:\n\n' +
      `${dateOptions}\n\n` +
      'Digite o número da data que prefere:',
      'selecting_date',
      state,
      true
    );
  }

  /**
   * Processa seleção da data
   */
  static async handleDateSelection(message, state) {
    try {
      console.log('📅 [AppointmentConversationService] Processando seleção de data:', message);
      
      const choice = parseInt(message.trim());
      const availableDates = state.collectedData.availableDates;

      console.log('📊 [AppointmentConversationService] Dados da seleção:', {
        choice,
        availableDatesLength: availableDates?.length || 0,
        availableDates: availableDates?.map(d => d.toLocaleDateString('pt-BR'))
      });

      if (isNaN(choice) || choice < 1 || choice > availableDates.length) {
        const dateOptions = availableDates.map((date, index) => {
          const formattedDate = date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          });
          return `${index + 1}. ${formattedDate}`;
        }).join('\n');

        return this.createResponse(
          `Por favor, escolha um número válido:\n\n` +
          `${dateOptions}\n\n` +
          'Digite o número da data:',
          'selecting_date',
          state,
          true
        );
      }

      const selectedDate = availableDates[choice - 1];
      state.collectedData.targetDate = selectedDate;
      state.step = 'searching_available_times';

      console.log('✅ [AppointmentConversationService] Data selecionada:', selectedDate.toLocaleDateString('pt-BR'));

      // Buscar horários disponíveis para a data selecionada
      console.log('⏰ [AppointmentConversationService] Buscando horários disponíveis...');
      const availableTimes = await this.getAvailableTimesForDate(selectedDate, state);
      
      console.log('📊 [AppointmentConversationService] Horários encontrados:', {
        count: availableTimes.length,
        times: availableTimes.map(t => `${t.startTime} - ${t.endTime}`)
      });

      if (availableTimes.length === 0) {
        return this.createResponse(
          'Desculpe, não há horários disponíveis para esta data. Gostaria de escolher outra data?',
          'selecting_date',
          state,
          true
        );
      }

      // Formatar horários para exibição
      const timeOptions = availableTimes.map((time, index) => 
        `${index + 1}. ${time.startTime} - ${time.endTime}`
      ).join('\n');

      state.collectedData.availableTimes = availableTimes;

      return this.createResponse(
        `Perfeito! Encontrei os seguintes horários disponíveis:\n\n` +
        `${timeOptions}\n\n` +
        'Digite o número do horário que prefere:',
        'selecting_time',
        state,
        true
      );
    } catch (error) {
      console.error('💥 [AppointmentConversationService] Erro ao processar seleção de data:', error);
      return this.createResponse(
        'Desculpe, ocorreu um erro. Vamos começar novamente.',
        'initial',
        state
      );
    }
  }

  /**
   * Processa seleção de horário
   */
  static async handleTimeSelection(message, state) {
    try {
      console.log('⏰ [AppointmentConversationService] Processando seleção de horário...');
      
      const choice = parseInt(message.trim());
      const availableTimes = state.collectedData.availableTimes;

      console.log('📊 [AppointmentConversationService] Dados da seleção:', {
        choice,
        availableTimesLength: availableTimes?.length || 0,
        availableTimes: availableTimes
      });

      if (isNaN(choice) || choice < 1 || choice > availableTimes.length) {
        const timeOptions = availableTimes.map((time, index) => 
          `${index + 1}. ${time.startTime} - ${time.endTime}`
        ).join('\n');

        return this.createResponse(
          `Por favor, escolha um número válido:\n\n` +
          `${timeOptions}\n\n` +
          'Digite o número do horário:',
          'selecting_time',
          state,
          true
        );
      }

      const selectedTime = availableTimes[choice - 1];
      state.collectedData.selectedTime = selectedTime;
      state.step = 'selecting_doctor';

      console.log('✅ [AppointmentConversationService] Horário selecionado:', selectedTime);

      // Mostrar médicos disponíveis
      console.log('👨‍⚕️ [AppointmentConversationService] Buscando médicos disponíveis...');
      const availableDoctors = this.getAvailableDoctors(state);
      
      console.log('📊 [AppointmentConversationService] Médicos encontrados:', {
        count: availableDoctors.length,
        doctors: availableDoctors.map(d => d.nome_exibicao)
      });

      if (availableDoctors.length === 0) {
        return this.createResponse(
          'Desculpe, não há médicos disponíveis para esta data e especialidade. Por favor, escolha outra data ou especialidade.',
          'collecting_specialty',
          state,
          true
        );
      }

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
    } catch (error) {
      console.error('💥 [AppointmentConversationService] Erro ao processar seleção de horário:', error);
      return this.createResponse(
        'Desculpe, ocorreu um erro. Vamos começar novamente.',
        'initial',
        state
      );
    }
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
        startTime: state.collectedData.selectedTime.startTime,
        endTime: state.collectedData.selectedTime.endTime,
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
   * Busca as próximas 4 datas disponíveis no Google Calendar
   */
  static async getAvailableDates(state) {
    try {
      // TODO: Integrar com Google Calendar API
      // Por enquanto, simular datas disponíveis
      const today = new Date();
      const availableDates = [];
      
      for (let i = 1; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Verificar se é dia útil (segunda a sexta)
        const dayOfWeek = date.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          availableDates.push(date);
          if (availableDates.length >= 4) break;
        }
      }
      
      return availableDates;
    } catch (error) {
      console.error('Erro ao buscar datas disponíveis:', error);
      return [];
    }
  }

  /**
   * Busca horários disponíveis para uma data específica
   */
  static async getAvailableTimesForDate(date, state) {
    try {
      // TODO: Integrar com Google Calendar API
      // Por enquanto, simular horários baseados no horário de funcionamento
      const dayOfWeek = date.getDay();
      const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
      const dayName = dayNames[dayOfWeek];
      const workingHours = state.clinicData.clinica.horario_funcionamento[dayName];

      if (!workingHours || !workingHours.abertura) {
        return [];
      }

      const availableTimes = [];
      const startHour = parseInt(workingHours.abertura.split(':')[0]);
      const endHour = parseInt(workingHours.fechamento.split(':')[0]);
      
      for (let hour = startHour; hour < endHour; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        
        availableTimes.push({
          startTime,
          endTime,
          available: true
        });
      }

      return availableTimes;
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      return [];
    }
  }

  /**
   * Obtém médicos disponíveis para o dia selecionado
   */
  static getAvailableDoctors(state) {
    const targetDate = state.collectedData.targetDate;
    const dayOfWeek = targetDate.getDay();
    const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const dayName = dayNames[dayOfWeek];
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

    return `👤 **Paciente:** ${data.patientName}
📋 **CPF:** ${data.patientCpf}
📅 **Data de Nascimento:** ${data.patientBirthDate}
🏥 **Convênio:** ${data.patientInsurance}
📞 **Telefone:** ${data.patientPhone}
🏥 **Especialidade:** ${data.specialty}
📅 **Data:** ${formattedDate}
⏰ **Horário:** ${data.selectedTime.startTime} - ${data.selectedTime.endTime}
👨‍⚕️ **Médico:** ${data.selectedDoctor.nome_exibicao}
🏥 **Clínica:** ${state.clinicData.clinica.informacoes_basicas.nome}`;
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