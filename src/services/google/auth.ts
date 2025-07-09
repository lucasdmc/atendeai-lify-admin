import { GoogleOAuthConfig } from './types';
import { config } from '@/config/environment';

export class GoogleAuthManager {
  private getRedirectUri(): string {
    return config.urls.redirectUri;
  }

  private getAuthUrl(): string {
    const redirectUri = this.getRedirectUri();
    
    const state = btoa(JSON.stringify({
      timestamp: Date.now(),
      origin: window.location.origin,
      path: '/agendamentos',
      redirectUri: redirectUri
    }));

    const params = new URLSearchParams({
      client_id: config.google.clientId,
      redirect_uri: redirectUri,
      scope: config.google.scopes,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: state,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return authUrl;
  }

  async initiateAuth(): Promise<void> {
    try {
      const currentUrl = window.location.href;
      
      if (!currentUrl.includes('/agendamentos')) {
        console.warn('Not on agendamentos page, but proceeding with OAuth...');
      }
      
      const authUrl = this.getAuthUrl();
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('Error in initiateAuth:', error);
      throw error;
    }
  }

  getOAuthConfig(): GoogleOAuthConfig {
    return {
      clientId: config.google.clientId,
      clientSecret: '', // Client secret não deve estar no frontend por segurança
      scopes: config.google.scopes,
      redirectUri: this.getRedirectUri(),
    };
  }
}

export const googleAuthManager = new GoogleAuthManager();
