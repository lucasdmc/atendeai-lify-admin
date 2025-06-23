
import { GoogleOAuthConfig } from './types';

const GOOGLE_CLIENT_ID = '367439444210-2p0lde4fmerq4jlraojguku3dt3l5d70.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

export class GoogleAuthManager {
  private getRedirectUri(): string {
    const currentOrigin = window.location.origin;
    const redirectPath = '/agendamentos';
    
    console.log('=== REDIRECT URI DEBUG ===');
    console.log('Current origin:', currentOrigin);
    console.log('Full URL:', window.location.href);
    console.log('Protocol:', window.location.protocol);
    console.log('Host:', window.location.host);
    
    const redirectUri = `${currentOrigin}${redirectPath}`;
    console.log('Final redirect URI:', redirectUri);
    console.log('=== END REDIRECT URI DEBUG ===');
    
    return redirectUri;
  }

  private getAuthUrl(): string {
    console.log('=== GOOGLE OAUTH CONFIGURATION DEBUG ===');
    
    const redirectUri = this.getRedirectUri();
    
    console.log('Google Client ID:', GOOGLE_CLIENT_ID);
    console.log('Redirect URI:', redirectUri);
    console.log('Scopes:', SCOPES);
    
    const state = btoa(JSON.stringify({
      timestamp: Date.now(),
      origin: window.location.origin,
      path: '/agendamentos',
      redirectUri: redirectUri
    }));

    console.log('Generated state parameter:', state);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: SCOPES,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: state,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log('Complete OAuth URL:', authUrl);
    
    console.log('URL Parameters breakdown:');
    params.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    console.log('=== END DEBUG ===');
    
    return authUrl;
  }

  async initiateAuth(): Promise<void> {
    try {
      console.log('=== STARTING GOOGLE OAUTH FLOW ===');
      
      const currentUrl = window.location.href;
      console.log('Current page URL:', currentUrl);
      
      if (!currentUrl.includes('/agendamentos')) {
        console.warn('Not on agendamentos page, but proceeding with OAuth...');
      }
      
      const authUrl = this.getAuthUrl();
      console.log('Initiating OAuth flow...');
      console.log('Redirecting to Google OAuth URL...');
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('Performing redirect to:', authUrl);
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('Error in initiateAuth:', error);
      throw error;
    }
  }

  getOAuthConfig(): GoogleOAuthConfig {
    return {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      scopes: SCOPES,
      redirectUri: this.getRedirectUri(),
    };
  }
}

export const googleAuthManager = new GoogleAuthManager();
