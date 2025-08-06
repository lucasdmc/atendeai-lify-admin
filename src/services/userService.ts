import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';

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
   * Listar usuários via Supabase
   */
  async listUsers(): Promise<{ success: boolean; users?: User[]; error?: string }> {
    try {
      console.log('🔄 Listando usuários via Supabase...');
      
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select(`
          user_id,
          name,
          email,
          role,
          status,
          created_at,
          clinic_id,
          clinics(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw new Error(error.message || 'Erro ao listar usuários');
      }

      console.log('✅ Usuários carregados do Supabase:', users);
      
      // Mapear para o formato esperado
      const mappedUsers: User[] = users.map((user: any) => ({
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
   * Criar usuário via Supabase Edge Function
   */
  async createUser(userData: CreateUserData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('🔄 Criando usuário via Supabase Edge Function...');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-user-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erro da Edge Function:', data);
        throw new Error(data.error || 'Erro ao criar usuário');
      }

      console.log('✅ Usuário criado via Edge Function:', data.user);
      
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
   * Listar clínicas via Supabase
   */
  async listClinics(): Promise<{ success: boolean; clinics?: Clinic[]; error?: string }> {
    try {
      console.log('🔄 Listando clínicas via Supabase...');
      
      const { data: clinics, error } = await supabase
        .from('clinics')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw new Error(error.message || 'Erro ao listar clínicas');
      }

      console.log('✅ Clínicas carregadas do Supabase:', clinics);
      
      const mappedClinics: Clinic[] = clinics.map((clinic: any) => ({
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