
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
  // Usar 'primary' como calendário padrão da service account
  private readonly calendarId = 'primary';
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  private async getServiceAccountCredentials(): Promise<ServiceAccountCredentials> {
    try {
      console.log('Getting service account credentials...');
      const { data, error } = await supabase.functions.invoke('google-service-auth', {
        body: { action: 'get-credentials' }
      });

      if (error) {
        console.error('Failed to get service account credentials:', error);
        throw new Error(`Failed to get service account credentials: ${error.message}`);
      }

      if (!data?.credentials) {
        throw new Error('No credentials returned from service');
      }

      console.log('Service account credentials obtained successfully');
      return data.credentials;
    } catch (error) {
      console.error('Error getting service account credentials:', error);
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      console.log('Using cached access token');
      return this.accessToken;
    }

    try {
      console.log('Getting new access token for service account...');
      
      const { data, error } = await supabase.functions.invoke('google-service-auth', {
        body: { action: 'get-access-token' }
      });

      if (error) {
        console.error('Failed to get access token:', error);
        throw new Error(`Failed to authenticate service account: ${error.message}`);
      }

      if (!data?.access_token) {
        throw new Error('No access token returned from service');
      }

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + ((data.expires_in - 60) * 1000); // Subtract 60 seconds for safety

      console.log('Access token obtained successfully, expires in:', data.expires_in, 'seconds');
      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      console.log('Checking Google Service Account connection...');
      
      // First, try to get access token
      const accessToken = await this.getAccessToken();
      
      // Test the connection by trying to fetch calendar list
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendar/list',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to access calendar list:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return false;
      }
      
      const data = await response.json();
      console.log('Successfully connected to Google Calendar service');
      console.log('Available calendars:', data.items?.length || 0);
      
      // Log calendar information for debugging
      if (data.items && data.items.length > 0) {
        data.items.forEach((cal: any) => {
          console.log(`Calendar: ${cal.summary} (${cal.id}) - Access: ${cal.accessRole}`);
        });
      }
      
      return true;
    } catch (error) {
      console.error('Service account connection check failed:', error);
      return false;
    }
  }

  async fetchCalendarEvents(timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
    console.log('Fetching calendar events from primary calendar...');
    
    try {
      const accessToken = await this.getAccessToken();
      
      // Set default time range if not provided (current week)
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const defaultTimeMin = timeMin || startOfWeek.toISOString();
      const defaultTimeMax = timeMax || endOfWeek.toISOString();
      
      const params = new URLSearchParams({
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '100',
        timeMin: defaultTimeMin,
        timeMax: defaultTimeMax,
      });

      const url = `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events?${params.toString()}`;
      console.log('Fetching events from URL:', url);
      console.log('Time range:', { timeMin: defaultTimeMin, timeMax: defaultTimeMax });

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
          error: errorData,
          calendarId: this.calendarId
        });
        
        if (response.status === 404) {
          console.log('Calendar not found - this might be expected for service accounts');
          return [];
        }
        
        throw new Error(`Failed to fetch calendar events: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data);
      console.log('Total events from API:', data.items?.length || 0);
      
      // Filter out events without dateTime (all-day events) and log what we're filtering
      const allEvents = data.items || [];
      const filteredEvents = allEvents.filter((event: any) => {
        const hasDateTime = event.start?.dateTime && event.end?.dateTime;
        if (!hasDateTime) {
          console.log('Filtering out event without dateTime:', event.summary);
        }
        return hasDateTime;
      });
      
      console.log('Events after filtering:', filteredEvents.length);
      console.log('Filtered events:', filteredEvents.map((e: any) => ({
        id: e.id,
        summary: e.summary,
        start: e.start?.dateTime
      })));
      
      return filteredEvents;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async createCalendarEvent(event: Omit<GoogleCalendarEvent, 'id' | 'status'>): Promise<GoogleCalendarEvent> {
    console.log('Creating calendar event in primary calendar:', event);
    
    try {
      const accessToken = await this.getAccessToken();

      // Ensure the event has proper timezone info
      const eventData = {
        ...event,
        start: {
          ...event.start,
          timeZone: event.start.timeZone || 'America/Sao_Paulo'
        },
        end: {
          ...event.end,
          timeZone: event.end.timeZone || 'America/Sao_Paulo'
        },
        status: 'confirmed'
      };

      console.log('Sending event data to Google Calendar:', eventData);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to create calendar event:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          calendarId: this.calendarId
        });
        throw new Error(`Failed to create calendar event: ${response.status} - ${errorData}`);
      }

      const createdEvent = await response.json();
      console.log('Event created successfully in Google Calendar:', createdEvent.id);
      console.log('Created event details:', createdEvent);
      return createdEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async updateCalendarEvent(eventId: string, event: Omit<GoogleCalendarEvent, 'id' | 'status'>): Promise<GoogleCalendarEvent> {
    console.log('Updating calendar event:', eventId, event);
    
    try {
      const accessToken = await this.getAccessToken();

      // Ensure the event has proper timezone info
      const eventData = {
        ...event,
        start: {
          ...event.start,
          timeZone: event.start.timeZone || 'America/Sao_Paulo'
        },
        end: {
          ...event.end,
          timeZone: event.end.timeZone || 'America/Sao_Paulo'
        },
        status: 'confirmed'
      };

      console.log('Sending updated event data to Google Calendar:', eventData);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to update calendar event:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          calendarId: this.calendarId
        });
        throw new Error(`Failed to update calendar event: ${response.status} - ${errorData}`);
      }

      const updatedEvent = await response.json();
      console.log('Event updated successfully in Google Calendar:', updatedEvent.id);
      return updatedEvent;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteCalendarEvent(eventId: string): Promise<void> {
    console.log('Deleting calendar event:', eventId);
    
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to delete calendar event:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          calendarId: this.calendarId
        });
        throw new Error(`Failed to delete calendar event: ${response.status} - ${errorData}`);
      }

      console.log('Event deleted successfully from Google Calendar:', eventId);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  getCalendarId(): string {
    return this.calendarId;
  }
}

export const googleServiceAccountService = new GoogleServiceAccountService();
