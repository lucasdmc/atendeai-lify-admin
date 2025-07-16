
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
    responseStatus?: string;
  }>;
  status: string;
  colorId?: string;
}

class GoogleServiceAccountService {
  private calendarId = 'fb2b1dfb1e6c600594b05785de5cf04fb38bd0376bd3f5e5d1c08c60d4c894df@group.calendar.google.com';

  getCalendarId(): string {
    return this.calendarId;
  }

  async isConnected(): Promise<boolean> {
    try {
      console.log('Checking service account connection...');
      const credentials = await this.getServiceAccountCredentials();
      
      if (!credentials) {
        console.log('No service account credentials found');
        return false;
      }

      console.log('Service account credentials found, testing calendar access...');
      const accessToken = await this.getAccessToken();
      
      // Test calendar access with the specific calendar ID
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.calendarId)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        console.log('Successfully connected to Google Calendar');
        return true;
      } else {
        const errorText = await response.text();
        console.error('Failed to access calendar:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('Error checking service account connection:', error);
      return false;
    }
  }

  async fetchCalendarEvents(timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
    try {
      const accessToken = await this.getAccessToken();
      
      const params = new URLSearchParams({
        orderBy: 'startTime',
        singleEvents: 'true',
        maxResults: '50',
      });
      
      if (timeMin) params.append('timeMin', timeMin);
      if (timeMax) params.append('timeMax', timeMax);
      
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.calendarId)}/events?${params}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch events: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  async createCalendarEvent(eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>): Promise<GoogleCalendarEvent> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.calendarId)}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create event: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  async updateCalendarEvent(eventId: string, eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>): Promise<GoogleCalendarEvent> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.calendarId)}/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update event: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  async deleteCalendarEvent(eventId: string): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.calendarId)}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete event: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  private async getServiceAccountCredentials(): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('google-service-auth', {
        body: { action: 'get-credentials' }
      });

      if (error) throw error;
      return data.credentials;
    } catch (error) {
      console.error('Error getting service account credentials:', error);
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('google-service-auth', {
        body: { action: 'get-access-token' }
      });

      if (error) throw error;
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }
}

export const googleServiceAccountService = new GoogleServiceAccountService();
