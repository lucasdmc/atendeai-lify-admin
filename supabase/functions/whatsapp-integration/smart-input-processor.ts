
import { InputValidator, ValidationResult } from './input-validator.ts';
import { ConfirmationManager, ConfirmationSession } from './confirmation-manager.ts';

export interface ProcessingResult {
  success: boolean;
  data?: {
    name?: string;
    email?: string;
    time?: string;
    date?: string;
  };
  responseMessage: string;
  needsConfirmation: boolean;
  waitingFor?: string;
}

export class SmartInputProcessor {
  static processContactInfo(phoneNumber: string, message: string): ProcessingResult {
    console.log(`🧠 Processando dados de contato para ${phoneNumber}: ${message}`);
    
    // Verificar se está em sessão de confirmação
    const existingSession = ConfirmationManager.getSession(phoneNumber);
    if (existingSession?.waitingFor) {
      return this.handleConfirmationResponse(phoneNumber, message, existingSession);
    }

    // Extrair dados da mensagem
    const extractedData = this.extractAllData(message);
    console.log('📊 Dados extraídos:', extractedData);

    // Validar cada dado extraído
    const validations = this.validateExtractedData(extractedData);
    console.log('✅ Validações:', validations);

    // Verificar se algum dado precisa de confirmação
    const needsConfirmation = Object.values(validations).some(v => 
      ConfirmationManager.needsConfirmation(v)
    );

    if (needsConfirmation) {
      return this.handleDataIssues(phoneNumber, extractedData, validations);
    }

    // Todos os dados são válidos e confiáveis
    const validData = this.extractValidData(extractedData, validations);
    
    // Verificar se temos nome e email
    if (validData.name && validData.email) {
      console.log('🎉 Todos os dados válidos coletados!');
      return {
        success: true,
        data: validData,
        responseMessage: '',
        needsConfirmation: false
      };
    }

    // Solicitar dados em falta
    return this.requestMissingData(validData);
  }

  private static extractAllData(message: string): any {
    const data: any = {};
    
    // Extrair email
    const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      data.email = emailMatch[1];
    }
    
    // Extrair nome (remover email primeiro)
    let nameText = message.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/, '').trim();
    
    // Tentar diferentes padrões para nome
    const namePatterns = [
      /nome:?\s*([A-Za-zÀ-ÿ\s]+)/i,
      /^([A-Za-zÀ-ÿ\s]+)$/
    ];
    
    for (const pattern of namePatterns) {
      const match = nameText.match(pattern);
      if (match && match[1].trim().length > 1) {
        data.name = match[1].trim();
        break;
      }
    }
    
    // Se não encontrou nome mas tem texto sem email
    if (!data.name && nameText.length > 2) {
      const lines = nameText.split('\n').map(line => line.trim()).filter(line => line.length > 1);
      for (const line of lines) {
        if (/^[A-Za-zÀ-ÿ\s]+$/.test(line) && line.length > 2) {
          data.name = line;
          break;
        }
      }
    }
    
    return data;
  }

  private static validateExtractedData(data: any): Record<string, ValidationResult> {
    const validations: Record<string, ValidationResult> = {};
    
    if (data.name) {
      validations.name = InputValidator.validateName(data.name);
    }
    
    if (data.email) {
      validations.email = InputValidator.validateEmail(data.email);
    }
    
    if (data.time) {
      validations.time = InputValidator.validateTime(data.time);
    }
    
    if (data.date) {
      validations.date = InputValidator.validateDate(data.date);
    }
    
    return validations;
  }

  private static handleDataIssues(
    phoneNumber: string, 
    extractedData: any, 
    validations: Record<string, ValidationResult>
  ): ProcessingResult {
    // Encontrar o primeiro problema que precisa ser resolvido
    for (const [dataType, validation] of Object.entries(validations)) {
      if (ConfirmationManager.needsConfirmation(validation)) {
        console.log(`❌ Problema identificado em ${dataType}:`, validation);
        
        // Criar ou atualizar sessão de confirmação
        let session = ConfirmationManager.getSession(phoneNumber);
        if (!session) {
          session = ConfirmationManager.createConfirmationSession(phoneNumber);
        }
        
        session.waitingFor = `${dataType}_confirmation` as any;
        session.attempts += 1;
        session.lastIssues = validation.issues;
        
        ConfirmationManager.updateSession(phoneNumber, session);
        
        const confirmationMessage = ConfirmationManager.generateConfirmationMessage(
          dataType as any,
          validation,
          extractedData[dataType]
        );
        
        return {
          success: false,
          responseMessage: confirmationMessage,
          needsConfirmation: true,
          waitingFor: `${dataType}_confirmation`
        };
      }
    }
    
    return {
      success: false,
      responseMessage: 'Erro interno no processamento',
      needsConfirmation: false
    };
  }

  private static handleConfirmationResponse(
    phoneNumber: string, 
    message: string, 
    session: ConfirmationSession
  ): ProcessingResult {
    const waitingFor = session.waitingFor!;
    const dataType = waitingFor.replace('_confirmation', '');
    
    console.log(`🔄 Processando confirmação para ${dataType}`);
    
    const response = ConfirmationManager.processConfirmationResponse(
      phoneNumber, 
      message, 
      waitingFor
    );
    
    if (response.confirmed) {
      // Dados confirmados - limpar sessão e continuar
      const confirmedValue = session.pendingData[dataType as keyof typeof session.pendingData]?.value;
      ConfirmationManager.clearSession(phoneNumber);
      
      const successMessage = ConfirmationManager.formatSuccessMessage(dataType, confirmedValue || 'N/A');
      
      return {
        success: true,
        data: { [dataType]: confirmedValue },
        responseMessage: successMessage + '\n\nContinuando com o agendamento...',
        needsConfirmation: false
      };
    }
    
    if (response.needsNewInput) {
      // Usuário quer corrigir - pedir nova entrada
      session.attempts = 0;
      session.waitingFor = undefined;
      ConfirmationManager.updateSession(phoneNumber, session);
      
      return {
        success: false,
        responseMessage: `Certo! Me informe ${ConfirmationManager['getDataTypeLabel'](dataType).toLowerCase()} correto:`,
        needsConfirmation: false
      };
    }
    
    if (response.newValue) {
      // Nova tentativa de valor - validar novamente
      const newValidation = this.validateSingleData(dataType, response.newValue);
      
      if (!ConfirmationManager.needsConfirmation(newValidation)) {
        // Agora está válido
        ConfirmationManager.clearSession(phoneNumber);
        
        return {
          success: true,
          data: { [dataType]: newValidation.value },
          responseMessage: ConfirmationManager.formatSuccessMessage(dataType, newValidation.value!) + '\n\nContinuando...',
          needsConfirmation: false
        };
      } else {
        // Ainda tem problemas
        session.attempts += 1;
        const confirmationMessage = ConfirmationManager.generateConfirmationMessage(
          dataType as any,
          newValidation,
          response.newValue
        );
        
        return {
          success: false,
          responseMessage: confirmationMessage,
          needsConfirmation: true,
          waitingFor: waitingFor
        };
      }
    }
    
    return {
      success: false,
      responseMessage: 'Não entendi. Pode confirmar ou corrigir a informação?',
      needsConfirmation: true,
      waitingFor: waitingFor
    };
  }

  private static validateSingleData(dataType: string, value: string): ValidationResult {
    switch (dataType) {
      case 'name':
        return InputValidator.validateName(value);
      case 'email':
        return InputValidator.validateEmail(value);
      case 'time':
        return InputValidator.validateTime(value);
      case 'date':
        return InputValidator.validateDate(value);
      default:
        return {
          isValid: false,
          issues: ['Tipo de dado não reconhecido'],
          suggestions: [],
          confidence: 0
        };
    }
  }

  private static extractValidData(extractedData: any, validations: Record<string, ValidationResult>): any {
    const validData: any = {};
    
    for (const [key, validation] of Object.entries(validations)) {
      if (validation.isValid && !ConfirmationManager.needsConfirmation(validation)) {
        validData[key] = validation.value || extractedData[key];
      }
    }
    
    return validData;
  }

  private static requestMissingData(currentData: any): ProcessingResult {
    const missing = [];
    if (!currentData.name) missing.push('📝 **Nome completo**');
    if (!currentData.email) missing.push('📧 **Email**');
    
    const message = `Preciso ${missing.join(' e ')} para finalizar! 😊

Por favor, me envie assim:
**Nome:** Seu Nome Completo  
**Email:** seuemail@exemplo.com

Ou pode enviar em linhas separadas! 💙`;

    return {
      success: false,
      responseMessage: message,
      needsConfirmation: false
    };
  }
}
