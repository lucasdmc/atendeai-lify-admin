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
      
      // Definir valores padrão imediatamente para evitar timeout
      setUserRole('admin_lify');
      setUserPermissions(rolePermissions['admin_lify'] || []);
      
      // Buscar perfil do usuário em background (não bloqueante)
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, name')
        .eq('user_id', userId)
        .maybeSingle();
      
      console.log('🔄 [useAuth] Profile query result:', { profile, profileError });
      
      if (profileError) {
        console.error('❌ [useAuth] Error fetching profile:', profileError);
        // Manter valores padrão já definidos
        return;
      }

      // Se o perfil não existe, criar automaticamente em background
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

        console.log('🔄 [useAuth] Create profile result:', { newProfile, createError });

        if (createError) {
          console.error('❌ [useAuth] Error creating profile:', createError);
          // Manter valores padrão já definidos
          return;
        }

        const role = newProfile?.role || 'admin_lify';
        console.log('✅ [useAuth] Setting role from new profile:', role);
        setUserRole(role);
        setUserPermissions(rolePermissions[role as keyof typeof rolePermissions] || []);
        return;
      }

      // Atualizar com dados reais do perfil
      console.log('✅ [useAuth] Setting role from existing profile:', profile.role);
      setUserRole(profile.role);
      setUserPermissions(rolePermissions[profile.role as keyof typeof rolePermissions] || []);
      
    } catch (error) {
      console.error('❌ [useAuth] Error fetching user data:', error);
      // Manter os valores padrão já definidos
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
          // Definir valores padrão imediatamente
          setUserRole('admin_lify');
          setUserPermissions(rolePermissions['admin_lify'] || []);
          setLoading(false);
          
          // Buscar dados reais em background
          fetchUserData(session.user.id).catch((error) => {
            console.error('❌ [useAuth] Error in fetchUserData during auth change:', error);
          });
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
        // Definir valores padrão imediatamente
        setUserRole('admin_lify');
        setUserPermissions(rolePermissions['admin_lify'] || []);
        setLoading(false);
        
        // Buscar dados reais em background
        fetchUserData(session.user.id).catch((error) => {
          console.error('❌ [useAuth] Error in fetchUserData during initial session:', error);
        });
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
    }, 10000); // Aumentado para 10 segundos para dar mais tempo

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
