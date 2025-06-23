
import { supabase } from '@/integrations/supabase/client';

const GOOGLE_CLIENT_ID = '367439444210-inbslmqpfc8l3kj10nh36f67g5hnq1be.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
const REDIRECT_URI = `${window.location.origin}/agendamentos`;
const SCOPES = 'https://www.googleapis.com/auth/calendar';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  status: string;
}

export interface CalendarToken {
  access_token: string;
  refresh_token?: string;
  expires_at: string;
  scope: string;
}

class GoogleCalendarService {
  private getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async initiateAuth(): Promise<void> {
    const authUrl = this.getAuthUrl();
    window.location.href = authUrl;
  }

  async exchangeCodeForTokens(code: string): Promise<CalendarToken> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: expiresAt,
      scope: data.scope,
    };
  }

  async saveTokens(tokens: CalendarToken): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('google_calendar_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at,
        scope: tokens.scope,
      });

    if (error) throw error;
  }

  async getStoredTokens(): Promise<CalendarToken | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return null;

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      scope: data.scope,
    };
  }

  async refreshTokens(refreshToken: string): Promise<CalendarToken> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh tokens');
    }

    const data = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

    const newTokens = {
      access_token: data.access_token,
      refresh_token: refreshToken, // Keep the original refresh token
      expires_at: expiresAt,
      scope: data.scope,
    };

    await this.saveTokens(newTokens);
    return newTokens;
  }

  async getValidAccessToken(): Promise<string | null> {
    const tokens = await this.getStoredTokens();
    if (!tokens) return null;

    const now = new Date();
    const expiresAt = new Date(tokens.expires_at);

    if (now >= expiresAt && tokens.refresh_token) {
      const refreshedTokens = await this.refreshTokens(tokens.refresh_token);
      return refreshedTokens.access_token;
    }

    return tokens.access_token;
  }

  async fetchCalendarEvents(timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
    const accessToken = await this.getValidAccessToken();
    if (!accessToken) throw new Error('No valid access token');

    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      ...(timeMin && { timeMin }),
      ...(timeMax && { timeMax }),
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const data = await response.json();
    return data.items || [];
  }

  async createCalendarEvent(event: Omit<GoogleCalendarEvent, 'id' | 'status'>): Promise<GoogleCalendarEvent> {
    const accessToken = await this.getValidAccessToken();
    if (!accessToken) throw new Error('No valid access token');

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create calendar event');
    }

    return await response.json();
  }

  async deleteConnection(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('google_calendar_tokens')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;

    // Also clear cached events
    await supabase
      .from('calendar_events')
      .delete()
      .eq('user_id', user.id);
  }
}

export const googleCalendarService = new GoogleCalendarService();
