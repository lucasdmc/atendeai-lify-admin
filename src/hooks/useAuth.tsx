import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { rolePermissions } from '@/components/users/UserRoleUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  userRole: string | null;
  userPermissions: string[];
  userId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { toast } = useToast();

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      console.log('🔄 [useAuth] Fetching user data for ID:', userId);
      
      // Buscar perfil do usuário com cache
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, name')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error('❌ [useAuth] Error fetching profile:', profileError);
        setUserRole('admin_lify');
        setUserPermissions(rolePermissions['admin_lify'] || []);
        return;
      }

      // Se o perfil não existe, criar automaticamente
      if (!profile) {
        console.log('🔄 [useAuth] Profile not found, creating new profile...');
        
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            email: user?.email || 'user@example.com',
            name: user?.email?.split('@')[0] || 'Usuário',
            role: 'admin_lify',
            status: true
          })
          .select('role, name')
          .single();

        if (createError) {
          console.error('❌ [useAuth] Error creating profile:', createError);
        }

        const role = newProfile?.role || 'admin_lify';
        setUserRole(role);
        setUserPermissions(rolePermissions[role as keyof typeof rolePermissions] || []);
        return;
      }

      setUserRole(profile.role);
      setUserPermissions(rolePermissions[profile.role as keyof typeof rolePermissions] || []);
      
    } catch (error) {
      console.error('❌ [useAuth] Error fetching user data:', error);
      setUserRole('admin_lify');
      setUserPermissions(rolePermissions['admin_lify'] || []);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 [useAuth] Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setUserId(session?.user?.id || null);
        
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setUserRole(null);
          setUserPermissions([]);
          setLoading(false);
        }
      }
    );

    // Verificar sessão inicial com timeout reduzido
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('🔄 [useAuth] Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setUserId(session?.user?.id || null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('❌ [useAuth] Error getting session:', error);
      setLoading(false);
    });

    // Timeout reduzido para melhor performance
    const timeoutId = setTimeout(() => {
      if (mounted && !hasInitialized) {
        console.warn('⚠️ [useAuth] Loading timeout, forcing completion');
        setLoading(false);
        setHasInitialized(true);
      }
    }, 5000); // Reduzido para 5 segundos

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [hasInitialized]);

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

  const signOut = useCallback(async () => {
    try {
      // Optimized logout - only essential cleanup
      await supabase.auth.signOut();
      setUserRole(null);
      setUserPermissions([]);
      setHasInitialized(false);
      
      console.log('✅ Logout concluído com sucesso');
    } catch (error) {
      console.error('⚠️ Erro no logout:', error);
    }
  }, []);

  const contextValue = useMemo(() => ({
    user,
    session,
    loading,
    signIn,
    signOut,
    userRole,
    userPermissions,
    userId,
  }), [user, session, loading, signIn, signOut, userRole, userPermissions, userId]);

  return (
    <AuthContext.Provider value={contextValue}>
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
