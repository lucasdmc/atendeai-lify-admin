
import { GoogleCalendarEvent } from './types';
import { googleTokenManager } from './tokens';

export class GoogleCalendarManager {
  async fetchCalendarEvents(timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
    console.log('Fetching calendar events...');
    const accessToken = await googleTokenManager.getValidAccessToken();
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
    const accessToken = await googleTokenManager.getValidAccessToken();
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
}

export const googleCalendarManager = new GoogleCalendarManager();
