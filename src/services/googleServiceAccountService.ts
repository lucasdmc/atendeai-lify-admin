
import { supabase } from '@/integrations/supabase/client';

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

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

class GoogleServiceAccountService {
  private readonly calendarId = 'lify-calendar-service@lify-chatbot-v0.iam.gserviceaccount.com';
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  private async getServiceAccountCredentials(): Promise<ServiceAccountCredentials> {
    const credentials = {
      "type": "service_account",
      "project_id": "lify-chatbot-v0",
      "private_key_id": "545154e8e5e90bb0d216ffdc9d2039ae7f52acd9",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC8yFzqoQJKP7wH\n0QrUzGxVfE5J8nQwQkK7L3pF1mN9xPKdW6sR4fJ8tV2nE3mH5lP9dR7qS8zX4nO1\n6yV3kT2pM4fG8hJ9xW1nL5rE6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO1\n6yV3kT2pM4fG8hJ9xW1nL5rE6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO1\n6yV3kT2pM4fG8hJ9xW1nL5rE6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO1\n6yV3kT2pM4fG8hJ9xW1nL5rE6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO1\n6yV3kT2pM4fG8hJ9xW1nL5rE6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO1\n6yV3kT2pM4fG8hJ9xW1nL5rE6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO1\nAgMBAAECggEAK8fJ9xW1nL5rE6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO1\n6yV3kT2pM4fG8hJ9xW1nL5rE6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO1\n6yV3kT2pM4fG8hJ9xW1nL5rE6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO1\n6yV3kT2pM4fG8hJ9xW1nL5rE6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO1\n6yV3kT2pM4fG8hJ9xW1nL5rE6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO1\n6yV3kT2pM4fG8hJ9xW1nL5rE6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO1\n6yV3kT2pM4fG8hJ9xW1nL5rE6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO1\nQKBgQDpK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO16yV3kT2pM4fG8hJ9xW1nL5rE\n6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO16yV3kT2pM4fG8hJ9xW1nL5rE\n6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO16yV3kT2pM4fG8hJ9xW1nL5rE\nQKBgQDOK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO16yV3kT2pM4fG8hJ9xW1nL5rE\n6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO16yV3kT2pM4fG8hJ9xW1nL5rE\n6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO16yV3kT2pM4fG8hJ9xW1nL5rE\nwKBgFnP1dR7qS8zX4nO16yV3kT2pM4fG8hJ9xW1nL5rE6qP3sD9fK2mH8tV7nR4q\nS6zX9nP1dR7qS8zX4nO16yV3kT2pM4fG8hJ9xW1nL5rE6qP3sD9fK2mH8tV7nR4q\nS6zX9nP1dR7qS8zX4nO16yV3kT2pM4fG8hJ9xW1nL5rE6qP3sD9fK2mH8tV7nR4q\nAoGAK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO16yV3kT2pM4fG8hJ9xW1nL5rE6qP3\nsD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO16yV3kT2pM4fG8hJ9xW1nL5rE6qP3\nsD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO16yV3kT2pM4fG8hJ9xW1nL5rE6qP3\nAoGBAJxW1nL5rE6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO16yV3kT2pM4\nfG8hJ9xW1nL5rE6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO16yV3kT2pM4\nfG8hJ9xW1nL5rE6qP3sD9fK2mH8tV7nR4qS6zX9nP1dR7qS8zX4nO16yV3kT2pM4\n-----END PRIVATE KEY-----\n",
      "client_email": "lify-calendar-service@lify-chatbot-v0.iam.gserviceaccount.com",
      "client_id": "115670288875875320758",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/lify-calendar-service%40lify-chatbot-v0.iam.gserviceaccount.com"
    };
    
    return credentials;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    console.log('Getting new access token for service account...');
    const credentials = await this.getServiceAccountCredentials();
    
    // Create JWT assertion
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/calendar',
      aud: credentials.token_uri,
      exp: now + 3600,
      iat: now,
    };

    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    // For simplicity, we'll use the Google OAuth endpoint directly
    // In production, you'd want to implement proper JWT signing
    const assertion = await this.createJWT(header, payload, credentials.private_key);

    const response = await fetch(credentials.token_uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: assertion,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to get access token:', error);
      throw new Error('Failed to authenticate service account');
    }

    const tokenData = await response.json();
    this.accessToken = tokenData.access_token;
    this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);

    console.log('Access token obtained successfully');
    return this.accessToken;
  }

  private async createJWT(header: any, payload: any, privateKey: string): Promise<string> {
    // This is a simplified implementation
    // In production, use a proper JWT library
    const headerEncoded = btoa(JSON.stringify(header));
    const payloadEncoded = btoa(JSON.stringify(payload));
    
    // For now, we'll make a call to our edge function to handle JWT signing
    const { data, error } = await supabase.functions.invoke('google-service-auth', {
      body: { header, payload, privateKey }
    });

    if (error) {
      throw new Error('Failed to create JWT');
    }

    return data.jwt;
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error('Service account not properly configured:', error);
      return false;
    }
  }

  async fetchCalendarEvents(timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
    console.log('Fetching calendar events from service account...');
    
    try {
      const accessToken = await this.getAccessToken();
      
      const params = new URLSearchParams({
        singleEvents: 'true',
        orderBy: 'startTime',
        ...(timeMin && { timeMin }),
        ...(timeMax && { timeMax }),
      });

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.calendarId)}/events?${params.toString()}`;
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
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async createCalendarEvent(event: Omit<GoogleCalendarEvent, 'id' | 'status'>): Promise<GoogleCalendarEvent> {
    console.log('Creating calendar event...');
    
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.calendarId)}/events`,
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
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  getCalendarId(): string {
    return this.calendarId;
  }
}

export const googleServiceAccountService = new GoogleServiceAccountService();
