import { supabase } from '@/integrations/supabase/client';

const GOOGLE_CLIENT_ID = '367439444210-2p0lde4fmerq4jlraojguku3dt3l5d70.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
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
    console.log('=== GOOGLE OAUTH CONFIGURATION DEBUG ===');
    
    const currentUrl = window.location.origin;
    const redirectUri = `${currentUrl}/agendamentos`;
    
    console.log('Current URL origin:', currentUrl);
    console.log('Redirect URI:', redirectUri);
    console.log('Google Client ID:', GOOGLE_CLIENT_ID);
    
    // Generate a proper state parameter to avoid the OAuth state parameter missing error
    const state = btoa(JSON.stringify({
      timestamp: Date.now(),
      origin: currentUrl,
      path: '/agendamentos'
    }));

    console.log('Generated state parameter:', state);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: SCOPES,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: state,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log('Complete OAuth URL:', authUrl);
    console.log('=== END DEBUG ===');
    
    return authUrl;
  }

  async initiateAuth(): Promise<void> {
    try {
      const authUrl = this.getAuthUrl();
      console.log('Iniciating OAuth flow...');
      console.log('Redirecting to:', authUrl);
      
      // Add a small delay to ensure logs are visible
      await new Promise(resolve => setTimeout(resolve, 100));
      
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error in initiateAuth:', error);
      throw error;
    }
  }

  async exchangeCodeForTokens(code: string): Promise<CalendarToken> {
    console.log('Exchanging authorization code for tokens...');
    
    const redirectUri = window.location.origin + '/agendamentos';
    console.log('Using redirect URI for token exchange:', redirectUri);
    
    const requestBody = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    console.log('Token exchange request body:', {
      client_id: GOOGLE_CLIENT_ID,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code: code.substring(0, 10) + '...' // Only log first 10 chars for security
    });
    
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
        error: errorData
      });
      throw new Error(`Failed to exchange code for tokens: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    console.log('Token exchange successful, token data received');
    
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: expiresAt,
      scope: data.scope,
    };
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
        .maybeSingle(); // Using maybeSingle instead of single to avoid 406 errors

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
      const errorData = await response.text();
      console.error('Token refresh failed:', errorData);
      throw new Error('Failed to refresh tokens');
    }

    const data = await response.json();
    console.log('Token refresh successful');
    
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

  async fetchCalendarEvents(timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
    console.log('Fetching calendar events...');
    const accessToken = await this.getValidAccessToken();
    if (!accessToken) {
      console.error('No valid access token available for fetching events');
      throw new Error('No valid access token');
    }

    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      ...(timeMin && { timeMin }),
      ...(timeMax && { timeMax }),
    });

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`;
    console.log('Fetching events from:', url);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to fetch calendar events:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error('Failed to fetch calendar events');
    }

    const data = await response.json();
    console.log('Events fetched successfully, count:', data.items?.length || 0);
    return data.items || [];
  }

  async createCalendarEvent(event: Omit<GoogleCalendarEvent, 'id' | 'status'>): Promise<GoogleCalendarEvent> {
    console.log('Creating calendar event...');
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
      const errorData = await response.text();
      console.error('Failed to create calendar event:', errorData);
      throw new Error('Failed to create calendar event');
    }

    const createdEvent = await response.json();
    console.log('Event created successfully:', createdEvent.id);
    return createdEvent;
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

    // Also clear cached events
    await supabase
      .from('calendar_events')
      .delete()
      .eq('user_id', user.id);

    console.log('Google Calendar connection deleted successfully');
  }
}

export const googleCalendarService = new GoogleCalendarService();
