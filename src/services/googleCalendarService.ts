
import { googleAuthManager } from '@/services/google/auth';
import { googleTokenManager } from '@/services/google/tokens';
import { googleCalendarManager } from '@/services/google/calendar';

export type { GoogleCalendarEvent, CalendarToken } from './google/types';

class GoogleCalendarService {
  async initiateAuth(clinicId: string): Promise<void> {
    return googleAuthManager.initiateAuth(clinicId);
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

  async validateAndGetToken() {
    return googleTokenManager.validateAndGetToken();
  }

  async isSessionValid() {
    return googleTokenManager.isSessionValid();
  }

  async getSessionStatus() {
    return googleTokenManager.getSessionStatus();
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
