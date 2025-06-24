
export interface ApprovalRequest {
  id: string;
  type: 'cancel' | 'reschedule' | 'new_appointment';
  phoneNumber: string;
  customerName?: string;
  originalAppointment?: any;
  newAppointmentData?: any;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  requestedBy: string;
}

export class ApprovalSystem {
  static async createApprovalRequest(
    supabase: any,
    request: Partial<ApprovalRequest>
  ): Promise<string> {
    console.log('📋 Criando solicitação de aprovação:', request);

    try {
      // Salvar solicitação no banco
      const approvalId = `apr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('appointment_approval_requests')
        .insert({
          id: approvalId,
          type: request.type,
          phone_number: request.phoneNumber,
          customer_name: request.customerName,
          original_appointment: request.originalAppointment,
          new_appointment_data: request.newAppointmentData,
          reason: request.reason,
          status: 'pending',
          requested_by: 'whatsapp_bot'
        });

      if (error) {
        console.error('❌ Erro ao salvar solicitação:', error);
        // Continuar mesmo se não conseguir salvar no banco
      }

      // Notificar atendentes (isso seria integrado com sistema de notificações)
      await this.notifyAttendants(supabase, {
        ...request,
        id: approvalId
      } as ApprovalRequest);

      return this.formatApprovalMessage(request);
    } catch (error) {
      console.error('❌ Erro no sistema de aprovação:', error);
      return `✅ Sua solicitação foi registrada e será analisada pela nossa equipe.

📧 Você será notificado da decisão em breve por WhatsApp ou email.

🕐 Tempo estimado de resposta: até 4 horas úteis.`;
    }
  }

  private static async notifyAttendants(
    supabase: any, 
    approval: ApprovalRequest
  ): Promise<void> {
    console.log('🔔 Notificando atendentes sobre aprovação:', approval.id);

    try {
      // Buscar atendentes com permissão para agendamentos
      const { data: attendants, error } = await supabase
        .from('user_profiles')
        .select('id, name')
        .eq('role', 'admin')
        .eq('status', true);

      if (error || !attendants?.length) {
        console.log('⚠️ Nenhum atendente encontrado para notificar');
        return;
      }

      // Criar notificação no sistema interno
      const notificationData = {
        type: 'appointment_approval',
        title: this.getNotificationTitle(approval),
        message: this.getNotificationMessage(approval),
        approval_id: approval.id,
        priority: approval.type === 'cancel' ? 'high' : 'medium',
        created_at: new Date().toISOString()
      };

      // Salvar notificação para cada atendente
      const notifications = attendants.map(attendant => ({
        ...notificationData,
        user_id: attendant.id
      }));

      await supabase
        .from('internal_notifications')
        .insert(notifications);

      console.log(`✅ ${attendants.length} atendentes notificados`);
    } catch (error) {
      console.error('❌ Erro ao notificar atendentes:', error);
    }
  }

  private static getNotificationTitle(approval: ApprovalRequest): string {
    switch (approval.type) {
      case 'cancel':
        return `🚫 Solicitação de Cancelamento`;
      case 'reschedule':
        return `🔄 Solicitação de Reagendamento`;
      case 'new_appointment':
        return `📅 Novo Agendamento para Aprovação`;
      default:
        return `📋 Nova Solicitação`;
    }
  }

  private static getNotificationMessage(approval: ApprovalRequest): string {
    const customer = approval.customerName || 'Cliente';
    const phone = approval.phoneNumber?.replace(/\D/g, '') || '';
    
    switch (approval.type) {
      case 'cancel':
        return `${customer} (${phone}) solicitou cancelamento de consulta via WhatsApp.`;
      case 'reschedule':
        return `${customer} (${phone}) solicitou reagendamento de consulta via WhatsApp.`;
      case 'new_appointment':
        return `${customer} (${phone}) fez novo agendamento via WhatsApp que precisa de aprovação.`;
      default:
        return `${customer} (${phone}) fez uma solicitação via WhatsApp.`;
    }
  }

  private static formatApprovalMessage(request: Partial<ApprovalRequest>): string {
    const baseMessage = `✅ **Solicitação registrada com sucesso!**

📋 Sua solicitação de **${this.getTypeDescription(request.type!)}** foi enviada para nossa equipe.

🔔 **O que acontece agora:**
• Nossa equipe analisará sua solicitação
• Você receberá uma resposta em até 4 horas úteis
• A confirmação será enviada por WhatsApp

⏰ **Horário de atendimento:** Segunda a Sexta, 8h às 18h

📞 **Urgente?** Entre em contato por telefone: (XX) XXXX-XXXX`;

    if (request.type === 'cancel') {
      return baseMessage + `\n\n⚠️ **Importante:** Sua consulta ainda está marcada até a aprovação do cancelamento.`;
    }

    return baseMessage;
  }

  private static getTypeDescription(type: string): string {
    switch (type) {
      case 'cancel': return 'cancelamento';
      case 'reschedule': return 'reagendamento';
      case 'new_appointment': return 'agendamento';
      default: return 'solicitação';
    }
  }

  static async processApprovalResponse(
    supabase: any,
    approvalId: string,
    decision: 'approved' | 'rejected',
    attendantId: string,
    notes?: string
  ): Promise<boolean> {
    console.log(`⚖️ Processando decisão de aprovação ${approvalId}: ${decision}`);

    try {
      // Atualizar status da aprovação
      const { data: approval, error: updateError } = await supabase
        .from('appointment_approval_requests')
        .update({
          status: decision,
          processed_by: attendantId,
          processed_at: new Date().toISOString(),
          notes
        })
        .eq('id', approvalId)
        .select()
        .single();

      if (updateError || !approval) {
        console.error('❌ Erro ao atualizar aprovação:', updateError);
        return false;
      }

      // Executar ação baseada na decisão
      if (decision === 'approved') {
        await this.executeApprovedAction(supabase, approval);
      }

      // Notificar cliente via WhatsApp
      await this.notifyCustomer(supabase, approval, decision, notes);

      return true;
    } catch (error) {
      console.error('❌ Erro ao processar aprovação:', error);
      return false;
    }
  }

  private static async executeApprovedAction(supabase: any, approval: any): Promise<void> {
    console.log(`🎯 Executando ação aprovada: ${approval.type}`);

    try {
      switch (approval.type) {
        case 'cancel':
          if (approval.original_appointment?.id) {
            await supabase.functions.invoke('appointment-manager', {
              body: {
                action: 'delete',
                eventId: approval.original_appointment.id
              }
            });
          }
          break;

        case 'reschedule':
          // Cancelar agendamento antigo e criar novo
          if (approval.original_appointment?.id) {
            await supabase.functions.invoke('appointment-manager', {
              body: {
                action: 'delete',
                eventId: approval.original_appointment.id
              }
            });
          }
          
          if (approval.new_appointment_data) {
            await supabase.functions.invoke('appointment-manager', {
              body: {
                action: 'create',
                appointmentData: approval.new_appointment_data
              }
            });
          }
          break;

        case 'new_appointment':
          if (approval.new_appointment_data) {
            await supabase.functions.invoke('appointment-manager', {
              body: {
                action: 'create',
                appointmentData: approval.new_appointment_data
              }
            });
          }
          break;
      }

      console.log(`✅ Ação ${approval.type} executada com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao executar ação ${approval.type}:`, error);
    }
  }

  private static async notifyCustomer(
    supabase: any,
    approval: any,
    decision: 'approved' | 'rejected',
    notes?: string
  ): Promise<void> {
    console.log(`📱 Notificando cliente sobre decisão: ${decision}`);

    try {
      const message = this.formatCustomerNotification(approval, decision, notes);
      
      // Enviar mensagem via WhatsApp
      const { sendMessage } = await import('./message-sender.ts');
      await sendMessage(approval.phone_number, message, supabase);

      console.log(`✅ Cliente notificado sobre ${decision}`);
    } catch (error) {
      console.error('❌ Erro ao notificar cliente:', error);
    }
  }

  private static formatCustomerNotification(
    approval: any,
    decision: 'approved' | 'rejected',
    notes?: string
  ): string {
    const baseInfo = `📋 **Atualização da sua solicitação**\n\n`;
    
    if (decision === 'approved') {
      let message = baseInfo + `✅ Sua solicitação de **${this.getTypeDescription(approval.type)}** foi **APROVADA**!\n\n`;
      
      switch (approval.type) {
        case 'cancel':
          message += `🚫 Sua consulta foi cancelada com sucesso.\n\n`;
          break;
        case 'reschedule':
          message += `🔄 Sua consulta foi reagendada com sucesso!\n\n`;
          if (approval.new_appointment_data) {
            const newDate = new Date(approval.new_appointment_data.date);
            message += `📅 **Nova data:** ${newDate.toLocaleDateString('pt-BR')}\n`;
            message += `🕐 **Novo horário:** ${approval.new_appointment_data.startTime}\n`;
            message += `👨‍⚕️ **Consulta:** ${approval.new_appointment_data.title}\n\n`;
          }
          break;
        case 'new_appointment':
          message += `📅 Seu agendamento foi confirmado!\n\n`;
          break;
      }
      
      message += `🎉 Tudo certo! Se precisar de mais alguma coisa, estou aqui para ajudar! 😊`;
      
      if (notes) {
        message += `\n\n💬 **Observação da equipe:** ${notes}`;
      }
      
      return message;
    } else {
      let message = baseInfo + `❌ Sua solicitação de **${this.getTypeDescription(approval.type)}** foi **NEGADA**.\n\n`;
      
      message += `😔 Infelizmente não foi possível atender sua solicitação desta vez.\n\n`;
      
      if (notes) {
        message += `💬 **Motivo:** ${notes}\n\n`;
      }
      
      message += `📞 Para mais informações, entre em contato conosco:\n`;
      message += `• WhatsApp: Continue a conversa aqui\n`;
      message += `• Telefone: (XX) XXXX-XXXX\n\n`;
      message += `Estamos aqui para ajudar! 😊`;
      
      return message;
    }
  }
}
