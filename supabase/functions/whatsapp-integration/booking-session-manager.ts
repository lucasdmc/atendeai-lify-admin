
interface BookingSession {
  id: string;
  conversation_id: string;
  phone_number: string;
  session_state: string;
  selected_date?: string;
  selected_time?: string;
  selected_service?: string;
  customer_name?: string;
  customer_email?: string;
  session_data: any;
  expires_at: string;
}

export class BookingSessionManager {
  constructor(private supabase: any) {}

  async createSession(conversationId: string, phoneNumber: string): Promise<BookingSession | null> {
    try {
      // Limpar sessões expiradas primeiro
      await this.cleanExpiredSessions();
      
      // Verificar se já existe uma sessão ativa
      const { data: existingSession } = await this.supabase
        .from('whatsapp_booking_sessions')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('session_state', 'idle')
        .single();

      if (existingSession) {
        // Atualizar sessão existente
        const { data, error } = await this.supabase
          .from('whatsapp_booking_sessions')
          .update({
            session_state: 'awaiting_date',
            expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
          })
          .eq('id', existingSession.id)
          .select()
          .single();

        return error ? null : data;
      }

      // Criar nova sessão
      const { data, error } = await this.supabase
        .from('whatsapp_booking_sessions')
        .insert({
          conversation_id: conversationId,
          phone_number: phoneNumber,
          session_state: 'awaiting_date',
          session_data: {},
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      return error ? null : data;
    } catch (error) {
      console.error('❌ Erro ao criar sessão de agendamento:', error);
      return null;
    }
  }

  async getActiveSession(conversationId: string): Promise<BookingSession | null> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_booking_sessions')
        .select('*')
        .eq('conversation_id', conversationId)
        .neq('session_state', 'completed')
        .neq('session_state', 'idle')
        .gt('expires_at', new Date().toISOString())
        .single();

      return error ? null : data;
    } catch (error) {
      return null;
    }
  }

  async updateSession(sessionId: string, updates: Partial<BookingSession>): Promise<BookingSession | null> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_booking_sessions')
        .update({
          ...updates,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // Renovar expiração
        })
        .eq('id', sessionId)
        .select()
        .single();

      return error ? null : data;
    } catch (error) {
      console.error('❌ Erro ao atualizar sessão:', error);
      return null;
    }
  }

  async completeSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('whatsapp_booking_sessions')
        .update({
          session_state: 'completed'
        })
        .eq('id', sessionId);

      return !error;
    } catch (error) {
      console.error('❌ Erro ao completar sessão:', error);
      return false;
    }
  }

  async cancelSession(conversationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('whatsapp_booking_sessions')
        .delete()
        .eq('conversation_id', conversationId)
        .neq('session_state', 'completed');

      return !error;
    } catch (error) {
      console.error('❌ Erro ao cancelar sessão:', error);
      return false;
    }
  }

  private async cleanExpiredSessions(): Promise<void> {
    try {
      await this.supabase.rpc('clean_expired_booking_sessions');
    } catch (error) {
      console.error('❌ Erro ao limpar sessões expiradas:', error);
    }
  }
}
