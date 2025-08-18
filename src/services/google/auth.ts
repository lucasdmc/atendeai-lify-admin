import { GoogleOAuthConfig } from './types';
import { config } from '@/config/frontend-config';
import apiClient from '@/services/apiClient';

export class GoogleAuthManager {
  private getRedirectUri(): string {
    return config.urls.redirectUri;
  }

  async initiateAuth(clinicId: string): Promise<void> {
    const resp = await apiClient.post<{ url: string }>(`/api/google/oauth/start`, { clinicId });
    if (!resp.success || !resp.data) {
      throw new Error(resp.error || 'Falha ao iniciar OAuth');
    }
    const { url } = resp.data as any;
    window.location.href = url;
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
