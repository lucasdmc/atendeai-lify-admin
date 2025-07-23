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
   * Listar usuários via backend (sem autenticação para teste)
   */
  async listUsers(): Promise<{ success: boolean; users?: User[]; error?: string }> {
    try {
      console.log('🔄 Listando usuários via backend...');
      
      const response = await fetch(`${BACKEND_URL}/api/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erro do backend:', data);
        throw new Error(data.error || 'Erro ao listar usuários');
      }

      console.log('✅ Usuários carregados do backend:', data.users);
      
      // Mapear para o formato esperado
      const mappedUsers: User[] = data.users.map((user: any) => ({
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        clinicId: user.clinic_id
      }));

      return { success: true, users: mappedUsers };
    } catch (error) {
      console.error('❌ Erro ao listar usuários:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Criar usuário via backend (sem autenticação para teste)
   */
  async createUser(userData: CreateUserData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('🔄 Criando usuário via backend...');
      
      const response = await fetch(`${BACKEND_URL}/api/users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erro do backend:', data);
        throw new Error(data.error || 'Erro ao criar usuário');
      }

      console.log('✅ Usuário criado no backend:', data.user);
      
      const mappedUser: User = {
        id: data.user.user_id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        status: data.user.status,
        created_at: data.user.created_at,
        clinicId: data.user.clinic_id
      };

      return { success: true, user: mappedUser };
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Listar clínicas via backend (sem autenticação para teste)
   */
  async listClinics(): Promise<{ success: boolean; clinics?: Clinic[]; error?: string }> {
    try {
      console.log('🔄 Listando clínicas via backend...');
      
      const response = await fetch(`${BACKEND_URL}/api/clinics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erro do backend:', data);
        throw new Error(data.error || 'Erro ao listar clínicas');
      }

      console.log('✅ Clínicas carregadas do backend:', data.clinics);
      
      const mappedClinics: Clinic[] = data.clinics.map((clinic: any) => ({
        id: clinic.id,
        name: clinic.name
      }));

      return { success: true, clinics: mappedClinics };
    } catch (error) {
      console.error('❌ Erro ao listar clínicas:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }
}

export default new UserService(); 