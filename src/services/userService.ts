import { supabase } from '@/integrations/supabase/client';
import { config } from '@/config/environment';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || config.whatsapp.serverUrl;

export interface CreateUserData {
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

export interface Clinic {
  id: string;
  name: string;
}

class UserService {
  /**
   * Obter token de autenticação do Supabase
   */
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  /**
   * Criar usuário via backend
   */
  async createUser(userData: CreateUserData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      console.log('🔄 Criando usuário via backend...');
      
      const response = await fetch(`${BACKEND_URL}/api/users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erro do backend:', data);
        throw new Error(data.error || 'Erro ao criar usuário');
      }

      console.log('✅ Usuário criado com sucesso:', data.user);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Listar usuários via backend
   */
  async listUsers(): Promise<{ success: boolean; users?: User[]; error?: string }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${BACKEND_URL}/api/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao listar usuários');
      }

      return { success: true, users: data.users };
    } catch (error) {
      console.error('❌ Erro ao listar usuários:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Listar clínicas via backend
   */
  async listClinics(): Promise<{ success: boolean; clinics?: Clinic[]; error?: string }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${BACKEND_URL}/api/clinics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao listar clínicas');
      }

      return { success: true, clinics: data.clinics };
    } catch (error) {
      console.error('❌ Erro ao listar clínicas:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Verificar se o backend está funcionando
   */
  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('❌ Backend não está disponível:', error);
      return false;
    }
  }
}

export default new UserService(); 