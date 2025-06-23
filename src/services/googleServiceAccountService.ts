
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
    // Get credentials from Supabase secrets via edge function
    const { data, error } = await supabase.functions.invoke('google-service-auth', {
      body: { action: 'get-credentials' }
    });

    if (error) {
      console.error('Failed to get service account credentials:', error);
      throw new Error('Failed to get service account credentials');
    }

    return data.credentials;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    console.log('Getting new access token for service account...');
    
    // Use the edge function to handle JWT creation and token exchange
    const { data, error } = await supabase.functions.invoke('google-service-auth', {
      body: { action: 'get-access-token' }
    });

    if (error) {
      console.error('Failed to get access token:', error);
      throw new Error('Failed to authenticate service account');
    }

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    console.log('Access token obtained successfully');
    return this.accessToken;
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
        maxResults: '50', // Limit to avoid too many results
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
        
        if (response.status === 404) {
          console.log('Calendar not found, returning empty events list');
          return [];
        }
        
        throw new Error(`Failed to fetch calendar events: ${response.status}`);
      }

      const data = await response.json();
      console.log('Events fetched successfully, count:', data.items?.length || 0);
      
      // Filter out events without dateTime (all-day events)
      const events = (data.items || []).filter((event: any) => 
        event.start?.dateTime && event.end?.dateTime
      );
      
      console.log('Filtered events with dateTime:', events.length);
      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async createCalendarEvent(event: Omit<GoogleCalendarEvent, 'id' | 'status'>): Promise<GoogleCalendarEvent> {
    console.log('Creating calendar event...', event);
    
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
          body: JSON.stringify({
            ...event,
            status: 'confirmed'
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to create calendar event:', errorData);
        throw new Error(`Failed to create calendar event: ${response.status}`);
      }

      const createdEvent = await response.json();
      console.log('Event created successfully:', createdEvent.id);
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

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.calendarId)}/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...event,
            status: 'confirmed'
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to update calendar event:', errorData);
        throw new Error(`Failed to update calendar event: ${response.status}`);
      }

      const updatedEvent = await response.json();
      console.log('Event updated successfully:', updatedEvent.id);
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
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.calendarId)}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to delete calendar event:', errorData);
        throw new Error(`Failed to delete calendar event: ${response.status}`);
      }

      console.log('Event deleted successfully:', eventId);
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
