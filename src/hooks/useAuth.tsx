
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
      console.log('Fetching user data for ID:', userId);
      
      // Fetch user profile and permissions
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Mesmo com erro, definir loading como false para evitar loop
        setUserRole(null);
        setUserPermissions([]);
        setLoading(false);
        return;
      }

      console.log('Profile fetched:', profile);
      
      if (profile) {
        setUserRole(profile.role);
        console.log('User role set to:', profile.role);
      }

      const { data: permissions, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('module_name')
        .eq('user_id', userId)
        .eq('can_access', true);
      
      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
        // Mesmo com erro, definir permissões vazias e loading como false
        setUserPermissions([]);
        setLoading(false);
        return;
      }

      console.log('Permissions fetched:', permissions);
      
      const moduleNames = permissions?.map(p => p.module_name) || [];
      setUserPermissions(moduleNames);
      console.log('User permissions set to:', moduleNames);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // CRÍTICO: sempre definir loading como false, mesmo com erro
      setUserRole(null);
      setUserPermissions([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Buscar dados do usuário apenas se ainda estiver carregando ou se o usuário mudou
          fetchUserData(session.user.id);
        } else {
          // Se não há usuário logado, limpar dados e parar loading
          setUserRole(null);
          setUserPermissions([]);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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
