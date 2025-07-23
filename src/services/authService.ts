import apiClient from './apiClient';
import { supabase } from '@/integrations/supabase/client';

// Interfaces
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: string;
  clinicId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin_lify' | 'suporte_lify' | 'admin' | 'gestor' | 'atendente';
  status: boolean;
  created_at: string;
  clinicId?: string;
  clinics?: {
    name: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface PasswordResetData {
  email: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailData {
  token: string;
}

class AuthService {
  /**
   * Login do usuário
   */
  async login(loginData: LoginData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('🔐 Fazendo login via novo backend...');
      
      const response = await apiClient.post<AuthResponse>('/api/auth/login', loginData);
      
      if (!response.success) {
        console.error('❌ Erro no login:', response.error);
        return { success: false, error: response.error };
      }

      // Salvar tokens no Supabase para compatibilidade
      if (response.data) {
        await this.saveTokens(response.data.token, response.data.refreshToken);
      }

      console.log('✅ Login realizado com sucesso:', response.data?.user);
      return { success: true, user: response.data?.user };
    } catch (error) {
      console.error('❌ Erro ao fazer login:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Registro de usuário
   */
  async register(registerData: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('📝 Registrando usuário via novo backend...');
      
      const response = await apiClient.post<AuthResponse>('/api/auth/register', registerData);
      
      if (!response.success) {
        console.error('❌ Erro no registro:', response.error);
        return { success: false, error: response.error };
      }

      // Salvar tokens no Supabase para compatibilidade
      if (response.data) {
        await this.saveTokens(response.data.token, response.data.refreshToken);
      }

      console.log('✅ Usuário registrado com sucesso:', response.data?.user);
      return { success: true, user: response.data?.user };
    } catch (error) {
      console.error('❌ Erro ao registrar usuário:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Logout do usuário
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚪 Fazendo logout...');
      
      // Chamar logout no backend
      const response = await apiClient.post('/api/auth/logout');
      
      // Limpar sessão do Supabase
      await supabase.auth.signOut();
      
      console.log('✅ Logout realizado com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Refresh do token
   */
  async refreshToken(): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      console.log('🔄 Renovando token...');
      
      const response = await apiClient.post<{ token: string; refreshToken: string }>('/api/auth/refresh');
      
      if (!response.success) {
        console.error('❌ Erro ao renovar token:', response.error);
        return { success: false, error: response.error };
      }

      // Salvar novos tokens
      if (response.data) {
        await this.saveTokens(response.data.token, response.data.refreshToken);
      }

      console.log('✅ Token renovado com sucesso');
      return { success: true, token: response.data?.token };
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Reset de senha
   */
  async resetPassword(resetData: PasswordResetData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔑 Solicitando reset de senha...');
      
      const response = await apiClient.post('/api/auth/reset-password', resetData);
      
      if (!response.success) {
        console.error('❌ Erro ao solicitar reset:', response.error);
        return { success: false, error: response.error };
      }

      console.log('✅ Email de reset enviado com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao solicitar reset de senha:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Alterar senha
   */
  async changePassword(changeData: ChangePasswordData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Alterando senha...');
      
      const response = await apiClient.post('/api/auth/change-password', changeData);
      
      if (!response.success) {
        console.error('❌ Erro ao alterar senha:', response.error);
        return { success: false, error: response.error };
      }

      console.log('✅ Senha alterada com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao alterar senha:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Verificar email
   */
  async verifyEmail(verifyData: VerifyEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Verificando email...');
      
      const response = await apiClient.post('/api/auth/verify-email', verifyData);
      
      if (!response.success) {
        console.error('❌ Erro ao verificar email:', response.error);
        return { success: false, error: response.error };
      }

      console.log('✅ Email verificado com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao verificar email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Obter usuário atual
   */
  async getCurrentUser(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('👤 Obtendo usuário atual...');
      
      const response = await apiClient.get<User>('/api/auth/me');
      
      if (!response.success) {
        console.error('❌ Erro ao obter usuário:', response.error);
        return { success: false, error: response.error };
      }

      console.log('✅ Usuário obtido com sucesso:', response.data);
      return { success: true, user: response.data };
    } catch (error) {
      console.error('❌ Erro ao obter usuário atual:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Verificar se está autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.warn('⚠️ Erro ao verificar autenticação:', error);
      return false;
    }
  }

  /**
   * Salvar tokens no Supabase para compatibilidade
   */
  private async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      // Criar sessão no Supabase com os tokens do novo backend
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.warn('⚠️ Erro ao salvar tokens no Supabase:', error);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao salvar tokens:', error);
    }
  }

  /**
   * Verificar se o backend está funcionando
   */
  async checkBackendHealth(): Promise<boolean> {
    try {
      return await apiClient.healthCheck();
    } catch (error) {
      console.error('❌ Backend não está disponível:', error);
      return false;
    }
  }
}

export default new AuthService();
export { AuthService };
export type { LoginData, RegisterData, User, AuthResponse, PasswordResetData, ChangePasswordData, VerifyEmailData }; 