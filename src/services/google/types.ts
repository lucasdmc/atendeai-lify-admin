
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

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  scopes: string;
  redirectUri: string;
}
