import { supabase } from '@/integrations/supabase/client';
import * as crypto from 'crypto';

export interface DataProcessingEvent {
  userId: string;
  action: string;
  dataType: string;
  legalBasis: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ConsentStatus {
  userId: string;
  consentGiven: boolean;
  consentDate: Date;
  consentVersion: string;
  consentWithdrawn: boolean;
  withdrawalDate?: Date;
  legalBasis: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  dataType: string;
  legalBasis: string;
  timestamp: Date;
  encrypted: boolean;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class LGPDComplianceService {
  private readonly encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  private readonly consentVersion = '1.0.0';

  /**
   * Registra evento de processamento de dados para auditoria LGPD
   */
  async logDataProcessing(event: DataProcessingEvent): Promise<void> {
    try {
      const auditEntry: Omit<AuditLogEntry, 'id'> = {
        userId: event.userId,
        action: event.action,
        dataType: event.dataType,
        legalBasis: event.legalBasis,
        timestamp: event.timestamp,
        encrypted: true,
        metadata: event.metadata,
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent()
      };

      await supabase
        .from('audit_logs')
        .insert({
          ...auditEntry,
          metadata: event.metadata ? this.encryptSensitiveData(event.metadata) : null
        });

      console.log(`✅ LGPD Audit: ${event.action} for user ${event.userId}`);
    } catch (error) {
      console.error('❌ Erro ao registrar log de auditoria LGPD:', error);
      // Não falhar o processo principal por erro de log
    }
  }

  /**
   * Solicita exclusão de dados do usuário (direito ao esquecimento)
   */
  async requestDataDeletion(userId: string): Promise<{
    success: boolean;
    message: string;
    deletedDataTypes: string[];
  }> {
    try {
      // 1. Anonimizar dados pessoais
      await this.anonymizeUserData(userId);

      // 2. Remover identificadores pessoais
      await this.removePersonalIdentifiers(userId);

      // 3. Registrar solicitação de exclusão
      await this.logDataProcessing({
        userId,
        action: 'data_deletion_requested',
        dataType: 'personal_data',
        legalBasis: 'user_request',
        timestamp: new Date()
      });

      // 4. Marcar usuário como excluído
      await supabase
        .from('users')
        .update({
          data_deletion_requested: true,
          deletion_date: new Date().toISOString(),
          anonymized: true
        })
        .eq('id', userId);

      return {
        success: true,
        message: 'Dados excluídos conforme solicitado',
        deletedDataTypes: ['personal_info', 'conversation_history', 'appointments']
      };
    } catch (error) {
      console.error('❌ Erro ao excluir dados do usuário:', error);
      return {
        success: false,
        message: 'Erro ao processar exclusão de dados',
        deletedDataTypes: []
      };
    }
  }

  /**
   * Verifica status de consentimento do usuário
   */
  async getConsentStatus(userId: string): Promise<ConsentStatus | null> {
    try {
      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        userId: data.user_id,
        consentGiven: data.consent_given,
        consentDate: new Date(data.consent_date),
        consentVersion: data.consent_version,
        consentWithdrawn: data.consent_withdrawn || false,
        withdrawalDate: data.withdrawal_date ? new Date(data.withdrawal_date) : undefined,
        legalBasis: data.legal_basis
      };
    } catch (error) {
      console.error('❌ Erro ao verificar status de consentimento:', error);
      return null;
    }
  }

  /**
   * Registra consentimento do usuário
   */
  async recordConsent(
    userId: string,
    consentGiven: boolean,
    legalBasis: string = 'legitimate_interest'
  ): Promise<void> {
    try {
      await supabase
        .from('user_consents')
        .insert({
          user_id: userId,
          consent_given: consentGiven,
          consent_date: new Date().toISOString(),
          consent_version: this.consentVersion,
          legal_basis: legalBasis,
          ip_address: this.getClientIP(),
          user_agent: this.getUserAgent()
        });

      await this.logDataProcessing({
        userId,
        action: consentGiven ? 'consent_given' : 'consent_withdrawn',
        dataType: 'consent',
        legalBasis,
        timestamp: new Date()
      });

      console.log(`✅ Consentimento registrado para usuário ${userId}`);
    } catch (error) {
      console.error('❌ Erro ao registrar consentimento:', error);
      throw error;
    }
  }

  /**
   * Verifica se o processamento de dados é legal
   */
  async validateDataProcessing(
    userId: string,
    dataType: string,
    purpose: string
  ): Promise<{
    isLegal: boolean;
    legalBasis: string;
    requiresConsent: boolean;
    consentStatus?: ConsentStatus;
  }> {
    try {
      const consentStatus = await this.getConsentStatus(userId);
      
      // Verificar se tem consentimento válido
      if (consentStatus && consentStatus.consentGiven && !consentStatus.consentWithdrawn) {
        return {
          isLegal: true,
          legalBasis: 'consent',
          requiresConsent: false,
          consentStatus
        };
      }

      // Verificar se é interesse legítimo
      const legitimateInterests = [
        'appointment_scheduling',
        'customer_service',
        'quality_improvement',
        'security'
      ];

      if (legitimateInterests.includes(purpose)) {
        return {
          isLegal: true,
          legalBasis: 'legitimate_interest',
          requiresConsent: false,
          consentStatus
        };
      }

      // Verificar se é obrigação contratual
      if (purpose === 'contract_performance') {
        return {
          isLegal: true,
          legalBasis: 'contract',
          requiresConsent: false,
          consentStatus
        };
      }

      return {
        isLegal: false,
        legalBasis: 'none',
        requiresConsent: true,
        consentStatus
      };
    } catch (error) {
      console.error('❌ Erro ao validar processamento de dados:', error);
      return {
        isLegal: false,
        legalBasis: 'error',
        requiresConsent: true
      };
    }
  }

  /**
   * Gera relatório de compliance para auditoria
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalDataProcessingEvents: number;
    consentGiven: number;
    consentWithdrawn: number;
    dataDeletionRequests: number;
    legalBasisBreakdown: Record<string, number>;
    complianceScore: number;
  }> {
    try {
      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (auditError) throw auditError;

      const { data: consents, error: consentError } = await supabase
        .from('user_consents')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (consentError) throw consentError;

      const legalBasisBreakdown: Record<string, number> = {};
      auditLogs.forEach(log => {
        legalBasisBreakdown[log.legal_basis] = (legalBasisBreakdown[log.legal_basis] || 0) + 1;
      });

      const consentGiven = consents.filter(c => c.consent_given).length;
      const consentWithdrawn = consents.filter(c => c.consent_withdrawn).length;
      const dataDeletionRequests = auditLogs.filter(log => 
        log.action === 'data_deletion_requested'
      ).length;

      // Calcular score de compliance (0-100)
      const totalEvents = auditLogs.length;
      const compliantEvents = auditLogs.filter(log => 
        log.legal_basis !== 'none' && log.legal_basis !== 'error'
      ).length;
      
      const complianceScore = totalEvents > 0 ? (compliantEvents / totalEvents) * 100 : 100;

      return {
        totalDataProcessingEvents: totalEvents,
        consentGiven,
        consentWithdrawn,
        dataDeletionRequests,
        legalBasisBreakdown,
        complianceScore: Math.round(complianceScore)
      };
    } catch (error) {
      console.error('❌ Erro ao gerar relatório de compliance:', error);
      return {
        totalDataProcessingEvents: 0,
        consentGiven: 0,
        consentWithdrawn: 0,
        dataDeletionRequests: 0,
        legalBasisBreakdown: {},
        complianceScore: 0
      };
    }
  }

  /**
   * Criptografa dados sensíveis
   */
  private encryptSensitiveData(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
      let encrypted = cipher.update(jsonString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      console.error('❌ Erro ao criptografar dados:', error);
      return '';
    }
  }

  /**
   * Descriptografa dados sensíveis
   */
  private decryptSensitiveData(encryptedData: string): any {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('❌ Erro ao descriptografar dados:', error);
      return null;
    }
  }

  /**
   * Anonimiza dados do usuário
   */
  private async anonymizeUserData(userId: string): Promise<void> {
    try {
      // Anonimizar conversas
      await supabase
        .from('conversations')
        .update({
          user_phone: this.anonymizePhone(userId),
          user_name: 'Usuário Anônimo',
          anonymized: true,
          anonymization_date: new Date().toISOString()
        })
        .eq('user_id', userId);

      // Anonimizar agendamentos
      await supabase
        .from('appointments')
        .update({
          patient_name: 'Paciente Anônimo',
          patient_phone: this.anonymizePhone(userId),
          anonymized: true,
          anonymization_date: new Date().toISOString()
        })
        .eq('user_id', userId);

      console.log(`✅ Dados anonimizados para usuário ${userId}`);
    } catch (error) {
      console.error('❌ Erro ao anonimizar dados:', error);
      throw error;
    }
  }

  /**
   * Remove identificadores pessoais
   */
  private async removePersonalIdentifiers(userId: string): Promise<void> {
    try {
      // Remover dados pessoais de usuários
      await supabase
        .from('users')
        .update({
          email: null,
          phone: null,
          name: null,
          personal_data_removed: true,
          removal_date: new Date().toISOString()
        })
        .eq('id', userId);

      console.log(`✅ Identificadores pessoais removidos para usuário ${userId}`);
    } catch (error) {
      console.error('❌ Erro ao remover identificadores pessoais:', error);
      throw error;
    }
  }

  /**
   * Anonimiza número de telefone
   */
  private anonymizePhone(userId: string): string {
    const hash = crypto.createHash('sha256').update(userId).digest('hex');
    return `anon_${hash.substring(0, 8)}`;
  }

  /**
   * Obtém IP do cliente (simulado)
   */
  private getClientIP(): string {
    // Em produção, obter do request
    return '127.0.0.1';
  }

  /**
   * Obtém User Agent (simulado)
   */
  private getUserAgent(): string {
    // Em produção, obter do request
    return 'AtendeAI-Lify/1.0';
  }
} 