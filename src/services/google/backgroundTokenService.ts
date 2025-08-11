import { googleTokenManager } from './tokens';

class BackgroundTokenService {
  private refreshInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private readonly REFRESH_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutos

  async start() {
    if (this.isRunning) {
      console.log('BackgroundTokenService já está rodando');
      return;
    }

    console.log('🚀 Iniciando BackgroundTokenService para renovação automática de tokens');
    this.isRunning = true;

    // Verificação inicial
    await this.checkAndRefreshTokens();

    // Configurar verificação periódica
    this.refreshInterval = setInterval(async () => {
      await this.checkAndRefreshTokens();
    }, this.REFRESH_CHECK_INTERVAL);

    console.log(`✅ BackgroundTokenService iniciado com verificação a cada ${this.REFRESH_CHECK_INTERVAL / 1000 / 60} minutos`);
  }

  async stop() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    this.isRunning = false;
    console.log('🛑 BackgroundTokenService parado');
  }

  private async checkAndRefreshTokens() {
    try {
      console.log('🔄 Verificando tokens para renovação automática...');
      
      const status = await googleTokenManager.getSessionStatus();
      
      if (!status.isConnected) {
        console.log('ℹ️ Nenhuma sessão ativa para verificar');
        return;
      }

      if (status.needsReauth) {
        console.log('⚠️ Sessão precisa de reautenticação manual');
        return;
      }

      if (status.expiresAt) {
        const now = new Date();
        const expiresAt = new Date(status.expiresAt);
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        
        // Renovar se expirar em menos de 15 minutos
        if (timeUntilExpiry < 15 * 60 * 1000) {
          console.log(`🔄 Token expira em ${Math.floor(timeUntilExpiry / 1000 / 60)} minutos, renovando...`);
          
          try {
            const tokens = await googleTokenManager.getStoredTokens();
            if (tokens?.refresh_token) {
              await googleTokenManager.refreshTokens(tokens.refresh_token);
              console.log('✅ Token renovado com sucesso');
            }
          } catch (error) {
            console.error('❌ Erro ao renovar token automaticamente:', error);
          }
        } else {
          console.log(`ℹ️ Token ainda válido por ${Math.floor(timeUntilExpiry / 1000 / 60)} minutos`);
        }
      }
    } catch (error) {
      console.error('❌ Erro na verificação automática de tokens:', error);
    }
  }

  async forceRefresh() {
    console.log('🔄 Forçando renovação de tokens...');
    await this.checkAndRefreshTokens();
  }

  isActive(): boolean {
    return this.isRunning;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheck: this.refreshInterval ? 'Ativo' : 'Inativo',
      checkInterval: this.REFRESH_CHECK_INTERVAL / 1000 / 60
    };
  }
}

export const backgroundTokenService = new BackgroundTokenService();

// Iniciar automaticamente quando o módulo for carregado
if (typeof window !== 'undefined') {
  // Apenas no browser
  window.addEventListener('focus', () => {
    if (!backgroundTokenService.isActive()) {
      backgroundTokenService.start();
    }
  });

  // Iniciar quando a página carregar
  if (document.readyState === 'complete') {
    backgroundTokenService.start();
  } else {
    window.addEventListener('load', () => {
      backgroundTokenService.start();
    });
  }
}
