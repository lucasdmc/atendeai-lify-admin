import { supabase } from '@/integrations/supabase/client';
import { CalendarToken } from './types';
import { googleAuthManager } from './auth';

export class GoogleTokenManager {
  async exchangeCodeForTokens(code: string): Promise<CalendarToken> {
    console.log('=== TOKEN EXCHANGE PROCESS ===');
    console.log('Exchanging authorization code for tokens via Edge Function...');
    
    const config = googleAuthManager.getOAuthConfig();
    console.log('Using redirect URI for token exchange:', config.redirectUri);
    
    // Obter o usuário atual e sessão
    const { data: { user } } = await supabase.auth.getUser();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    if (!session) {
      throw new Error('No active session found');
    }
    
    console.log('User authenticated:', user.email);
    console.log('Session token present:', !!session.access_token);
    
    // Usar fetch diretamente para garantir que o payload seja enviado corretamente
    const response = await fetch('https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/google-user-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw',
      },
      body: JSON.stringify({
        action: 'complete-auth',
        code: code,
        redirect_uri: config.redirectUri
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (!response.ok) {
      console.error('Token exchange failed via Edge Function');
      throw new Error(`Failed to exchange code for tokens: ${response.status} - ${responseText}`);
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (!data || !data.tokens) {
      console.error('No tokens received from Edge Function');
      throw new Error('No tokens received from server');
    }

    console.log('Token exchange successful via Edge Function');
    console.log('Received token data keys:', Object.keys(data.tokens));
    
    const tokens = {
      access_token: data.tokens.access_token,
      refresh_token: data.tokens.refresh_token,
      expires_at: data.tokens.expires_at,
      scope: data.tokens.scope,
    };
    
    console.log('=== END TOKEN EXCHANGE ===');
    return tokens;
  }

  async saveTokens(tokens: CalendarToken): Promise<void> {
    console.log('Saving tokens to database...');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found when saving tokens');
      throw new Error('User not authenticated');
    }

    console.log('Saving tokens for user:', user.id);

    const { error } = await (supabase as any)
      .from('google_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
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
      const { data, error } = await (supabase as any)
        .from('google_tokens')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

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
      refresh_token: refreshToken,
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

    if (now >= expiresAt && tokens.refresh_token) {
      console.log('Token expired, refreshing...');
      const refreshedTokens = await this.refreshTokens(tokens.refresh_token);
      return refreshedTokens.access_token;
    }

    console.log('Using existing valid token');
    return tokens.access_token;
  }

  async deleteConnection(): Promise<void> {
    console.log('Deleting Google Calendar connection...');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await (supabase as any)
      .from('google_tokens')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;

    await supabase
      .from('calendar_events')
      .delete()
      .eq('user_id', user.id);

    console.log('Google Calendar connection deleted successfully');
  }
}

export const googleTokenManager = new GoogleTokenManager();
