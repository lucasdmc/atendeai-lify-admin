import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  userRole: string | null;
  userPermissions: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchUserData = async (userId: string) => {
    try {
      console.log('🔄 Fetching user data for ID:', userId);
      
      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('❌ Error fetching profile:', profileError);
        setUserRole(null);
        setUserPermissions([]);
        return;
      }

      console.log('✅ Profile fetched:', profile);
      
      if (profile) {
        setUserRole(profile.role);
        console.log('✅ User role set to:', profile.role);

        // Se for admin_lify, dar acesso total incluindo permissões específicas
        if (profile.role === 'admin_lify') {
          const allPermissions = [
            'dashboard',
            'conversas',
            'conectar_whatsapp',
            'agentes',
            'agendamentos',
            'clinicas',
            'criar_clinicas',
            'deletar_clinicas',
            'contextualizar',
            'gestao_usuarios',
            'configuracoes'
          ];
          setUserPermissions(allPermissions);
          console.log('🎯 Admin Lify - All permissions granted:', allPermissions);
        } else {
          // Para outros roles, buscar permissões específicas
          const { data: rolePermissions, error: rolePermissionsError } = await supabase
            .from('role_permissions')
            .select('module_name')
            .eq('role', profile.role)
            .eq('can_access', true);
          
          if (rolePermissionsError) {
            console.error('❌ Error fetching role permissions:', rolePermissionsError);
            setUserPermissions([]);
            return;
          }

          const moduleNames = rolePermissions?.map(p => p.module_name) || [];
          setUserPermissions(moduleNames);
          console.log('✅ User permissions set to:', moduleNames);
        }
      }
      
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      setUserRole(null);
      setUserPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchUserData(session.user.id);
        } else {
          setUserRole(null);
          setUserPermissions([]);
          setLoading(false);
        }
      }
    );

    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('🔄 Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setUserPermissions([]);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signOut,
      userRole,
      userPermissions,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
