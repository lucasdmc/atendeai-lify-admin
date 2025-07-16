
import { googleAuthManager } from './google/auth';
import { googleTokenManager } from './google/tokens';
import { googleCalendarManager } from './google/calendar';

export type { GoogleCalendarEvent, CalendarToken } from './google/types';

class GoogleCalendarService {
  async initiateAuth(): Promise<void> {
    return googleAuthManager.initiateAuth();
  }

  async exchangeCodeForTokens(code: string) {
    return googleTokenManager.exchangeCodeForTokens(code);
  }

  async saveTokens(tokens: any) {
    return googleTokenManager.saveTokens(tokens);
  }

  async getStoredTokens() {
    return googleTokenManager.getStoredTokens();
  }

  async refreshTokens(refreshToken: string) {
    return googleTokenManager.refreshTokens(refreshToken);
  }

  async getValidAccessToken() {
    return googleTokenManager.getValidAccessToken();
  }

  async fetchCalendarEvents(timeMin?: string, timeMax?: string) {
    return googleCalendarManager.fetchCalendarEvents(timeMin, timeMax);
  }

  async createCalendarEvent(event: any) {
    return googleCalendarManager.createCalendarEvent(event);
  }

  async deleteConnection() {
    return googleTokenManager.deleteConnection();
  }
}

export const googleCalendarService = new GoogleCalendarService();
