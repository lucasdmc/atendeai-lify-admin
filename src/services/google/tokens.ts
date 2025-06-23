
import { supabase } from '@/integrations/supabase/client';
import { CalendarToken } from './types';
import { googleAuthManager } from './auth';

export class GoogleTokenManager {
  async exchangeCodeForTokens(code: string): Promise<CalendarToken> {
    console.log('=== TOKEN EXCHANGE PROCESS ===');
    console.log('Exchanging authorization code for tokens...');
    
    const config = googleAuthManager.getOAuthConfig();
    console.log('Using redirect URI for token exchange:', config.redirectUri);
    
    const requestBody = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    });

    console.log('Token exchange request details:', {
      client_id: config.clientId,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
      code_length: code.length,
      code_preview: code.substring(0, 20) + '...'
    });
    
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody,
      });

      console.log('Token exchange response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Token exchange failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`Failed to exchange code for tokens: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      console.log('Token exchange successful');
      console.log('Received token data keys:', Object.keys(data));
      
      const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

      const tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: expiresAt,
        scope: data.scope,
      };
      
      console.log('=== END TOKEN EXCHANGE ===');
      return tokens;
    } catch (error) {
      console.error('Token exchange error:', error);
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
        refresh_token: tokens.refresh_token,
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

    const { error } = await supabase
      .from('google_calendar_tokens')
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
