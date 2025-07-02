import { supabase } from '@/integrations/supabase/client';
import { CalendarToken } from './types';
import { googleAuthManager } from './auth';

export class GoogleTokenManager {
  async exchangeCodeForTokens(code: string): Promise<CalendarToken> {
    console.log('=== TOKEN EXCHANGE PROCESS ===');
    console.log('Exchanging authorization code for tokens via Edge Function...');
    
    const config = googleAuthManager.getOAuthConfig();
    console.log('Using redirect URI for token exchange:', config.redirectUri);
    
    try {
      // Usa a Edge Function para trocar o código por tokens
      // Isso mantém o client_secret seguro no servidor
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('google-user-auth', {
        body: {
          code,
          redirectUri: config.redirectUri,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      console.log('Edge function response:', response);

      if (response.error) {
        console.error('Edge function error:', response.error);
        throw new Error(response.error.message || 'Failed to exchange code for tokens');
      }

      if (!response.data) {
        throw new Error('No data received from edge function');
      }

      console.log('Token exchange successful');
      console.log('User profile:', response.data.user_profile);
      
      const tokens = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_at: response.data.expires_at,
        scope: response.data.scope,
      };
      
      console.log('=== END TOKEN EXCHANGE ===');
      return tokens;
    } catch (error) {
      console.error('Token exchange error:', error);
      
      // Tenta fornecer mensagens de erro mais úteis
      if (error instanceof Error) {
        if (error.message.includes('redirect_uri_mismatch')) {
          throw new Error('A URL de redirecionamento não corresponde à configurada no Google Cloud Console.');
        } else if (error.message.includes('invalid_grant')) {
          throw new Error('Código de autorização inválido ou expirado. Por favor, tente novamente.');
        } else if (error.message.includes('invalid_client')) {
          throw new Error('Client ID ou Client Secret inválidos.');
        }
      }
      
      throw error;
    }
  }

  async saveTokens(tokens: CalendarToken): Promise<void> {
    console.log('Saving tokens to database...');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found when saving tokens');
      throw new Error('User not authenticated');
    }

    console.log('Saving tokens for user:', user.id);

    const { error } = await supabase
      .from('google_calendar_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: tokens.expires_at,
        scope: tokens.scope,
      });

    if (error) {
      console.error('Error saving tokens to database:', error);
      throw error;
    }

    console.log('Tokens saved successfully');
  }

  async getStoredTokens(): Promise<CalendarToken | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found when getting stored tokens');
      return null;
    }

    console.log('Fetching stored tokens for user:', user.id);

    try {
      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.log('Error fetching stored tokens:', error);
        return null;
      }

      if (!data) {
        console.log('No stored tokens found');
        return null;
      }

      console.log('Stored tokens found successfully');
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        scope: data.scope,
      };
    } catch (error) {
      console.error('Unexpected error getting stored tokens:', error);
      return null;
    }
  }

  async refreshTokens(refreshToken: string): Promise<CalendarToken> {
    console.log('Refreshing access token...');
    
    const config = googleAuthManager.getOAuthConfig();
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token refresh failed:', errorData);
      throw new Error('Failed to refresh tokens');
    }

    const data = await response.json();
    console.log('Token refresh successful');
    
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

    const newTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken, // Google nem sempre retorna um novo refresh_token
      expires_at: expiresAt,
      scope: data.scope,
    };

    await this.saveTokens(newTokens);
    return newTokens;
  }

  async getValidAccessToken(): Promise<string | null> {
    console.log('Getting valid access token...');
    const tokens = await this.getStoredTokens();
    if (!tokens) {
      console.log('No stored tokens available');
      return null;
    }

    const now = new Date();
    const expiresAt = new Date(tokens.expires_at);
    
    // Adiciona margem de 5 minutos para evitar expiração durante o uso
    const expirationBuffer = new Date(expiresAt.getTime() - 5 * 60 * 1000);

    if (now >= expirationBuffer && tokens.refresh_token) {
      console.log('Token expired or expiring soon, refreshing...');
      try {
        const refreshedTokens = await this.refreshTokens(tokens.refresh_token);
        return refreshedTokens.access_token;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // Se falhar ao renovar, retorna null para forçar nova autenticação
        return null;
      }
    }

    console.log('Using existing valid token');
    return tokens.access_token;
  }

  async deleteConnection(): Promise<void> {
    console.log('Deleting Google Calendar connection...');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      // Abordagem manual: deletar na ordem correta para evitar violação de chave estrangeira
      
      // 1. Primeiro, buscar os IDs dos calendários do usuário
      console.log('🔍 Buscando calendários do usuário...');
      const { data: userCalendars, error: calendarsError } = await supabase
        .from('user_calendars')
        .select('id')
        .eq('user_id', user.id);

      if (calendarsError) {
        console.error('Error fetching user calendars:', calendarsError);
        throw new Error(`Erro ao buscar calendários: ${calendarsError.message}`);
      }

      if (!userCalendars || userCalendars.length === 0) {
        console.log('No calendars found for user');
        return;
      }

      const calendarIds = userCalendars.map(cal => cal.id);
      console.log('📋 IDs dos calendários encontrados:', calendarIds);

      // 2. Deletar os logs de sincronização relacionados
      console.log('📝 Deletando logs de sincronização...');
      const { error: logsError } = await supabase
        .from('calendar_sync_logs')
        .delete()
        .in('user_calendar_id', calendarIds);

      if (logsError) {
        console.error('Error deleting sync logs:', logsError);
        throw new Error(`Erro ao deletar logs de sincronização: ${logsError.message}`);
      }

      console.log('✅ Logs de sincronização deletados');

      // 3. Deletar os calendários do usuário
      console.log('📅 Deletando calendários...');
      const { error: calendarsDeleteError } = await supabase
        .from('user_calendars')
        .delete()
        .eq('user_id', user.id);

      if (calendarsDeleteError) {
        console.error('Error deleting calendars:', calendarsDeleteError);
        throw new Error(`Erro ao deletar calendários: ${calendarsDeleteError.message}`);
      }

      console.log('✅ Calendários deletados');

      // 4. Deletar os tokens do usuário
      console.log('🔑 Deletando tokens...');
      const { error: tokensError } = await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', user.id);

      if (tokensError) {
        console.error('Error deleting tokens:', tokensError);
        throw new Error(`Erro ao deletar tokens: ${tokensError.message}`);
      }

      console.log('✅ Tokens deletados');
      console.log('🎉 Google Calendar connection deleted successfully');
    } catch (error) {
      console.error('Error deleting connection:', error);
      throw error;
    }
  }
}

export const googleTokenManager = new GoogleTokenManager();
